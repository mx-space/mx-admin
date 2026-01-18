import QProgress from 'qier-progress'

import { userApi } from '~/api/user'
import { API_URL, GATEWAY_URL } from '~/constants/env'
import { SESSION_WITH_LOGIN } from '~/constants/keys'
import { LayoutStore } from '~/stores/layout'
import { getTokenIsUpstream } from '~/stores/user'
import { removeToken, setToken } from '~/utils/auth'
import { checkIsInit } from '~/utils/is-init'

import { configs } from '../configs'
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
    console.error(
      'missing api url or gateway url',
      API_URL,
      GATEWAY_URL,
      ', redirect to /setup-api',
    )
    return '/setup-api'
  }

  progress.start()
  // guard for setup route

  if (to.path === '/setup') {
    // if (__DEV__) {
    //   return
    // }
    const isInit = await checkIsInit()
    // console.log('[isInit]', isInit)
    if (isInit) {
      return '/'
    }
  }

  if (to.meta.isPublic || to.fullPath.startsWith('/dev')) {
    return
  } else {
    const now = Date.now()
    if (now - lastCheckedLogAt < 1000 * 60 * 5) {
      return
    }
    const { ok } = await userApi.checkLogged()
    lastCheckedLogAt = now
    if (!ok) {
      return `/login?from=${encodeURI(to.fullPath)}`
    } else {
      import('~/socket').then((mo) => {
        mo.socket.initIO()
      })

      const sessionWithLogin = sessionStorage.getItem(SESSION_WITH_LOGIN)
      if (sessionWithLogin) return
      // login with token only
      if (loginWithTokenOnce || getTokenIsUpstream()) {
        return
      } else {
        await userApi
          .loginWithToken()
          .then((res) => {
            loginWithTokenOnce = true
            removeToken()
            setToken(res.token)

            import('~/socket').then((mo) => {
              mo.socket.initIO()
            })
          })
          .catch(() => {
            console.error('登陆失败')
            location.reload()
          })
      }
    }
  }
})

router.afterEach((to, _) => {
  document.title = getPageTitle(to?.meta.title as any)
  progress.finish()
  // 路由变化后重置 layout store，清除旧 VNode 引用
  // 注意：必须在 afterEach 中调用，而不是 beforeEach，否则组件还在渲染时 VNode 就被清空会导致错误
  LayoutStore().reset()
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
