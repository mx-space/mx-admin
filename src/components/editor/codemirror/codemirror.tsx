import { useSaveConfirm } from 'hooks/use-save-confirm'
import type { PropType } from 'vue'
import { defineComponent } from 'vue'

import type { EditorState } from '@codemirror/state'

import styles from '../universal/editor.module.css'
import { editorBaseProps } from '../universal/props'

import './codemirror.css'

import { useCodeMirror } from './use-codemirror'

export const CodemirrorEditor = defineComponent({
  name: 'CodemirrorEditor',
  props: {
    ...editorBaseProps,
    onStateChange: {
      type: Function as PropType<(state: EditorState) => void>,
      required: false,
    },
    className: {
      type: String,
    },
  },
  setup(props) {
    const [refContainer, editorView] = useCodeMirror({
      initialDoc: props.text,
      onChange: (state) => {
        props.onChange(state.doc.toString())
        props.onStateChange?.(state)
      },
    })

    let memoInitialValue: string = toRaw(props.text)

    watch(
      () => props.text,
      (n) => {
        if (!memoInitialValue && n) {
          memoInitialValue = n
        }
        const editor = editorView.value

        if (editor && n != editor.state.doc.toString()) {
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: n },
          })
        }
      },
    )

    useSaveConfirm(
      props.unSaveConfirm,
      () => memoInitialValue === editorView.value?.state.doc.toString(),
    )

    return () => (
      <div class={[styles['editor'], props.className]} ref={refContainer} />
    )
  },
})
