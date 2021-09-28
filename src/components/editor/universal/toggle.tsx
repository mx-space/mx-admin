/**
 * 编辑器切换
 *
 */

// TODO: auto save & temp cache
import Settings from '@vicons/tabler/es/Settings'
import { Icon } from '@vicons/utils'
import { useLayout } from 'layouts/content'
import { throttle } from 'lodash-es'
import { editor } from 'monaco-editor'
import {
  NCard,
  NForm,
  NFormItem,
  NModal,
  NP,
  NSelect,
  NSpin,
  NText,
} from 'naive-ui'
import Vditor from 'vditor'
import {
  defineAsyncComponent,
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue'
import { Editor, EditorStorageKeys } from './constants'
import { getDynamicEditor } from './get-editor'
import { editorBaseProps } from './props'
import './toggle.css'
import { useEditorConfig } from './use-editor-setting'
import { useGetPrefEditor } from './use-get-pref-editor'

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
          const prefEditor = useGetPrefEditor()
          const currentEditor = ref<Editor>(prefEditor ?? Editor.monaco)
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
                localStorage.setItem(
                  EditorStorageKeys.editor,
                  JSON.stringify(n),
                )
              },
              300,
              { trailing: true },
            ),
          )

          const monacoRef = ref<editor.IStandaloneCodeEditor>()
          const vditorRef = ref<Vditor>()

          const [
            { GeneralSetting, generalSetting, resetGeneralSetting },
            { VditorSetting, resetVditorSetting, vditorSetting },
          ] = useEditorConfig()
          // vditor 监听
          // FIXME: vditor bug, can't re-set option on instance
          {
            watch(
              () => vditorSetting.typewriterMode,
              (n) => {
                const vRef = vditorRef.value
                if (!vRef) {
                  return
                }
                const options = vRef.vditor.options

                options.typewriterMode = n
              },
            )
          }

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
                      class="w-full flex items-center justify-center"
                      style={{ height: 'calc(100vh - 18rem)' }}
                    >
                      <NSpin strokeWidth={14} show rotate />
                    </div>
                  )
                }
                switch (currentEditor.value) {
                  case 'monaco': {
                    const MonacoEditor = getDynamicEditor(currentEditor.value)

                    return <MonacoEditor ref={monacoRef} {...props} />
                  }
                  case 'vditor': {
                    const VditorEditor = getDynamicEditor(currentEditor.value)
                    return <VditorEditor {...props} innerRef={vditorRef} />
                  }
                  case 'plain':
                    const PlainEditor = getDynamicEditor(currentEditor.value)
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

                    {currentEditor.value == Editor.vditor && <VditorSetting />}
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
