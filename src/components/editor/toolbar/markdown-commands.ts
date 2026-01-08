import type { ChangeSpec } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

function wrapSelection(
  view: EditorView,
  before: string,
  after: string = before,
  placeholder: string = '',
): boolean {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  const text = selectedText || placeholder
  const insert = `${before}${text}${after}`

  view.dispatch({
    changes: { from, to, insert },
    selection: {
      anchor: from + before.length,
      head: from + before.length + text.length,
    },
  })

  view.focus()
  return true
}

function insertAtLineStart(
  view: EditorView,
  prefix: string,
  toggle: boolean = true,
): boolean {
  const { state } = view
  const { from, to } = state.selection.main
  const firstLine = state.doc.lineAt(from)
  const lastLine = state.doc.lineAt(to)

  if (firstLine.number === lastLine.number || from === to) {
    const lineText = firstLine.text

    if (toggle && lineText.startsWith(prefix)) {
      view.dispatch({
        changes: {
          from: firstLine.from,
          to: firstLine.from + prefix.length,
          insert: '',
        },
      })
    } else {
      view.dispatch({
        changes: {
          from: firstLine.from,
          to: firstLine.from,
          insert: prefix,
        },
      })
    }
  } else {
    const indent = ' '.repeat(prefix.length)
    const changes: ChangeSpec[] = []

    for (let i = firstLine.number; i <= lastLine.number; i++) {
      const line = state.doc.line(i)
      const linePrefix = i === firstLine.number ? prefix : indent
      changes.push({
        from: line.from,
        to: line.from,
        insert: linePrefix,
      })
    }

    view.dispatch({ changes })
  }

  view.focus()
  return true
}

function insertBlock(
  view: EditorView,
  template: string,
  cursorOffset: number = 0,
): boolean {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)

  const insertPos = line.to
  const needsNewline = line.text.length > 0
  const insert = (needsNewline ? '\n' : '') + template

  view.dispatch({
    changes: { from: insertPos, to: insertPos, insert },
    selection: {
      anchor: insertPos + insert.length + cursorOffset,
    },
  })

  view.focus()
  return true
}

export const commands = {
  bold: (view: EditorView) => wrapSelection(view, '**', '**', '粗体文本'),
  italic: (view: EditorView) => wrapSelection(view, '*', '*', '斜体文本'),
  strikethrough: (view: EditorView) =>
    wrapSelection(view, '~~', '~~', '删除文本'),
  inlineCode: (view: EditorView) => wrapSelection(view, '`', '`', 'code'),
  codeBlock: (view: EditorView) => {
    const { state } = view
    const { from, to } = state.selection.main
    const selectedText = state.sliceDoc(from, to)

    if (selectedText) {
      const insert = `\`\`\`\n${selectedText}\n\`\`\``

      view.dispatch({
        changes: { from, to, insert },
        selection: {
          anchor: from + 4,
          head: from + 4,
        },
      })
    } else {
      const template = `\n\`\`\`javascript\n// 代码\n\`\`\`\n`
      return insertBlock(view, template, -18)
    }

    view.focus()
    return true
  },

  link: (view: EditorView) => {
    const { state } = view
    const { from, to } = state.selection.main
    const selectedText = state.sliceDoc(from, to)

    const text = selectedText || '链接文本'
    const insert = `[${text}](https://)`

    view.dispatch({
      changes: { from, to, insert },
      selection: {
        anchor: from + insert.length - 1,
      },
    })

    view.focus()
    return true
  },

  heading: (view: EditorView) => {
    const { state } = view
    const line = state.doc.lineAt(state.selection.main.from)
    const lineText = line.text

    const match = lineText.match(/^(#{1,6})\s/)

    if (match) {
      const currentLevel = match[1].length
      const nextLevel = currentLevel >= 6 ? 1 : currentLevel + 1
      const newPrefix = `${'#'.repeat(nextLevel)} `

      view.dispatch({
        changes: {
          from: line.from,
          to: line.from + match[0].length,
          insert: newPrefix,
        },
      })
    } else {
      insertAtLineStart(view, '# ', false)
    }

    view.focus()
    return true
  },

  bulletList: (view: EditorView) => insertAtLineStart(view, '- '),
  orderedList: (view: EditorView) => {
    const { state } = view
    const line = state.doc.lineAt(state.selection.main.from)

    let prevNumber = 1
    if (line.number > 1) {
      const prevLine = state.doc.line(line.number - 1)
      const match = prevLine.text.match(/^(\d+)\.\s/)
      if (match) {
        prevNumber = parseInt(match[1]) + 1
      }
    }

    return insertAtLineStart(view, `${prevNumber}. `, false)
  },

  taskList: (view: EditorView) => insertAtLineStart(view, '- [ ] '),
  quote: (view: EditorView) => {
    const { state } = view
    const { from, to } = state.selection.main
    const firstLine = state.doc.lineAt(from)
    const lastLine = state.doc.lineAt(to)

    if (firstLine.number !== lastLine.number && from !== to) {
      const changes: ChangeSpec[] = []

      for (let i = firstLine.number; i <= lastLine.number; i++) {
        const line = state.doc.line(i)
        changes.push({
          from: line.from,
          to: line.from,
          insert: '> ',
        })
      }

      view.dispatch({ changes })
      view.focus()
      return true
    }

    return insertAtLineStart(view, '> ')
  },
  horizontalRule: (view: EditorView) => insertBlock(view, '\n---\n', 0),
  emoji: (view: EditorView, emoji: string) => {
    const { state } = view
    const { from } = state.selection.main

    view.dispatch({
      changes: { from, to: from, insert: emoji },
      selection: { anchor: from + emoji.length },
    })

    view.focus()
    return true
  },

  // managed by historyKeymap
  undo: (_view: EditorView) => {
    return true
  },
  redo: (_view: EditorView) => {
    return true
  },
}

export type CommandName = keyof typeof commands
