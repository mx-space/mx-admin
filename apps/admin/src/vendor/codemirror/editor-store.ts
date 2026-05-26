import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import type { EditorView } from '@codemirror/view'

import { uploadFile } from '~/api/files'

import {
  addPendingUpload,
  removePendingUpload,
  setPendingUploadError,
} from './upload-store'

interface EditorStoreSnapshot {
  editorView: EditorView | undefined
}

let snapshot: EditorStoreSnapshot = { editorView: undefined }
const listeners = new Set<() => void>()

function emit() {
  snapshot = { ...snapshot }
  listeners.forEach((l) => l())
}

export function setEditorView(view: EditorView | undefined): void {
  if (snapshot.editorView === view) return
  snapshot.editorView = view
  emit()
}

export function getEditorView(): EditorView | undefined {
  return snapshot.editorView
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useEditorView(): EditorView | undefined {
  return useSyncExternalStore(
    subscribe,
    () => snapshot.editorView,
    () => undefined,
  )
}

export function setEditorValue(value: string): void {
  const view = snapshot.editorView
  if (!view) return
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: value },
  })
}

export function focusEditor(): void {
  snapshot.editorView?.focus()
}

let uploadIdCounter = 0
const generateUploadId = () => `__upload_${Date.now()}_${++uploadIdCounter}__`

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export async function uploadImageFile(file: File): Promise<void> {
  const view = snapshot.editorView
  if (!view) return

  const uploadId = generateUploadId()
  const placeholder = `![上传中...](${uploadId})`

  try {
    const base64 = await readFileAsBase64(file)
    addPendingUpload(uploadId, base64, file.name)
  } catch {
    /* preview unavailable */
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
    const result = await uploadFile(file, 'image')

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
    removePendingUpload(uploadId)
  }
}
