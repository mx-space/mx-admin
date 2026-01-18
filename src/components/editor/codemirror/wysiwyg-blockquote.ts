import type { DecorationSet, EditorView } from '@codemirror/view'
import { Decoration, WidgetType, ViewPlugin } from '@codemirror/view'
import type { EditorState, Range } from '@codemirror/state'

// Blockquote marker widget - hidden but occupies space
class BlockquoteMarkerWidget extends WidgetType {
  constructor(readonly level: number) {
    super()
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-wysiwyg-blockquote-marker'
    // Add visual indicator for nesting level
    span.style.marginLeft = `${(this.level - 1) * 0.5}em`
    return span
  }

  eq(other: BlockquoteMarkerWidget): boolean {
    return this.level === other.level
  }

  ignoreEvent(): boolean {
    return false
  }
}

// Pattern for blockquote detection: > at start, possibly nested
const blockquotePattern = /^(\s*)((?:>\s*)+)/

interface BlockquoteMatch {
  lineFrom: number
  lineTo: number
  markerStart: number
  markerEnd: number
  level: number // Nesting level (number of >)
}

// Find blockquote in a line
const findBlockquote = (
  lineText: string,
  lineFrom: number,
  lineTo: number,
): BlockquoteMatch | null => {
  const match = blockquotePattern.exec(lineText)
  if (!match) return null

  const indent = match[1].length
  const markers = match[2]
  // Count the number of > for nesting level
  const level = (markers.match(/>/g) || []).length

  return {
    lineFrom,
    lineTo,
    markerStart: lineFrom + indent,
    markerEnd: lineFrom + indent + markers.length,
    level,
  }
}

// Check if cursor is on a line
const isCursorOnLine = (
  state: EditorState,
  lineFrom: number,
  lineTo: number,
): boolean => {
  const { from, to } = state.selection.main
  return from <= lineTo && to >= lineFrom
}

const buildBlockquoteDecorations = (state: EditorState): DecorationSet => {
  const decorations: Range<Decoration>[] = []

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber)
    const blockquote = findBlockquote(line.text, line.from, line.to)

    if (blockquote) {
      const cursorOnLine = isCursorOnLine(
        state,
        blockquote.lineFrom,
        blockquote.lineTo,
      )

      // Add line decoration for styling
      decorations.push(
        Decoration.line({
          class: `cm-wysiwyg-blockquote-line cm-wysiwyg-blockquote-level-${Math.min(blockquote.level, 5)}`,
        }).range(line.from),
      )

      // Only hide marker if cursor is NOT on this line
      if (!cursorOnLine) {
        decorations.push(
          Decoration.replace({
            widget: new BlockquoteMarkerWidget(blockquote.level),
          }).range(blockquote.markerStart, blockquote.markerEnd),
        )
      }
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to)
  return Decoration.set(decorations)
}

// Use ViewPlugin to react to selection changes
const blockquoteWysiwygPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = buildBlockquoteDecorations(view.state)
    }

    update(update: {
      docChanged: boolean
      selectionSet: boolean
      state: EditorState
    }) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = buildBlockquoteDecorations(update.state)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
)

export const blockquoteWysiwygExtension = [blockquoteWysiwygPlugin]
