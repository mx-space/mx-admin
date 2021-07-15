import RefreshCircle from '@vicons/ionicons5/es/RefreshCircle'
import Settings from '@vicons/tabler/es/Settings'
import { Icon } from '@vicons/utils'
import { useStorageObject } from 'hooks/use-storage'
import { useLayout } from 'layouts/content'
import { throttle } from 'lodash-es'
import { editor } from 'monaco-editor'

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NH5,
  NInput,
  NInputNumber,
  NModal,
  NP,
  NPopover,
  NSelect,
  NSpin,
  NText,
} from 'naive-ui'
import {
  defineAsyncComponent,
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue'
import { MonacoEditor } from '../monaco'
import { PlainEditor } from '../plain'
import { VditorEditor } from '../vditor'
import { editorBaseProps } from './base'
import { GeneralSettingDto } from './config'
import './toggle.css'
const StorageKeys = {
  editor: 'editor-pref',
  general: 'editor-general',
} as const
enum Editor {
  monaco = 'monaco',
  vditor = 'vditor',
  plain = 'plain',
}

export const EditorToggleWrapper = defineAsyncComponent({
  loader: () =>
    Promise.resolve(
      defineComponent({
        props: {
          ...editorBaseProps,
          loading: {
            type: Boolean,
            required: true,
          },
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

          const { storage: generalSetting, reset: resetGeneralSetting } =
            useStorageObject<GeneralSettingDto>(
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
                {/* <NFormItemRow label="通用设置"></NFormItemRow> */}
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
                    onUpdateValue={(e) =>
                      void (generalSetting.fontSize = e ?? 14)
                    }
                    value={generalSetting.fontSize}
                  />
                </NFormItem>
                <NFormItem label="注意: " labelAlign="right">
                  <NP>以上设定暂时不适于 Monaco Editor</NP>
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
                if (props.loading) {
                  return (
                    <div
                      class="w-full text-center"
                      style={{ height: 'calc(100vh - 18rem)' }}
                    >
                      <NSpin strokeWidth={14} show rotate />
                    </div>
                  )
                }
                switch (currentEditor.value) {
                  case 'monaco':
                    // @ts-expect-error
                    return <MonacoEditor {...props} innerRef={monacoRef} />

                  case 'vditor':
                    return <VditorEditor {...props} />

                  case 'plain':
                    return <PlainEditor {...props} />
                  default:
                    return null
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
                  style="max-width: 90vw;width: 500px; max-height: 65vh; overflow: auto"
                  bordered={false}
                >
                  <NP class="text-center">
                    <NText depth="3">此设定仅存储在本地!</NText>
                  </NP>
                  <NForm
                    labelPlacement="left"
                    labelWidth="8rem"
                    labelAlign="right"
                  >
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
      }),
    ),
  loadingComponent: <NSpin show strokeWidth={14} rotate />,
  suspensible: true,
})

const ResetIconButton = defineComponent({
  props: {
    resetFn: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <NPopover trigger="hover">
        {{
          trigger() {
            return (
              <NButton text class="ml-2" onClick={() => props.resetFn()}>
                <Icon size="20">
                  <RefreshCircle />
                </Icon>
              </NButton>
            )
          },
          default() {
            return '将会重置这些设定'
          },
        }}
      </NPopover>
    )
  },
})
