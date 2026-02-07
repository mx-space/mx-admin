import { debounce } from 'es-toolkit/function'

const CACHE_KEY = 'ata-type-cache'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

interface CacheEntry {
  code: string
  ts: number
}

type MonacoModule = typeof import('monaco-editor')
type LanguageServiceDefaults = MonacoModule['typescript']['typescriptDefaults']

interface PackageEntry {
  entryFile: string
  packageRoot: string
  score: number
}

const packageEntries = new Map<string, PackageEntry>()

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function toVfsPath(path: string): string {
  if (!path.startsWith('file://')) return normalizePath(path)
  const withoutProtocol = path.replace(/^file:\/\/(?:localhost)?/, '')
  return normalizePath(decodeURIComponent(withoutProtocol))
}

function loadCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, CacheEntry>) {
  const now = Date.now()
  const pruned: Record<string, CacheEntry> = {}
  for (const [k, v] of Object.entries(cache)) {
    if (now - v.ts < CACHE_TTL) pruned[k] = v
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(pruned))
  } catch {
    localStorage.removeItem(CACHE_KEY)
  }
}

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`
}

function parseNodeModulePath(path: string): {
  packageName: string
  packageRoot: string
  packageInternalPath: string
} | null {
  const normalizedPath = normalizePath(path)
  const marker = '/node_modules/'
  const markerIndex = normalizedPath.indexOf(marker)
  if (markerIndex === -1) return null

  const tail = normalizedPath.slice(markerIndex + marker.length)
  if (!tail) return null

  const segments = tail.split('/').filter(Boolean)
  if (segments.length === 0) return null

  let packageName = segments[0]!
  let packageInternalPathSegments = segments.slice(1)

  if (packageName.startsWith('@')) {
    if (segments.length < 2) return null
    packageName = `${packageName}/${segments[1]}`
    packageInternalPathSegments = segments.slice(2)
  }

  return {
    packageName,
    packageRoot: `/node_modules/${packageName}`,
    packageInternalPath: packageInternalPathSegments.join('/'),
  }
}

function addExtraLibIfNeeded(
  defaults: LanguageServiceDefaults,
  filePath: string,
  code: string,
) {
  const existing = defaults.getExtraLibs()[filePath]
  if (existing?.content === code) return false
  defaults.addExtraLib(code, filePath)
  return true
}

function ensurePackagePathMappings(monaco: MonacoModule) {
  if (packageEntries.size === 0) return

  const mappedPaths: Record<string, string[]> = {}
  for (const [pkg, entry] of packageEntries) {
    mappedPaths[pkg] = [entry.entryFile]
    mappedPaths[`${pkg}/*`] = [`${toFileUri(entry.packageRoot)}/*`]
  }

  const applyToDefaults = (defaults: LanguageServiceDefaults) => {
    const compilerOptions = defaults.getCompilerOptions()
    const nextPaths = { ...(compilerOptions.paths || {}) }
    let changed = false

    for (const [key, values] of Object.entries(mappedPaths)) {
      const prev = nextPaths[key]
      if (
        !prev ||
        prev.length !== values.length ||
        prev.some((item, idx) => item !== values[idx])
      ) {
        nextPaths[key] = values
        changed = true
      }
    }

    if (!compilerOptions.baseUrl) {
      changed = true
    }

    if (changed) {
      defaults.setCompilerOptions({
        ...compilerOptions,
        baseUrl: compilerOptions.baseUrl || 'file:///',
        paths: nextPaths,
      })
    }
  }

  applyToDefaults(monaco.typescript.typescriptDefaults)
  applyToDefaults(monaco.typescript.javascriptDefaults)
}

function updatePackageEntryFromPath(
  monaco: MonacoModule,
  path: string,
  code: string,
) {
  const parsed = parseNodeModulePath(toVfsPath(path))
  if (!parsed) return

  let candidate:
    | {
        entryFile: string
        score: number
      }
    | undefined

  if (parsed.packageInternalPath === 'package.json') {
    try {
      const pkg = JSON.parse(code) as {
        types?: string
        typings?: string
      }
      const typeEntry = pkg.types || pkg.typings
      if (typeof typeEntry === 'string' && typeEntry.trim().length > 0) {
        const normalizedTypeEntry = normalizePath(
          typeEntry.replace(/^\.\/+/, ''),
        )
        candidate = {
          entryFile: toFileUri(
            `${parsed.packageRoot}/${normalizedTypeEntry}`.replace(/\/+/g, '/'),
          ),
          score: 3,
        }
      }
    } catch {
      // Ignore malformed package json in ATA output.
    }
  } else if (/^index\.d\.(ts|cts|mts)$/.test(parsed.packageInternalPath)) {
    candidate = {
      entryFile: toFileUri(toVfsPath(path)),
      score: 2,
    }
  } else if (/\.d\.(ts|cts|mts)$/.test(parsed.packageInternalPath)) {
    candidate = {
      entryFile: toFileUri(toVfsPath(path)),
      score: 1,
    }
  }

  if (!candidate) return

  const previous = packageEntries.get(parsed.packageName)
  if (
    previous &&
    (previous.score > candidate.score ||
      (previous.score === candidate.score &&
        previous.entryFile === candidate.entryFile))
  ) {
    return
  }

  packageEntries.set(parsed.packageName, {
    entryFile: candidate.entryFile,
    packageRoot: parsed.packageRoot,
    score: candidate.score,
  })
  ensurePackagePathMappings(monaco)
}

function addLibToMonaco(monaco: MonacoModule, path: string, code: string) {
  const filePath = toFileUri(path)
  const tsChanged = addExtraLibIfNeeded(
    monaco.typescript.typescriptDefaults,
    filePath,
    code,
  )
  const jsChanged = addExtraLibIfNeeded(
    monaco.typescript.javascriptDefaults,
    filePath,
    code,
  )

  updatePackageEntryFromPath(monaco, path, code)
  console.log('[ATA] addLib', {
    path,
    filePath,
    tsChanged,
    jsChanged,
    codeLen: code.length,
  })
}

let ataInstance: ((code: string) => Promise<void>) | null = null

export async function initATA(monaco: MonacoModule) {
  const cache = loadCache()
  const cacheKeys = Object.keys(cache)
  console.log('[ATA] initATA, cache entries:', cacheKeys.length, cacheKeys)
  for (const [path, entry] of Object.entries(cache)) {
    addLibToMonaco(monaco, path, entry.code)
  }

  if (ataInstance) {
    console.log('[ATA] reusing existing instance')
    return ataInstance
  }

  const ts = await import('typescript')
  console.log(
    '[ATA] typescript loaded, version:',
    (ts as any).version ?? (ts as any).default?.version ?? 'unknown',
  )
  const { setupTypeAcquisition } = await import('@typescript/ata')

  const ata = setupTypeAcquisition({
    projectName: 'mx-func-editor',
    typescript: ts,
    delegate: {
      receivedFile(code: string, path: string) {
        console.log('[ATA] receivedFile:', path, 'length:', code.length)
        addLibToMonaco(monaco, path, code)
        cache[path] = { code, ts: Date.now() }
        saveCache(cache)
      },
      started() {
        console.log('[ATA] started fetching types')
      },
      finished(_files) {
        console.log(
          '[ATA] finished, total extraLibs:',
          monaco.typescript.typescriptDefaults.getExtraLibs(),
        )
      },
      errorMessage(msg: string) {
        console.warn('[ATA] error:', msg)
      },
    },
  })

  ataInstance = ata
  console.log('[ATA] instance created')
  return ata
}

export function createDebouncedATA(ataFn: (code: string) => Promise<void>) {
  return debounce(ataFn, 1000)
}
