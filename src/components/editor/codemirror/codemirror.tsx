/* eslint-disable vue/no-setup-props-destructure */
import { defineComponent } from 'vue'
import type { EditorState } from '@codemirror/state'
import type { PropType } from 'vue'

import { useSaveConfirm } from '~/hooks/use-save-confirm'

import styles from '../universal/editor.module.css'
import { editorBaseProps } from '../universal/props'

import './codemirror.css'

import { getToken, RESTManager } from '~/utils'

import { useCodeMirror } from './use-codemirror'

const handleUploadImage = async (file: File): Promise<string> => {
  if (!file) {
    throw new Error('No file provided.')
  }

  try {
    const formData = new FormData()
    formData.append('file', file, file.name)

    // use fetch api instead of RESTManager (umi-request)
    // https://github.com/umijs/umi-request/issues/168
    const token = getToken()
    const response = await fetch(
      `${RESTManager.endpoint}/files/upload?type=file`,
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: token || '',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    const imageUrl = result.url

    if (!imageUrl) {
      throw new Error('Upload failed: invalid url.')
    }

    return imageUrl
  } catch (error) {
    console.error('Auto upload image failed:', error)
    message.error('图片上传失败，请稍候重新尝试~')
    throw error
  }
}

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
      onUploadImage: handleUploadImage,
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
      <div class={[styles.editor, props.className]} ref={refContainer} />
    )
  },
})
