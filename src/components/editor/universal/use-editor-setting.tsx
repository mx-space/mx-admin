import { React } from '@vicons/fa'
import { useStorageObject } from 'hooks/use-storage'
import {
  NForm,
  NFormItem,
  NH5,
  NInput,
  NInputNumber,
  NP,
  NSwitch,
} from 'naive-ui'
import { GeneralSettingDto, VditorSettingDto } from './config'
import { ResetIconButton } from './reset-icon-button'

const StorageKeys = {
  editor: 'editor-pref',
  general: 'editor-general',

  vditor: 'editor-vditor-pref',
} as const
export const useEditorConfig = () => {
  const { storage: generalSetting, reset: resetGeneralSetting } =
    useStorageObject<GeneralSettingDto>(GeneralSettingDto, StorageKeys.general)

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
      </Fragment>
    )
  })

  const { storage: vditorSetting, reset: resetVditorSetting } =
    useStorageObject<VditorSettingDto>(VditorSettingDto, StorageKeys.vditor)

  const VditorSetting = defineComponent(() => {
    return () => (
      <>
        <NH5 class="!flex items-center !mt-0">
          Vditor 设定
          <ResetIconButton resetFn={resetVditorSetting} />
        </NH5>
        <NForm labelWidth="8rem" labelAlign="right">
          <NFormItem label="打字机模式" labelPlacement="left">
            <NSwitch
              value={vditorSetting.typewriterMode}
              onUpdateValue={(e) => void (vditorSetting.typewriterMode = e)}
            ></NSwitch>
          </NFormItem>
        </NForm>
      </>
    )
  })

  return [
    { generalSetting, resetGeneralSetting, GeneralSetting },
    { vditorSetting, resetVditorSetting, VditorSetting },
  ] as const
}
