export const BASE_URL: string =
  window.injectData.WEB_URL ||
  (import.meta.env.VITE_APP_WEB_URL as string) ||
  'http://localhost:2323'

export const bgUrl =
  window.injectData.LOGIN_BG ||
  (import.meta.env.VITE_APP_LOGIN_BG as string) ||
  'https://gitee.com/xun7788/my-imagination/raw/master/uPic/1615516941397.jpg'
