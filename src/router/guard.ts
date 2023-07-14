import { API_URL, GATEWAY_URL } from 'constants/env'
import QProgress from 'qier-progress'
import { removeToken, setToken } from 'utils/auth'
import { checkIsInit } from 'utils/is-init'

import { configs } from '../configs'
import { RESTManager } from '../utils/rest'
import { router } from './router'

export const progress = new QProgress({ colorful: false, color: '#1a9cf3' })
const title = configs.title

let loginWithTokenOnce = false
let lastCheckedLogAt = 0
router.beforeEach(async (to) => {
  if (to.path === '/setup-api') {
    return
  }

  if (!API_URL || !GATEWAY_URL) {
    return '/setup-api'
  }

  progress.start()
  // guard for setup route

  if (to.path === '/setup') {
    if (__DEV__) {
      return
    }
    const isInit = await checkIsInit()
    console.log('[isInit]', isInit)
    if (isInit) {
      return '/'
    }
  }

  if (to.meta.isPublic || to.fullPath.startsWith('/dev')) {
    return
  } else {
    const now = +new Date()
    if (now - lastCheckedLogAt < 1000 * 60 * 5) {
      return
    }
    const { ok } = await RESTManager.api('master')('check_logged').get<{
      ok: number
    }>()
    lastCheckedLogAt = now
    if (!ok) {
      return `/login?from=${encodeURI(to.fullPath)}`
    } else {
      // login with token only
      if (loginWithTokenOnce) {
        return
      } else {
        await RESTManager.api.master.login
          .put<{ token: string }>()
          .then((res) => {
            loginWithTokenOnce = true
            removeToken()
            setToken(res.token)

            import('socket').then((mo) => {
              mo.socket.initIO()
            })
          })
          .catch(() => {
            console.log('登陆失败')
            location.reload()
          })
      }
    }
  }
})

router.afterEach((to, _) => {
  document.title = getPageTitle(to?.meta.title as any)
  progress.finish()
})

// HACK editor save
router.afterEach((to) => {
  if (to.hash == '|publish') {
    router.replace({ ...to, hash: '' })
  }
})

router.onError((err) => {
  progress.finish()
  if (err == '网络错误') {
    return router.push('/setup-api')
  }
})

function getPageTitle(pageTitle?: string | null) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
