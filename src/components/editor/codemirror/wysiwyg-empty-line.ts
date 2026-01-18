import type { DecorationSet, EditorView, ViewUpdate } from '@codemirror/view'

import { RangeSetBuilder } from '@codemirror/state'
import { Decoration, ViewPlugin } from '@codemirror/view'

// Decoration to hide paragraph separator empty lines
const hiddenEmptyLineDecoration = Decoration.line({
  class: 'cm-wysiwyg-hidden-empty-line',
})

/**
 * This plugin hides the first empty line after a content line (paragraph separator),
 * but keeps additional consecutive empty lines visible.
 *
 * Logic:
 * - An empty line that follows a non-empty line is a "paragraph separator" -> hide it
 * - An empty line that follows another empty line is "extra spacing" -> show it
 */
function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const doc = view.state.doc

  let prevLineEmpty = true // Treat "before first line" as empty to not hide first empty line

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const isCurrentEmpty = line.text.trim() === ''

    if (isCurrentEmpty && !prevLineEmpty) {
      // This empty line follows a content line -> it's a paragraph separator, hide it
      builder.add(line.from, line.from, hiddenEmptyLineDecoration)
    }

    prevLineEmpty = isCurrentEmpty
  }

  return builder.finish()
}

const emptyLinePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
)

export const emptyLineWysiwygExtension = [emptyLinePlugin]
