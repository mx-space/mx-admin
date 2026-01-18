import type { DecorationSet } from '@codemirror/view'
import { Decoration, EditorView, WidgetType, keymap } from '@codemirror/view'
import type { EditorState, Range } from '@codemirror/state'
import { Prec, StateField } from '@codemirror/state'
import { codeToHtml } from 'shiki'

// Widget for code block with shiki highlighting
class CodeBlockWidget extends WidgetType {
  private static highlightCache = new Map<string, string>()
  private static pendingHighlights = new Map<string, Promise<string>>()

  constructor(
    readonly code: string,
    readonly language: string,
    readonly isDark: boolean,
    readonly enterPos: number,
  ) {
    super()
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'cm-wysiwyg-codeblock'

    // Language label
    if (this.language) {
      const langLabel = document.createElement('div')
      langLabel.className = 'cm-wysiwyg-codeblock-lang'
      langLabel.textContent = this.language
      wrapper.appendChild(langLabel)
    }

    // Code container
    const codeContainer = document.createElement('div')
    codeContainer.className = 'cm-wysiwyg-codeblock-content'
    codeContainer.textContent = this.code
    wrapper.appendChild(codeContainer)

    wrapper.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return
      event.preventDefault()
      view.dispatch({
        selection: { anchor: this.enterPos },
        scrollIntoView: true,
      })
      view.focus()
    })

    // Try to get cached highlight
    const cacheKey = `${this.language}:${this.isDark}:${this.code}`
    const cached = CodeBlockWidget.highlightCache.get(cacheKey)
    if (cached) {
      codeContainer.innerHTML = cached
      return wrapper
    }

    // Check if highlight is already pending
    const pending = CodeBlockWidget.pendingHighlights.get(cacheKey)
    if (pending) {
      pending.then((html) => {
        if (codeContainer.isConnected) {
          codeContainer.innerHTML = html
        }
      })
      return wrapper
    }

    // Start async highlight
    const highlightPromise = this.highlight()
    CodeBlockWidget.pendingHighlights.set(cacheKey, highlightPromise)

    highlightPromise.then((html) => {
      CodeBlockWidget.highlightCache.set(cacheKey, html)
      CodeBlockWidget.pendingHighlights.delete(cacheKey)
      if (codeContainer.isConnected) {
        codeContainer.innerHTML = html
      }
    })

    return wrapper
  }

  private async highlight(): Promise<string> {
    try {
      // Map common language aliases
      const langMap: Record<string, string> = {
        js: 'javascript',
        ts: 'typescript',
        tsx: 'tsx',
        jsx: 'jsx',
        py: 'python',
        rb: 'ruby',
        sh: 'bash',
        shell: 'bash',
        yml: 'yaml',
        md: 'markdown',
      }

      const lang = langMap[this.language] || this.language || 'text'

      const html = await codeToHtml(this.code, {
        lang,
        theme: this.isDark ? 'github-dark' : 'github-light',
      })

      // Extract just the code content from shiki's output
      // shiki outputs: <pre class="..." style="..."><code>...</code></pre>
      const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)
      return match ? match[1] : this.escapeHtml(this.code)
    } catch {
      // If language is not supported, return escaped plain text
      return this.escapeHtml(this.code)
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  }

  eq(other: CodeBlockWidget): boolean {
    return (
      this.code === other.code &&
      this.language === other.language &&
      this.isDark === other.isDark &&
      this.enterPos === other.enterPos
    )
  }

  ignoreEvent(): boolean {
    return false
  }
}

interface CodeBlock {
  startLine: number
  endLine: number
  language: string
  code: string
  startFrom: number
  endTo: number
}

// Find all code blocks in the document
const findCodeBlocks = (state: EditorState): CodeBlock[] => {
  const blocks: CodeBlock[] = []
  const codeBlockStartRegex = /^```(\w*)$/
  const codeBlockEndRegex = /^```$/

  let inCodeBlock = false
  let currentBlock: Partial<CodeBlock> & { codeLines?: string[] } = {}

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber)

    if (!inCodeBlock) {
      const startMatch = codeBlockStartRegex.exec(line.text)
      if (startMatch) {
        inCodeBlock = true
        currentBlock = {
          startLine: lineNumber,
          language: startMatch[1] || '',
          startFrom: line.from,
          codeLines: [],
        }
      }
    } else {
      if (codeBlockEndRegex.test(line.text)) {
        blocks.push({
          startLine: currentBlock.startLine!,
          endLine: lineNumber,
          language: currentBlock.language!,
          code: currentBlock.codeLines!.join('\n'),
          startFrom: currentBlock.startFrom!,
          endTo: line.to,
        })
        inCodeBlock = false
        currentBlock = {}
      } else {
        currentBlock.codeLines!.push(line.text)
      }
    }
  }

  return blocks
}

