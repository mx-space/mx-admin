import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { toast } from 'vue-sonner'
import type { EditorView } from '@codemirror/view'

import { filesApi } from '~/api/files'
import { recordUploadedLocalImageUrl } from '~/utils/local-image-url'

import {
  addPendingUpload,
  removePendingUpload,
  setPendingUploadError,
} from './upload-store'

export const useEditorStore = defineStore('codemirror-editor', () => {
  const editorView = shallowRef<EditorView>()

  let uploadIdCounter = 0
  const generateUploadId = () => `__upload_${Date.now()}_${++uploadIdCounter}__`

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const uploadImageFile = async (file: File) => {
    const view = editorView.value
    if (!view) return

    const uploadId = generateUploadId()
    const placeholder = `![上传中...](${uploadId})`

    // Read file as base64 for preview
    let base64: string | null = null
    try {
      base64 = await readFileAsBase64(file)
      addPendingUpload(uploadId, base64, file.name)
    } catch {
      // Failed to read base64, continue without preview
    }

    const { from: cursorPos } = view.state.selection.main
    const currentLine = view.state.doc.lineAt(cursorPos)
    const isLineEmpty = currentLine.text.trim() === ''

    const insertPos = isLineEmpty ? cursorPos : currentLine.to
    const prefix = isLineEmpty ? '' : '\n\n'
    const insertText = `${prefix}${placeholder}`

    view.dispatch({
      changes: { from: insertPos, insert: insertText },
      selection: { anchor: insertPos + insertText.length },
    })

    try {
      const result = await filesApi.upload(file, 'image')
      recordUploadedLocalImageUrl(result.url)

      const currentDoc = view.state.doc.toString()
      const placeholderIndex = currentDoc.indexOf(placeholder)

      if (placeholderIndex !== -1) {
        const imageMarkdown = `![](${result.url})`
        view.dispatch({
          changes: {
            from: placeholderIndex,
            to: placeholderIndex + placeholder.length,
            insert: imageMarkdown,
          },
        })
      }
      // Clean up pending upload
      removePendingUpload(uploadId)
    } catch {
      toast.error('图片上传失败')
      setPendingUploadError(uploadId)

      const currentDoc = view.state.doc.toString()
      const placeholderIndex = currentDoc.indexOf(placeholder)
      if (placeholderIndex !== -1) {
        const placeholderLine = view.state.doc.lineAt(placeholderIndex)
        const isOnlyPlaceholder = placeholderLine.text.trim() === placeholder
        view.dispatch({
          changes: {
            from: isOnlyPlaceholder ? placeholderLine.from : placeholderIndex,
            to: isOnlyPlaceholder
              ? Math.min(placeholderLine.to + 1, view.state.doc.length)
              : placeholderIndex + placeholder.length,
            insert: '',
          },
        })
      }
      // Clean up pending upload after removing placeholder
      removePendingUpload(uploadId)
    }
  }

  const setEditorView = (view: EditorView | undefined) => {
    editorView.value = view
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
    setValue,
    focus,
  }
})
