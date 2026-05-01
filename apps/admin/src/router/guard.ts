import QProgress from 'qier-progress'

import { userApi } from '~/api/user'
import { API_URL, GATEWAY_URL } from '~/constants/env'
import { LayoutStore } from '~/stores/layout'
import { checkIsInit } from '~/utils/is-init'

import { configs } from '../configs'
import { router } from './router'

export const progress = new QProgress({ colorful: false, color: '#1a9cf3' })
const title = configs.title

let lastCheckedLogAt = 0
let layoutMutationSnapshotAtNavigation: ReturnType<
  ReturnType<typeof LayoutStore>['getMutationSnapshot']
> | null = null

router.beforeEach(async (to) => {
  layoutMutationSnapshotAtNavigation = LayoutStore().getMutationSnapshot()

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
    const isInit = await checkIsInit()
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
    }
  }
})

router.afterEach((to, from) => {
  document.title = getPageTitle(to?.meta.title as any)
  progress.finish()
  // 跨页面（route.name 变化）时重置 layout store，清除旧 VNode 引用
  // 同一页面内的参数/查询变化不重置，以保留 header actions 等状态
  // 注意：使用导航前快照 + microtask，仅重置未被新页面覆盖的字段，避免 setActions 与 reset 竞态
  if (to.name !== from.name) {
    const layoutStore = LayoutStore()
    const mutationSnapshot =
      layoutMutationSnapshotAtNavigation ?? layoutStore.getMutationSnapshot()
    queueMicrotask(() => {
      layoutStore.resetIfUnchanged(mutationSnapshot)
    })
  }
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
