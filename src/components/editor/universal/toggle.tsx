import Settings from '@vicons/tabler/es/Settings'
import { Icon } from '@vicons/utils'
import { useLayout } from 'layouts/content'
import { throttle } from 'lodash-es'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
} from 'naive-ui'
import { defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { editorBaseProps } from './base'
import { MonacoEditor } from '../monaco'
import { VditorEditor } from '../vditor'
import { useStorageObject } from 'hooks/use-storage'
import { GeneralSettingDto } from './config'
import './toggle.css'
import { editor } from 'monaco-editor'
const StorageKeys = {
  editor: 'editor-pref',
  general: 'editor-general',
} as const
enum Editor {
  monaco = 'monaco',
  vditor = 'vditor',
}

export const EditorToggleWrapper = defineComponent({
  props: {
    ...editorBaseProps,
  },
  setup(props) {
    const getPrefEditor = () => {
      const prefValue = localStorage.getItem(StorageKeys.editor)
      if (!prefValue) {
        return null
      }
      try {
        const pref = JSON.parse(prefValue)

        // valid

        const valid = Object.keys(Editor).includes(pref)
        if (valid) {
          return pref
        } else {
          return null
        }
      } catch {
        return null
      }
    }

    const currentEditor = ref<Editor>(getPrefEditor() ?? Editor.monaco)
    const modalOpen = ref(false)
    const layout = useLayout()
    onMounted(() => {
      layout.addFloatButton(
        <button
          onClick={() => {
            modalOpen.value = true
          }}
        >
          <Icon size={18}>
            <Settings />
          </Icon>
        </button>,
      )
    })

    watch(
      () => currentEditor.value,
      throttle(
        (n) => {
          localStorage.setItem(StorageKeys.editor, JSON.stringify(n))
        },
        300,
        { trailing: true },
      ),
    )

    const monacoRef = ref<editor.IStandaloneCodeEditor>()

    const generalSetting = useStorageObject<GeneralSettingDto>(
      GeneralSettingDto,
      StorageKeys.general,
    )

    watch(
      () => generalSetting,
      (n) => {
        if (!monacoRef.value) {
          return
        }
        // TODO
      },
      { deep: true, immediate: true },
    )

    const GeneralSetting = defineComponent(() => {
      return () => (
        <Fragment>
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
        </Fragment>
      )
    })

    return () => (
      <div
        style={
          {
            '--editor-font-size': generalSetting.fontSize
              ? generalSetting.fontSize + 'px'
              : '',
            '--editor-font-family': generalSetting.fontFamily,
          } as any
        }
        class={'editor-wrapper'}
      >
        {(() => {
          switch (currentEditor.value) {
            case 'monaco':
              // @ts-expect-error
              return <MonacoEditor {...props} innerRef={monacoRef} />

            case 'vditor':
              return <VditorEditor {...props} />
            default:
              break
          }
        })()}

        <NModal
          show={modalOpen.value}
          onUpdateShow={(s) => void (modalOpen.value = s)}
        >
          <NCard
            closable
            onClose={() => {
              modalOpen.value = false
            }}
            title="编辑器设定"
            style="max-width: 90vw;width: 500px"
            bordered={false}
          >
            <NForm labelPlacement="left" labelWidth="8rem" labelAlign="right">
              <NFormItem label="编辑器选择">
                <NSelect
                  value={currentEditor.value}
                  onUpdateValue={(e) => void (currentEditor.value = e)}
                  options={Object.keys(Editor).map((i) => ({
                    key: i,
                    label: i,
                    value: i,
                  }))}
                ></NSelect>
              </NFormItem>

              <GeneralSetting />
            </NForm>
          </NCard>
        </NModal>
      </div>
    )
  },
})