// Check if cursor is within a code block
const isCursorInCodeBlock = (state: EditorState, block: CodeBlock): boolean => {
  const { from, to } = state.selection.main
  return from <= block.endTo && to >= block.startFrom
}

// Detect dark mode
const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains('dark')
}

const getCodeBlockEntryPos = (
  state: EditorState,
  block: CodeBlock,
): number => {
  const lineNumber = Math.min(block.startLine + 1, block.endLine)
  return state.doc.line(lineNumber).from
}

const getCodeBlockExitPos = (
  state: EditorState,
  block: CodeBlock,
): number => {
  const lineNumber = Math.max(block.endLine - 1, block.startLine + 1)
  return state.doc.line(lineNumber).from
}

const getBlockContainingSelection = (
  state: EditorState,
  blocks: CodeBlock[],
): CodeBlock | undefined => {
  return blocks.find((block) => isCursorInCodeBlock(state, block))
}

const buildCodeBlockDecorations = (state: EditorState): DecorationSet => {
  const decorations: Range<Decoration>[] = []
  const blocks = findCodeBlocks(state)
  const dark = isDarkMode()

  for (const block of blocks) {
    const cursorInBlock = isCursorInCodeBlock(state, block)

    if (cursorInBlock) {
      // When cursor is in block, show raw markdown with line decorations
      for (let lineNum = block.startLine; lineNum <= block.endLine; lineNum++) {
        const line = state.doc.line(lineNum)
        decorations.push(
          Decoration.line({
            class: 'cm-wysiwyg-codeblock-line cm-wysiwyg-codeblock-editing',
          }).range(line.from),
        )
      }
    } else {
      // When cursor is outside, replace entire block with highlighted widget
      decorations.push(
        Decoration.replace({
          widget: new CodeBlockWidget(
            block.code,
            block.language,
            dark,
            getCodeBlockEntryPos(state, block),
          ),
          block: true,
        }).range(block.startFrom, block.endTo),
      )
    }
  }

  decorations.sort((a, b) => a.from - b.from || a.to - b.to)
  return Decoration.set(decorations)
}

const codeBlockWysiwygField = StateField.define<DecorationSet>({
  create(state) {
    return buildCodeBlockDecorations(state)
  },
  update(value, tr) {
    const selectionChanged = !tr.startState.selection.eq(tr.state.selection)
    const effectsChanged = tr.effects.length > 0

    if (!tr.docChanged && !selectionChanged && !effectsChanged) {
      return value
    }

    return buildCodeBlockDecorations(tr.state)
  },
  provide: (field) => EditorView.decorations.from(field),
})

const codeBlockWysiwygKeymap = Prec.highest(
  keymap.of([
    {
      key: 'ArrowDown',
      run(view) {
        const { state } = view
        if (!state.selection.main.empty) return false

        const blocks = findCodeBlocks(state)
        if (getBlockContainingSelection(state, blocks)) return false

        const currentLine = state.doc.lineAt(state.selection.main.head)
        const nextLineNumber = currentLine.number + 1
        if (nextLineNumber > state.doc.lines) return false

        const block = blocks.find((item) => item.startLine === nextLineNumber)
        if (!block) return false

        view.dispatch({
          selection: { anchor: getCodeBlockEntryPos(state, block) },
          scrollIntoView: true,
        })
        return true
      },
    },
    {
      key: 'ArrowUp',
      run(view) {
        const { state } = view
        if (!state.selection.main.empty) return false

        const blocks = findCodeBlocks(state)
        if (getBlockContainingSelection(state, blocks)) return false

        const currentLine = state.doc.lineAt(state.selection.main.head)
        const prevLineNumber = currentLine.number - 1
        if (prevLineNumber < 1) return false

        const block = blocks.find((item) => item.endLine === prevLineNumber)
        if (!block) return false

        view.dispatch({
          selection: { anchor: getCodeBlockExitPos(state, block) },
          scrollIntoView: true,
        })
        return true
      },
    },
  ]),
)

export const codeBlockWysiwygExtension = [
  codeBlockWysiwygField,
  codeBlockWysiwygKeymap,
]
