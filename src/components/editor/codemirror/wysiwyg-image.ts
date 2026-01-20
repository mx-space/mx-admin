import type { EditorView } from '@codemirror/view'

import { StateEffect } from '@codemirror/state'
import { WidgetType } from '@codemirror/view'

import { showImagePopover } from './image-popover-state'

const DEFAULT_ESTIMATED_IMAGE_HEIGHT = 240
const imageHeightCache = new Map<string, number>()

export const imageHeightChangedEffect = StateEffect.define<{
  url: string
  height: number
}>()

// Image widget with click-to-edit popover
export class ImageWidget extends WidgetType {
  private readonly estimatedHeightValue: number
  private readonly isBlock: boolean
  private resizeObserver?: ResizeObserver
  private lastMeasuredHeight = 0

  constructor(
    readonly alt: string,
    readonly url: string,
    readonly matchStart: number,
    readonly matchEnd: number,
    isBlock = false,
  ) {
    super()
    this.estimatedHeightValue =
      imageHeightCache.get(this.url) ?? DEFAULT_ESTIMATED_IMAGE_HEIGHT
    this.isBlock = isBlock
  }

  get estimatedHeight(): number {
    return this.estimatedHeightValue
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement(this.isBlock ? 'div' : 'span')
    wrapper.className = this.isBlock
      ? 'cm-wysiwyg-image-wrapper cm-wysiwyg-image-wrapper-block'
      : 'cm-wysiwyg-image-wrapper'

    // 数据挂到 data-* 属性
    wrapper.dataset.alt = this.alt
    wrapper.dataset.url = this.url
    wrapper.dataset.matchStart = String(this.matchStart)
    wrapper.dataset.matchEnd = String(this.matchEnd)

    const img = document.createElement('img')
    img.src = this.url
    img.alt = this.alt
    img.className = 'cm-wysiwyg-image'
    img.title = `点击编辑 · ${this.alt || this.url}`

    const updateHeight = () => {
      if (!img.isConnected) return
      const nextHeight = Math.round(img.getBoundingClientRect().height)
      if (!nextHeight || nextHeight === this.lastMeasuredHeight) return
      this.lastMeasuredHeight = nextHeight

      if (imageHeightCache.get(this.url) !== nextHeight) {
        imageHeightCache.set(this.url, nextHeight)
        view.dispatch({
          effects: imageHeightChangedEffect.of({
            url: this.url,
            height: nextHeight,
          }),
        })
        view.requestMeasure()
      }
    }

    img.addEventListener('load', updateHeight)

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => updateHeight())
      this.resizeObserver.observe(img)
    }

    if (img.complete) {
      requestAnimationFrame(updateHeight)
    }

    // Click to edit
    wrapper.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      showImagePopover(wrapper, view)
    })

    wrapper.appendChild(img)
    return wrapper
  }

  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }
  }

  eq(other: ImageWidget): boolean {
    return (
      this.url === other.url &&
      this.alt === other.alt &&
      this.matchStart === other.matchStart &&
      this.matchEnd === other.matchEnd &&
      this.estimatedHeightValue === other.estimatedHeightValue &&
      this.isBlock === other.isBlock
    )
  }

  ignoreEvent(): boolean {
    return false
  }
}
