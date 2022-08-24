import { RESTManager } from './rest'

export const checkIsInit = async (): Promise<boolean> => {
  try {
    // FIXME
    return (
      window.injectData?.INIT ??
      (
        await RESTManager.api.init.get<{ isInit: boolean }>({
          errorHandler(e) {
            if (e?.response.status == 404) {
              return
            }
            throw e
          },
        })
      ).isInit
    )
  } catch (e) {
    return true
  }
}
