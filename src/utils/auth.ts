import Cookies from 'js-cookie'

export const TokenKey = 'mx-token'

/**
 * 带了 bearer
 */
export function getToken(): string | null {
  const token = Cookies.get(TokenKey)
  return token ? `bearer ${token}` : null
}

export function setToken(token: string, expires: number | Date) {
  if (typeof token !== 'string') {
    return
  }
  return Cookies.set(TokenKey, token, { expires })
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
