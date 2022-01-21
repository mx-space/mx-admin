export const WEB_URL: string =
  window.injectData.WEB_URL ||
  (import.meta.env.VITE_APP_WEB_URL as string) ||
  'http://localhost:2323'

export const bgUrl =
  window.injectData.LOGIN_BG ||
  (import.meta.env.VITE_APP_LOGIN_BG as string) ||
  'https://gitee.com/xun7788/my-imagination/raw/master/uPic/1615516941397.jpg'

export const API_URL = (() => {
  const url =
    new URLSearchParams(location.search).get('__api') ||
    window.injectData.BASE_API ||
    (import.meta.env.VITE_APP_BASE_API as string)

  return url.endsWith('/') ? url.slice(0, -1) : url
})()

export const GATEWAY_URL =
  window.injectData.GATEWAY ||
  import.meta.env.VITE_APP_GATEWAY ||
  'http://localhost:2333'
