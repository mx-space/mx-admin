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

    // Handle image load error - show placeholder
    img.addEventListener('error', () => {
      const placeholder = this.createErrorPlaceholder()
      wrapper.replaceChild(placeholder, img)

      // Clean up ResizeObserver since img is removed
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = undefined
      }
    })

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => updateHeight())
      this.resizeObserver.observe(img)
    }

    if (img.complete && !img.naturalWidth) {
      // Image already failed to load (cached failure)
      const placeholder = this.createErrorPlaceholder()
      wrapper.appendChild(placeholder)
    } else if (img.complete) {
      requestAnimationFrame(updateHeight)
      wrapper.appendChild(img)
    } else {
      wrapper.appendChild(img)
    }

    // Click to edit
    wrapper.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      showImagePopover(wrapper, view)
    })

    return wrapper
  }

  private createErrorPlaceholder(): HTMLElement {
    const placeholder = document.createElement('div')
    placeholder.className = 'cm-wysiwyg-image-placeholder'
    placeholder.title = `点击编辑 · ${this.alt || this.url}`

    // Icon container
    const iconWrapper = document.createElement('div')
    iconWrapper.className = 'cm-wysiwyg-image-placeholder-icon'
    iconWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/></svg>`
    placeholder.appendChild(iconWrapper)

    // URL text (truncated)
    const urlText = document.createElement('div')
    urlText.className = 'cm-wysiwyg-image-placeholder-url'
    const displayUrl =
      this.url.length > 50
        ? `${this.url.slice(0, 25)}...${this.url.slice(-22)}`
        : this.url
    urlText.textContent = displayUrl
    placeholder.appendChild(urlText)

    // Hint text
    const hint = document.createElement('div')
    hint.className = 'cm-wysiwyg-image-placeholder-hint'
    hint.textContent = '图片加载失败，点击编辑'
    placeholder.appendChild(hint)

    return placeholder
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
