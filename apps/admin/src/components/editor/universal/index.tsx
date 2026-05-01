/**
 * 编辑器切换
 *
 */

import { NElement } from 'naive-ui'
import { defineComponent, onUnmounted } from 'vue'

import { CodemirrorEditor } from '../codemirror/codemirror'
import { useEditorStore } from '../codemirror/editor-store'
import { editorBaseProps } from './props'

import './index.css'

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
    const { general, destory } = useEditorConfig()

    onUnmounted(() => {
      destory()
    })

    const editorStore = useEditorStore()

    expose({
      setValue: (value: string) => {
        editorStore.setValue(value)
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
          <CodemirrorEditor {...props} renderMode={resolvedRenderMode} />
        </NElement>
      )
    }
  },
})
