/* eslint-disable vue/no-setup-props-destructure */
import { useSaveConfirm } from 'hooks/use-save-confirm'
import { defineComponent } from 'vue'
import type { EditorState } from '@codemirror/state'
import type { PropType } from 'vue'

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
  setup(props, { expose }) {
    const [refContainer, editorView] = useCodeMirror({
      initialDoc: props.text,
      onChange: (state) => {
        props.onChange(state.doc.toString())
        props.onStateChange?.(state)
      },
    })

    watch(
      () => props.text,
      (n) => {
        const editor = editorView.value

        if (editor && n != editor.state.doc.toString()) {
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: n },
          })
        }
      },
    )

    expose({
      setValue: (value: string) => {
        const editor = editorView.value
        if (editor) {
          editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: value },
          })
        }
      },
    })

    const memoedText = props.text

    useSaveConfirm(
      props.unSaveConfirm,
      () => memoedText === editorView.value?.state.doc.toString(),
    )

    return () => (
      <div class={[styles['editor'], props.className]} ref={refContainer} />
    )
  },
})
