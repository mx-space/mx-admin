import { useStorageObject } from 'hooks/use-storage'
import { NFormItem, NH5, NInput, NInputNumber, NP, NSwitch } from 'naive-ui'

import { GeneralSettingDto } from './editor-config'
import { ResetIconButton } from './reset-icon-button'

const StorageKeys = {
  editor: 'editor-pref',
  general: 'editor-general',
} as const
export const useEditorConfig = () => {
  const { storage: generalSetting, reset: resetGeneralSetting } =
    useStorageObject(GeneralSettingDto, StorageKeys.general)

  const GeneralSetting = defineComponent(() => {
    return () => (
      <Fragment>
        <NH5 class="!flex items-center !mt-0">
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
        <NFormItem label="注意: " labelAlign="right">
          <NP>以上设定暂时不适于 Monaco Editor</NP>
        </NFormItem>

        <NFormItem label="自动纠正标点">
          <NSwitch
            value={generalSetting.autocorrect}
            onUpdateValue={(e) => void (generalSetting.autocorrect = e)}
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
  }
}
