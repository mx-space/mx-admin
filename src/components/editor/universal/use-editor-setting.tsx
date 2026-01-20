import {
  NFormItem,
  NH5,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
} from 'naive-ui'
import { defineComponent } from 'vue'

import { useStorageObject } from '~/hooks/use-storage'

import { GeneralSettingSchema } from './editor-config'
import { ResetIconButton } from './reset-icon-button'

const StorageKeys = {
  editor: 'editor-pref',
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

  const GeneralSetting = defineComponent(() => {
    return () => (
      <Fragment>
        <NH5 class="!mt-0 !flex items-center">
          通用设置
          <ResetIconButton resetFn={resetGeneralSetting} />
        </NH5>
        <NFormItem label="字体设定">
          <NInput
            onInput={(e) => void (generalSetting.fontFamily = e)}
            value={generalSetting.fontFamily}
          />
        </NFormItem>
        <NFormItem label="字号设定">
          <NInputNumber
            onUpdateValue={(e) => void (generalSetting.fontSize = e ?? 14)}
            value={generalSetting.fontSize}
          />
        </NFormItem>

        <NFormItem label="自动纠正标点">
          <NSwitch
            value={generalSetting.autocorrect}
            onUpdateValue={(e) => void (generalSetting.autocorrect = e)}
          />
        </NFormItem>
        <NFormItem label="渲染模式">
          <NSelect
            value={generalSetting.renderMode}
            to="body"
            onUpdateValue={(e) =>
              void (generalSetting.renderMode = e as 'plain' | 'wysiwyg')
            }
            options={[
              { label: '普通模式', value: 'plain' },
              { label: '所见即所得', value: 'wysiwyg' },
            ]}
          />
        </NFormItem>
      </Fragment>
    )
  })

  return {
    general: {
      setting: generalSetting,
      resetSetting: resetGeneralSetting,
      Panel: GeneralSetting,
    },

    destory,
  }
}
