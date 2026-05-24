import { useEffect, useMemo, useSyncExternalStore } from 'react'

export const themeColors = {
  primary: '#1a9cf3',
  primaryDeep: '#0f7ec4',
  primaryShallow: '#4fb5f7',
} as const

export type ThemeMode = 'dark' | 'light' | 'system'

export function useThemeMode() {
  const query = useMemo(
    () => window.matchMedia('(prefers-color-scheme: dark)'),
    [],
  )

  const isDark = useSyncExternalStore(
    (onStoreChange) => {
      query.addEventListener('change', onStoreChange)

      return () => query.removeEventListener('change', onStoreChange)
    },
    () => {
      const storedTheme = readThemeMode()

      if (storedTheme === 'dark') return true
      if (storedTheme === 'light') return false

      return query.matches
    },
    () => false,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return { isDark }
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

function readThemeMode(): ThemeMode {
  const storedTheme = localStorage.getItem('theme-mode')?.replace(/^"|"$/g, '')

  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme

  return 'system'
}
