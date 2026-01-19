import type { DecorationSet, EditorView, ViewUpdate } from '@codemirror/view'

import { cursorLineDown, cursorLineUp } from '@codemirror/commands'
import { Prec, RangeSetBuilder } from '@codemirror/state'
import { Decoration, keymap, ViewPlugin } from '@codemirror/view'

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

/**
 * Check if a line is a hidden paragraph separator (empty line after content)
 */
function isHiddenSeparatorLine(view: EditorView, lineNumber: number): boolean {
  const doc = view.state.doc
  if (lineNumber < 1 || lineNumber > doc.lines) return false

  const line = doc.line(lineNumber)
  const isCurrentEmpty = line.text.trim() === ''

  if (!isCurrentEmpty) return false
  if (lineNumber === 1) return false // First line can't be a separator

  const prevLine = doc.line(lineNumber - 1)
  const isPrevEmpty = prevLine.text.trim() === ''

  return !isPrevEmpty // It's a separator if previous line has content
}

/**
 * Custom cursor movement that skips hidden empty lines.
 * First executes the default movement, then checks if we landed on a hidden line.
 * This preserves visual line navigation within wrapped paragraphs.
 */
function moveCursorSkippingHidden(
  view: EditorView,
  direction: 'up' | 'down',
): boolean {
  const moveCommand = direction === 'up' ? cursorLineUp : cursorLineDown

  // Execute default movement first
  const moved = moveCommand(view)
  if (!moved) return false

  // Check if we landed on a hidden separator line
  const pos = view.state.selection.main.head
  const currentLine = view.state.doc.lineAt(pos)

  if (isHiddenSeparatorLine(view, currentLine.number)) {
    // If on a hidden line, move once more to skip it
    return moveCommand(view)
  }

  return true
}

const skipHiddenLineKeymap = Prec.highest(
  keymap.of([
    {
      key: 'ArrowUp',
      run: (view) => moveCursorSkippingHidden(view, 'up'),
    },
    {
      key: 'ArrowDown',
      run: (view) => moveCursorSkippingHidden(view, 'down'),
    },
  ]),
)

export const emptyLineWysiwygExtension = [emptyLinePlugin, skipHiddenLineKeymap]
