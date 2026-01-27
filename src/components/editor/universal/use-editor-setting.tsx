import { useStorageObject } from '~/hooks/use-storage'

import { GeneralSettingSchema } from './editor-config'

const StorageKeys = {
  general: 'editor-general',
} as const

export const useEditorConfig = () => {
  const {
    storage: generalSetting,
    reset: resetGeneralSetting,
    destory: generalDestory,
  } = useStorageObject(GeneralSettingSchema, StorageKeys.general)

  const destory = () => {
    generalDestory()
  }

  return {
    general: {
      setting: generalSetting,
      resetSetting: resetGeneralSetting,
    },

    destory,
  }
}
