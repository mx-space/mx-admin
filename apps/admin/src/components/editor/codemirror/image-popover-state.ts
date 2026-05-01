import { reactive } from 'vue'
import type { EditorView } from '@codemirror/view'

interface ImagePopoverState {
  visible: boolean
  targetEl: HTMLElement | null // Teleport 的目标元素
  view: EditorView | null // 编辑器实例，用于 dispatch 更新
}

export const imagePopoverState = reactive<ImagePopoverState>({
  visible: false,
  targetEl: null,
  view: null,
})

export const showImagePopover = (targetEl: HTMLElement, view: EditorView) => {
  imagePopoverState.visible = true
  imagePopoverState.targetEl = targetEl
  imagePopoverState.view = view
}

export const hideImagePopover = () => {
  imagePopoverState.visible = false
  imagePopoverState.targetEl = null
  imagePopoverState.view = null
}
