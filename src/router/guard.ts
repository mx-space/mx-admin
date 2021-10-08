import QProgress from 'qier-progress'
import { configs } from '../configs'
import { RESTManager } from '../utils/rest'
import { router } from './router'
export const progress = new QProgress({ colorful: false, color: '#1a9cf3' })
const title = configs.title

router.beforeEach(async (to) => {
  if (__DEV__) {
    return
  }
  progress.start()
  // guard for setup route

  if (to.path === '/setup') {
    const isInit =
      window.injectData.INIT ??
      (await RESTManager.api.init.get<{ isInit: boolean }>()).isInit

    console.log('[isInit]', isInit)
    if (isInit) {
      return '/'
    }
  }

  if (to.meta.isPublic || to.fullPath.startsWith('/dev')) {
    return
  } else {
    const { ok } = await RESTManager.api('master')('check_logged').get<{
      ok: number
    }>()
    if (!ok) {
      return '/login?from=' + encodeURI(to.fullPath)
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

router.onError(() => {
  progress.finish()
})

function getPageTitle(pageTitle?: string | null) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
