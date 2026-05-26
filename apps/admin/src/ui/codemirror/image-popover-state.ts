import { useSyncExternalStore } from 'react'
import type { EditorView } from '@codemirror/view'

export interface ImagePopoverSnapshot {
  visible: boolean
  targetEl: HTMLElement | null
  view: EditorView | null
}

let snapshot: ImagePopoverSnapshot = {
  visible: false,
  targetEl: null,
  view: null,
}

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function getImagePopoverState(): ImagePopoverSnapshot {
  return snapshot
}

export function subscribeImagePopover(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useImagePopoverState(): ImagePopoverSnapshot {
  return useSyncExternalStore(
    subscribeImagePopover,
    getImagePopoverState,
    getImagePopoverState,
  )
}

export const showImagePopover = (targetEl: HTMLElement, view: EditorView) => {
  snapshot = { visible: true, targetEl, view }
  emit()
}

export const hideImagePopover = () => {
  snapshot = { visible: false, targetEl: null, view: null }
  emit()
}
