import { router } from '~/router'

import { RESTManager } from './rest'

export const checkIsInit = async (): Promise<boolean> => {
  try {
    // FIXME
    return (
      window.injectData?.INIT ??
      (
        await RESTManager.api.init
          .get<{ isInit: boolean }>({
            errorHandler(e) {
              if (e?.response.status == 404) {
                return { isInit: true }
              }
              throw e
            },
          })
          .then((res) => {
            if (typeof res !== 'object' || (res && !('isInit' in res))) {
              console.log('err sss')
              router.push('/setup-api')
              message.error('api error')
            }
            return res
          })
      ).isInit === true
    )
  } catch (e) {
    console.error(e)
    return false
  }
}
