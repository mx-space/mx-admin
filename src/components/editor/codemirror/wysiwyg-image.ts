import type { EditorView } from '@codemirror/view'

import { WidgetType } from '@codemirror/view'

import { showImagePopover } from './image-popover-state'

// Image widget with click-to-edit popover
export class ImageWidget extends WidgetType {
  constructor(
    readonly alt: string,
    readonly url: string,
    readonly matchStart: number,
    readonly matchEnd: number,
    private view: EditorView,
  ) {
    super()
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('span')
    wrapper.className = 'cm-wysiwyg-image-wrapper'

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

    // Click to edit
    wrapper.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      showImagePopover(wrapper, this.view)
    })

    wrapper.appendChild(img)
    return wrapper
  }

  eq(other: ImageWidget): boolean {
    return (
      this.url === other.url &&
      this.alt === other.alt &&
      this.matchStart === other.matchStart &&
      this.matchEnd === other.matchEnd
    )
  }

  ignoreEvent(): boolean {
    return false
  }
}
