import { getJson } from './http'

export interface DependencyGraph {
  dependencies: Record<string, string>
}

export interface NpmPackageLatest {
  name: string
  version: string
}

export function getDependencyGraph() {
  return getJson<DependencyGraph>('/dependencies/graph')
}

export function installDependencies(packageNames: string | string[]) {
  const names = Array.isArray(packageNames)
    ? packageNames.join(',')
    : packageNames

  return getJson<void>('/dependencies/install_deps', {
    packageNames: names,
  })
}

export async function getNpmPackageLatest(name: string) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
  )

  if (!response.ok) {
    throw new Error(`获取 ${name} 最新版本失败`)
  }

  return (await response.json()) as NpmPackageLatest
}
