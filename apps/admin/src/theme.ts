import { useEffect, useMemo, useSyncExternalStore } from 'react'

export const themeColors = {
  primary: '#1a9cf3',
  primaryDeep: '#0f7ec4',
  primaryShallow: '#4fb5f7',
} as const

export type ThemeMode = 'dark' | 'light' | 'system'

const themeModeChangeEvent = 'mx-admin-theme-mode-change'

export function useThemeMode() {
  const query = useMemo(
    () => window.matchMedia('(prefers-color-scheme: dark)'),
    [],
  )

  const snapshot = useSyncExternalStore(
    (onStoreChange) => {
      query.addEventListener('change', onStoreChange)
      window.addEventListener(themeModeChangeEvent, onStoreChange)

      return () => {
        query.removeEventListener('change', onStoreChange)
        window.removeEventListener(themeModeChangeEvent, onStoreChange)
      }
    },
    () => getThemeSnapshot(query),
    () => 'system:light',
  )
  const [themeMode, resolvedTheme] = snapshot.split(':') as [
    ThemeMode,
    'dark' | 'light',
  ]
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return { isDark, setThemeMode, themeMode }
}

export function installThemeTokens() {
  document.documentElement.style.setProperty(
    '--color-primary',
    themeColors.primary,
  )
  document.documentElement.style.setProperty(
    '--color-primary-shallow',
    themeColors.primaryShallow,
  )
  document.documentElement.style.setProperty(
    '--color-primary-deep',
    themeColors.primaryDeep,
  )
}

export function setThemeMode(themeMode: ThemeMode) {
  if (themeMode === 'system') {
    localStorage.removeItem('theme-mode')
  } else {
    localStorage.setItem('theme-mode', themeMode)
  }

  window.dispatchEvent(new Event(themeModeChangeEvent))
}

function getThemeSnapshot(query: MediaQueryList) {
  const themeMode = readThemeMode()
  const resolvedTheme =
    themeMode === 'system' ? (query.matches ? 'dark' : 'light') : themeMode

  return `${themeMode}:${resolvedTheme}` as const
}

function readThemeMode(): ThemeMode {
  const storedTheme = localStorage.getItem('theme-mode')?.replace(/^"|"$/g, '')

  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme

  return 'system'
}
