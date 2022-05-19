import clsx from 'clsx'
import { useSaveConfirm } from 'hooks/use-save-confirm'
import { PropType, defineComponent } from 'vue'

import { EditorState } from '@codemirror/state'

import styles from '../universal/editor.module.css'
import { editorBaseProps } from '../universal/props'

import './codemirror.css'

import { useCodeMirror } from './use-codemirror'

export const CodemirrorEditor = defineComponent({
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

    // watchEffect(() => {
    //   console.log(toRaw(editorView.value))
    // })

    return () => (
      <div class={clsx(styles['editor'], props.className)} ref={refContainer} />
    )
  },
})
