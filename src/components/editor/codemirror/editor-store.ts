import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { EditorView } from '@codemirror/view'

export const useEditorStore = defineStore('codemirror-editor', () => {
  const editorView = shallowRef<EditorView>()
  const uploadImageFile = shallowRef<(file: File) => void>()

  const setEditorView = (view: EditorView | undefined) => {
    editorView.value = view
  }

  const setUploadImageFile = (fn: ((file: File) => void) | undefined) => {
    uploadImageFile.value = fn
  }

  const setValue = (value: string) => {
    const view = editorView.value
    if (view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      })
    }
  }

  const focus = () => {
    editorView.value?.focus()
  }

  return {
    editorView,
    uploadImageFile,
    setEditorView,
    setUploadImageFile,
    setValue,
    focus,
  }
})
