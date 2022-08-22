import { RESTManager } from './rest'

export const checkIsInit = async (): Promise<boolean> => {
  try {
    // FIXME
    return (
      window.injectData?.INIT ??
      (await RESTManager.api.init.get<{ isInit: boolean }>()).isInit
    )
  } catch (e) {
    return true
  }
}
