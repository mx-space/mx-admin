import type { DecorationSet } from '@codemirror/view'

import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView, WidgetType } from '@codemirror/view'

export const addUpload = StateEffect.define<{ id: string; pos: number }>()
export const removeUpload = StateEffect.define<{ id: string }>()

class UploadWidget extends WidgetType {
  constructor(readonly id: string) {
    super()
  }

  toDOM() {
    const container = document.createElement('span')
    container.className = 'cm-uploading-widget'

    const text = document.createElement('span')
    text.className = 'cm-upload-shimmer'
    text.textContent = '图片上传中...'

    container.appendChild(text)
    return container
  }

  ignoreEvent() {
    return false
  }
}

export const uploadStateField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(uploads, tr) {
    uploads = uploads.map(tr.changes)

    for (const effect of tr.effects) {
      if (effect.is(addUpload)) {
        const decoration = Decoration.widget({
          widget: new UploadWidget(effect.value.id),
          side: 1, // right side of the position
          id: effect.value.id,
        })
        uploads = uploads.update({
          add: [decoration.range(effect.value.pos)],
        })
      } else if (effect.is(removeUpload)) {
        // remove the decoration with the matching id
        uploads = uploads.update({
          filter: (from, to, value) => {
            return value.spec.id !== effect.value.id
          },
        })
      }
    }
    return uploads
  },
  // render the decorations
  provide: (f) => EditorView.decorations.from(f),
})
