/**
 * 编辑器切换
 *
 */

import { Settings as SettingsIcon } from 'lucide-vue-next'
import { NCard, NElement, NForm, NModal } from 'naive-ui'
import { defineComponent, ref } from 'vue'

import { FabButton } from '~/components/button/rounded-button'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { useLayout } from '~/layouts/content'

import { CodemirrorEditor } from '../codemirror/codemirror'
import { editorBaseProps } from './props'

import './index.css'

import type { EditorRef } from './types'

import { useEditorConfig } from './use-editor-setting'

export const Editor = defineComponent({
  name: 'EditorX',
  props: {
    ...editorBaseProps,
    loading: {
      type: Boolean,
      required: true,
    },
  },
  expose: ['setValue'],
  setup(props, { expose }) {
    const modalOpen = ref(false)
    const layout = useLayout()

    useMountAndUnmount(() => {
      const settingButton = layout.addFloatButton(
        <FabButton
          icon={<SettingsIcon />}
          label="编辑器设置"
          onClick={() => {
            modalOpen.value = true
          }}
        />,
      )

      return () => {
        layout.removeFloatButton(settingButton)
      }
    })

    const { general, destory } = useEditorConfig()

    onUnmounted(() => {
      destory()
    })

    const Modal = defineComponent({
      setup() {
        const handleModalClose = () => {
          modalOpen.value = false
        }
        const { Panel: GeneralSetting } = general

        const handleUpdateShow = (s: boolean) => void (modalOpen.value = s)
        return () => (
          <NModal
            transformOrigin="center"
            show={modalOpen.value}
            onUpdateShow={handleUpdateShow}
          >
            <NCard
              closable
              onClose={handleModalClose}
              title="编辑器设定"
              style="max-width: 90vw;width: 500px; max-height: 65vh; overflow: auto"
              bordered={false}
            >
              <NForm labelPlacement="left" labelWidth="8rem" labelAlign="right">
                <GeneralSetting />
              </NForm>
            </NCard>
          </NModal>
        )
      },
    })

    const cmRef = ref<EditorRef>()

    expose({
      setValue: (value: string) => {
        cmRef.value?.setValue(value)
      },
    })

    return () => {
      const { setting: generalSetting } = general
      const resolvedRenderMode =
        props.renderMode ?? generalSetting.renderMode ?? 'plain'
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
        >
          <CodemirrorEditor
            ref={cmRef}
            {...props}
            renderMode={resolvedRenderMode}
          />
          <Modal />
        </NElement>
      )
    }
  },
})
