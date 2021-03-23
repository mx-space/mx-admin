import { configs } from '../configs'
import { router } from './router'
import QProgress from 'qier-progress'
import { RESTManager } from '../utils/rest'
export const progress = new QProgress()
const title = configs.title

router.beforeEach(async (to, _, next) => {
  progress.start()
  if (to.meta.isPublic) {
    next()
  } else {
    const { ok } = await RESTManager.api('master')('check_logged').get<{
      ok: number
    }>()
    if (ok) {
      next()
    } else {
      next('/login')
    }
  }
})

router.afterEach((to, _) => {
  document.title = getPageTitle(to?.meta.title as any)
  progress.finish()
})

function getPageTitle(pageTitle?: string | null) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
