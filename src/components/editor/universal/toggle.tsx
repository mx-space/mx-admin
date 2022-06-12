/**
 * 编辑器切换
 *
 */
// TODO: 全屏预览
import { FullscreenExitOutlined, SettingsIcon } from 'components/icons'
import { useMountAndUnmount } from 'hooks/use-react'
import { useLayout } from 'layouts/content'
import { throttle } from 'lodash-es'
import type { editor } from 'monaco-editor'
import {
  NCard,
  NElement,
  NForm,
  NFormItem,
  NModal,
  NP,
  NSelect,
  NSpin,
  NText,
} from 'naive-ui'
import { Suspense, defineComponent, ref, watch } from 'vue'

import { Icon } from '@vicons/utils'

import { Editor, EditorStorageKeys } from './constants'
import styles from './editor.module.css'
import { getDynamicEditor } from './get-editor'
import { editorBaseProps } from './props'

import './toggle.css'

import { useEditorConfig } from './use-editor-setting'
import { useGetPrefEditor } from './use-get-pref-editor'

let hasFloatButton = false
export const _EditorToggleWrapper = defineComponent({
  props: {
    ...editorBaseProps,
    loading: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const prefEditor = useGetPrefEditor()
    const currentEditor = ref<Editor>(prefEditor ?? Editor.codemirror)
    const modalOpen = ref(false)
    const layout = useLayout()
    // FIXME vue 3 cannot ref type as custom component
    const wrapperRef = ref<any>()
    useMountAndUnmount(() => {
      if (hasFloatButton) {
        return
      }
      const settingButton = layout.addFloatButton(
        <button
          onClick={() => {
            modalOpen.value = true
          }}
        >
          <Icon size={18}>
            <SettingsIcon />
          </Icon>
        </button>,
      )

      const fullScreenButton = layout.addFloatButton(
        <button
          onClick={() => {
            wrapperRef.value?.$el.requestFullscreen()
          }}
        >
          <Icon size={18}>
            <FullscreenExitOutlined />
          </Icon>
        </button>,
      )
      hasFloatButton = true
      return () => {
        layout.removeFloatButton(settingButton)
        layout.removeFloatButton(fullScreenButton)
        hasFloatButton = false
      }
    })

    useMountAndUnmount(() => {
      document.addEventListener('fullscreenchange', (e) => {
        if (document.fullscreenElement === wrapperRef.value) {
          document.documentElement.classList.add('editor-fullscreen')
        } else {
          document.documentElement.classList.remove('editor-fullscreen')
        }
      })
    })

    watch(
      () => currentEditor.value,
      throttle(
        (n) => {
          localStorage.setItem(EditorStorageKeys.editor, JSON.stringify(n))
        },
        300,
        { trailing: true },
      ),
    )

    const monacoRef = ref<editor.IStandaloneCodeEditor>()

    const { general } = useEditorConfig()

    const EditorComponent = computed(() => {
      if (props.loading) {
        return (
          <div class={[styles['editor'], styles['loading']]}>
            <NSpin strokeWidth={14} show rotate />
          </div>
        )
      }
      switch (currentEditor.value) {
        case 'monaco': {
          const MonacoEditor = getDynamicEditor(currentEditor.value)

          return <MonacoEditor ref={monacoRef} {...props} />
        }

        case 'plain': {
          const PlainEditor = getDynamicEditor(currentEditor.value)
          return <PlainEditor {...props} />
        }

        case 'codemirror': {
          const CodeMirrorEditor = getDynamicEditor(currentEditor.value)
          return <CodeMirrorEditor {...props} />
        }

        default:
          return null
      }
    })

    return () => {
      const { Panel: GeneralSetting, setting: generalSetting } = general
      return (
        <NElement
          tag="div"
          style={
            {
              '--editor-font-size': generalSetting.fontSize
                ? `${generalSetting.fontSize / 14}rem`
                : '',
              '--editor-font-family': generalSetting.fontFamily,
            } as any
          }
          class={'editor-wrapper'}
          ref={wrapperRef}
        >
          {EditorComponent.value}
          <NModal
            transformOrigin="center"
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
        </NElement>
      )
    }
  },
})

export const __EditorToggleWrapper = defineAsyncComponent({
  loader: () => Promise.resolve(_EditorToggleWrapper),
  loadingComponent: () => <NSpin strokeWidth={14} show rotate />,
})

export const EditorToggleWrapper = defineComponent({
  props: {
    ...editorBaseProps,
    loading: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <Suspense>
        {{
          default() {
            return <__EditorToggleWrapper {...props} />
          },
          fallback() {
            return (
              <div class={[styles['editor'], styles['loading']]}>
                <NSpin strokeWidth={14} show rotate />
              </div>
            )
          },
        }}
      </Suspense>
    )
  },
})
