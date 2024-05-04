/**
 * 编辑器切换
 *
 */

import { SettingsIcon } from 'components/icons'
import { useLayout } from 'layouts/content'
import { NCard, NElement, NForm, NModal } from 'naive-ui'
import { defineComponent, ref } from 'vue'

import { Icon } from '@vicons/utils'

import { useMountAndUnmount } from '~/hooks/use-lifecycle'

import { CodemirrorEditor } from '../codemirror/codemirror'
import { editorBaseProps } from './props'

import './index.css'

import { useEditorConfig } from './use-editor-setting'
import type { EditorRef } from './types'

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
          <CodemirrorEditor ref={cmRef} {...props} />
          <Modal />
        </NElement>
      )
    }
  },
})
