import { toast } from 'vue-sonner'

import { systemApi } from '~/api/system'

export const checkIsInit = async (): Promise<boolean> => {
  try {
    const injectInit = window.injectData?.INIT
    if (typeof injectInit === 'boolean') {
      return injectInit
    }

    const res = await systemApi.checkInit()
    if (typeof res !== 'object' || !('isInit' in res)) {
      // 返回 false，让调用方处理跳转
      toast.error('api error')
      return false
    }
    return res.isInit === true
  } catch (error) {
    console.error(error)
    return false
  }
}
