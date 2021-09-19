export const BASE_URL: string =
  window.injectData.WEB_URL ||
  (import.meta.env.VITE_APP_WEB_URL as string) ||
  'http://localhost:2323'

// export const __DEV__ = import.meta.env.DEV
