import Cookies from 'js-cookie'

import { router } from '../router/router'
import { setTokenIsUpstream } from '~/stores/user'

export const TokenKey = 'mx-token'

/**
 * 带了 bearer
 */
export function getToken(): string | null {
  const token = Cookies.get(TokenKey)
  return token ? `bearer ${token}` : null
}

export function setToken(token: string) {
  if (typeof token !== 'string') {
    return
  }
  return Cookies.set(TokenKey, token, {
    expires: 14,
  })
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
export const attachTokenFromQuery = () => {
  const token = new URLSearchParams(window.location.search).get('token')
  if (token) {
    setToken(token)
    setTokenIsUpstream(true)

    router.isReady().then(() => {
      const parsedUrl = new URL(window.location.href)
      parsedUrl.searchParams.delete('token')

      // Vue router 在 hash 模式无法解决这个问题
      history.replaceState({}, '', parsedUrl.href)

      const query = {} as any
      for (const [key, value] of parsedUrl.searchParams.entries()) {
        query[key] = value
      }

      router.replace({
        path: parsedUrl.pathname,
        query,
      })
    })
  } else {
    // hash mode

    const hash = window.location.hash.slice(1)

    const parsedUrl = new URL(hash, window.location.origin)
    const token = parsedUrl.searchParams.get('token')
    if (token) {
      setToken(token)
      setTokenIsUpstream(true)
      parsedUrl.searchParams.delete('token')

      router.isReady().then(() => {
        const query = {} as any
        for (const [key, value] of parsedUrl.searchParams.entries()) {
          query[key] = value
        }

        router.replace({
          path: parsedUrl.pathname,
          query,
        })
      })
    }
  }
}
