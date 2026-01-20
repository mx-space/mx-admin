import { css, html, LitElement, nothing } from 'lit'
import type { Range } from '@codemirror/state'
import type { DecorationSet } from '@codemirror/view'

import { history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { LanguageDescription } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { Compartment, EditorState, Prec, StateField } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { Decoration, EditorView, keymap, WidgetType } from '@codemirror/view'
import { githubLight } from '@ddietr/codemirror-themes/theme/github-light'

const codeBlockStartRegex = /^```(?!`)(.*)$/
const codeBlockEndRegex = /^```\s*$/
const codeBlockLanguageRegex = /^[\w#+.-]+$/
const codeBlockTagName = 'cm-wysiwyg-codeblock'

const languageAliasMap: Record<string, string> = {
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

const parseCodeBlockLanguage = (info: string): string => {
  if (!info) return ''
  const [firstToken] = info.trim().split(/\s+/)
  if (!firstToken) return ''
  return codeBlockLanguageRegex.test(firstToken) ? firstToken : ''
}

const findLanguageDescription = (
  language: string,
): LanguageDescription | null => {
  if (!language) return null
  const normalized = languageAliasMap[language] || language
  return LanguageDescription.matchLanguageName(languages, normalized, true)
}

class CodeBlockElement extends LitElement {
  static properties = {
    code: { type: String },
    language: { type: String },
    isDark: { type: Boolean },
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      margin: 0.5rem 0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .codeblock-lang {
      display: block;
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
        'Liberation Mono', monospace;
      font-size: 0.75em;
      padding: 0.375rem 0.75rem;
      background-color: color-mix(in srgb, currentColor 8%, transparent);
      color: currentColor;
      opacity: 0.7;
      border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
    }

    .codeblock-area {
      display: flex;
      background-color: color-mix(in srgb, currentColor 5%, transparent);
    }

    .codeblock-editor {
      display: block;
    }

    /* Force CodeMirror to use auto height instead of full height */
    .codeblock-editor .cm-editor {
      height: auto !important;
      background: transparent;
    }

    .codeblock-editor .cm-gutters {
      display: none;
    }

    .codeblock-editor .cm-scroller {
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
        'Liberation Mono', monospace;
      font-size: 0.9em;
      line-height: 1.5;
      padding: 0;
      overflow: auto;
      background: transparent;
      /* Reset any inherited height */
      min-height: auto !important;
    }

    .codeblock-editor .cm-content {
      padding: 0.75rem;
      box-sizing: border-box;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      white-space: pre;
      tab-size: 2;
      /* Reset max-width and margin from outer editor */
      max-width: none !important;
      margin: 0 !important;
    }

    .codeblock-editor .cm-content .cm-line {
      margin: 0 !important;
      padding: 0;
    }

    .codeblock-editor .cm-focused {
      outline: none;
    }
  `

  declare code: string
  declare language: string
  declare isDark: boolean

  enterPos = 0
  contentFrom = 0
  contentTo = 0
  blockStart = 0
  blockEnd = 0
  outerView?: EditorView

  private innerView?: EditorView
  private syncingFromOuter = false
  private languageCompartment = new Compartment()
  private themeCompartment = new Compartment()
  private languageLoadId = 0
  private resizeObserver?: ResizeObserver
  private measureScheduled = false

  constructor() {
    super()
    this.code = ''
    this.language = ''
    this.isDark = false
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.classList.add('cm-wysiwyg-codeblock')
  }

  render(): ReturnType<typeof html> {
    return html`
      ${this.language
        ? html`<div class="codeblock-lang">${this.language}</div>`
        : nothing}
      <div class="codeblock-area">
        <div class="codeblock-editor"></div>
      </div>
    `
  }

  firstUpdated(): void {
    const editorHost = this.shadowRoot?.querySelector(
      '.codeblock-editor',
    ) as HTMLElement | null
    if (editorHost) {
      this.createInnerEditor(editorHost)
    }
    this.addEventListener('mousedown', this.handleMouseDown)

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleOuterMeasure()
      })
      this.resizeObserver.observe(this)
    }
    this.scheduleOuterMeasure()
  }

  updated(changed: Map<string, unknown>): void {
    if (!this.innerView) {
      const editorHost = this.shadowRoot?.querySelector(
        '.codeblock-editor',
      ) as HTMLElement | null
      if (editorHost) {
        this.createInnerEditor(editorHost)
      }
    }

    if (changed.has('code')) {
      this.syncInnerDoc()
    }

    if (changed.has('language')) {
      this.applyLanguage()
    }

    if (changed.has('isDark')) {
      this.applyTheme()
    }
  }

  disconnectedCallback(): void {
    this.removeEventListener('mousedown', this.handleMouseDown)
    this.innerView?.dom.removeEventListener('focusin', this.handleFocus)
    this.innerView?.destroy()
    this.innerView = undefined
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }
    super.disconnectedCallback()
  }

  focusEditor(position: 'start' | 'end' = 'start'): void {
    const focus = () => {
      if (!this.innerView) return
      const docLength = this.innerView.state.doc.length
      const anchor = position === 'end' ? docLength : 0
      this.innerView.dispatch({ selection: { anchor } })
      this.innerView.focus()
    }

    if (this.innerView) {
      focus()
      return
    }

    void this.updateComplete.then(focus)
  }

  private createInnerEditor(host: HTMLElement): void {
    if (this.innerView) return

    const boundaryKeymap = Prec.highest(
      keymap.of([
        {
          key: 'ArrowUp',
          run: () => this.exitIfAtBoundary('up'),
        },
        {
          key: 'ArrowDown',
          run: () => this.exitIfAtBoundary('down'),
        },
      ]),
    )

    // Base theme to force auto height (overrides inherited styles)
    const codeBlockBaseTheme = EditorView.theme({
      '&': {
        height: 'auto',
      },
      '.cm-scroller': {
        minHeight: 'auto',
      },
      '.cm-content': {
        maxWidth: 'none',
        margin: '0',
      },
      '.cm-line': {
        margin: '0',
      },
    })

    const state = EditorState.create({
      doc: this.code,
      extensions: [
        boundaryKeymap,
        codeBlockBaseTheme,
        history(),
        keymap.of([...historyKeymap, indentWithTab]),
        EditorState.tabSize.of(2),
        this.languageCompartment.of([]),
        this.themeCompartment.of(this.isDark ? oneDark : githubLight),
        EditorView.contentAttributes.of({
          spellcheck: 'false',
          autocapitalize: 'off',
          autocomplete: 'off',
          autocorrect: 'off',
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || this.syncingFromOuter) return
          this.syncOuterDoc(update.state.doc.toString())
        }),
      ],
    })

    this.innerView = new EditorView({ state, parent: host })
    this.innerView.dom.addEventListener('focusin', this.handleFocus)
    this.applyLanguage()
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return
    // Check if click is inside the editor area (in shadow DOM)
    const path = event.composedPath()
    const editorHost = this.shadowRoot?.querySelector('.codeblock-editor')
    if (editorHost && path.includes(editorHost)) return
    event.preventDefault()
    this.innerView?.focus()
  }

  private scheduleOuterMeasure(): void {
    if (!this.outerView || this.measureScheduled) return
    this.measureScheduled = true
    requestAnimationFrame(() => {
      this.measureScheduled = false
      this.outerView?.requestMeasure()
    })
  }

  private handleFocus = (): void => {
    if (!this.outerView) return
    this.outerView.dispatch({
      selection: { anchor: this.enterPos },
    })
  }

  private exitIfAtBoundary(direction: 'up' | 'down'): boolean {
    if (!this.outerView || !this.innerView) return false
    const selection = this.innerView.state.selection.main
    if (!selection.empty) return false

    const innerDoc = this.innerView.state.doc
    const line = innerDoc.lineAt(selection.head)

    if (direction === 'up') {
      if (line.number !== 1 || selection.head !== line.from) return false
      const target = Math.max(0, this.blockStart - 1)
      this.outerView.dispatch({
        selection: { anchor: target },
      })
      this.outerView.focus()
      return true
    }

    if (line.number !== innerDoc.lines || selection.head !== line.to) {
      return false
    }

    const target = Math.min(this.outerView.state.doc.length, this.blockEnd + 1)
    this.outerView.dispatch({
      selection: { anchor: target },
    })
    this.outerView.focus()
    return true
  }

  private syncInnerDoc(): void {
    if (!this.innerView) return
    const current = this.innerView.state.doc.toString()
    if (current === this.code) return
    this.syncingFromOuter = true
    this.innerView.dispatch({
      changes: { from: 0, to: current.length, insert: this.code },
    })
    this.syncingFromOuter = false
  }

  private syncOuterDoc(next: string): void {
    if (!this.outerView) return
    const current = this.outerView.state.doc.sliceString(
      this.contentFrom,
      this.contentTo,
    )
    if (current === next) return
    this.outerView.dispatch({
      changes: { from: this.contentFrom, to: this.contentTo, insert: next },
      userEvent: 'input',
    })
  }

  private applyTheme(): void {
    if (!this.innerView) return
    const theme = this.isDark ? oneDark : githubLight
    this.innerView.dispatch({
      effects: this.themeCompartment.reconfigure(theme),
    })
  }

  private applyLanguage(): void {
    if (!this.innerView) return
    const description = findLanguageDescription(this.language)
    const requestId = ++this.languageLoadId

    if (!description) {
      this.innerView.dispatch({
        effects: this.languageCompartment.reconfigure([]),
      })
      return
    }

    description
      .load()
      .then((support) => {
        if (!this.innerView || requestId !== this.languageLoadId) return
        this.innerView.dispatch({
          effects: this.languageCompartment.reconfigure(support),
        })
      })
      .catch(() => {
        if (!this.innerView || requestId !== this.languageLoadId) return
        this.innerView.dispatch({
          effects: this.languageCompartment.reconfigure([]),
        })
      })
  }
}

if (!customElements.get(codeBlockTagName)) {
  customElements.define(codeBlockTagName, CodeBlockElement)
}

// Widget for code block with codemirror highlighting
class CodeBlockWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly language: string,
    readonly isDark: boolean,
    readonly enterPos: number,
    readonly contentFrom: number,
    readonly contentTo: number,
    readonly blockStart: number,
    readonly blockEnd: number,
  ) {
    super()
  }

  toDOM(view: EditorView): HTMLElement {
    const element = document.createElement(codeBlockTagName) as CodeBlockElement
    element.code = this.code
    element.language = this.language
    element.isDark = this.isDark
    element.enterPos = this.enterPos
    element.contentFrom = this.contentFrom
    element.contentTo = this.contentTo
    element.blockStart = this.blockStart
    element.blockEnd = this.blockEnd
    element.outerView = view
    element.dataset.enterPos = String(this.enterPos)
    return element
  }

  updateDOM(dom: HTMLElement, view: EditorView): boolean {
    if (!(dom instanceof CodeBlockElement)) return false
    dom.code = this.code
    dom.language = this.language
    dom.isDark = this.isDark
    dom.enterPos = this.enterPos
    dom.contentFrom = this.contentFrom
    dom.contentTo = this.contentTo
    dom.blockStart = this.blockStart
    dom.blockEnd = this.blockEnd
    dom.outerView = view
    dom.dataset.enterPos = String(this.enterPos)
    return true
  }

  eq(other: CodeBlockWidget): boolean {
    return (
      this.code === other.code &&
      this.language === other.language &&
      this.isDark === other.isDark &&
      this.enterPos === other.enterPos &&
      this.contentFrom === other.contentFrom &&
      this.contentTo === other.contentTo &&
      this.blockStart === other.blockStart &&
      this.blockEnd === other.blockEnd
    )
  }

  ignoreEvent(_event: Event): boolean {
    return true
  }
}

interface CodeBlock {
  startLine: number
  endLine: number
  language: string
  code: string
  startFrom: number
  endTo: number
  contentFrom: number
  contentTo: number
}

// Find all code blocks in the document
const findCodeBlocks = (state: EditorState): CodeBlock[] => {
  const blocks: CodeBlock[] = []

  let inCodeBlock = false
  let currentBlock: Partial<CodeBlock> & { codeLines?: string[] } = {}

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber)

    if (!inCodeBlock) {
      const startMatch = codeBlockStartRegex.exec(line.text)
      if (startMatch) {
        inCodeBlock = true
        const info = startMatch[1].trim()
        currentBlock = {
          startLine: lineNumber,
          language: parseCodeBlockLanguage(info),
          startFrom: line.from,
          codeLines: [],
        }
      }
    } else {
      if (codeBlockEndRegex.test(line.text)) {
        const contentStartLine = currentBlock.startLine! + 1
        const contentEndLine = lineNumber - 1
        const hasContent = contentStartLine <= contentEndLine
        const contentFrom = hasContent
          ? state.doc.line(contentStartLine).from
          : line.from
        const contentTo = hasContent
          ? state.doc.line(contentEndLine).to
          : line.from
        blocks.push({
          startLine: currentBlock.startLine!,
          endLine: lineNumber,
          language: currentBlock.language!,
          code: currentBlock.codeLines!.join('\n'),
          startFrom: currentBlock.startFrom!,
          endTo: line.to,
          contentFrom,
          contentTo,
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

const isHiddenSeparatorLine = (
  state: EditorState,
  lineNumber: number,
): boolean => {
  const doc = state.doc
  if (lineNumber < 1 || lineNumber > doc.lines) return false
  const line = doc.line(lineNumber)
  if (line.text.trim() !== '') return false
  if (lineNumber === 1) return false
  const prevLine = doc.line(lineNumber - 1)
  return prevLine.text.trim() !== ''
}

// Detect dark mode
const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains('dark')
}

const getCodeBlockEntryPos = (state: EditorState, block: CodeBlock): number => {
  const lineNumber = Math.min(block.startLine + 1, block.endLine)
  return state.doc.line(lineNumber).from
}

const getCodeBlockExitPos = (state: EditorState, block: CodeBlock): number => {
  const lineNumber = Math.max(block.endLine - 1, block.startLine + 1)
  return state.doc.line(lineNumber).from
}

const getBlockContainingSelection = (
  state: EditorState,
  blocks: CodeBlock[],
): CodeBlock | undefined => {
  return blocks.find((block) => isCursorInCodeBlock(state, block))
}

const findCodeBlockElement = (
  view: EditorView,
  enterPos: number,
): CodeBlockElement | null => {
  const domAtPos = view.domAtPos(enterPos).node
  const element = (
    domAtPos instanceof HTMLElement ? domAtPos : domAtPos.parentElement
  ) as HTMLElement | null
  const found = element?.closest?.(codeBlockTagName) as CodeBlockElement | null
  if (found) return found
  return view.dom.querySelector(
    `${codeBlockTagName}[data-enter-pos="${enterPos}"]`,
  ) as CodeBlockElement | null
}

const focusCodeBlockEditor = (
  view: EditorView,
  enterPos: number,
  position: 'start' | 'end',
): void => {
  const attempt = () => {
    const element = findCodeBlockElement(view, enterPos)
    if (!element) return false
    element.focusEditor(position)
    return true
  }

  if (!attempt()) {
    requestAnimationFrame(() => {
      attempt()
    })
  }
}

const buildCodeBlockDecorations = (state: EditorState): DecorationSet => {
  const decorations: Range<Decoration>[] = []
  const blocks = findCodeBlocks(state)
  const dark = isDarkMode()

  for (const block of blocks) {
    decorations.push(
      Decoration.replace({
        widget: new CodeBlockWidget(
          block.code,
          block.language,
          dark,
          getCodeBlockEntryPos(state, block),
          block.contentFrom,
          block.contentTo,
          block.startFrom,
          block.endTo,
        ),
        block: true,
      }).range(block.startFrom, block.endTo),
    )
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
        let nextLineNumber = currentLine.number + 1
        if (nextLineNumber > state.doc.lines) return false

        if (isHiddenSeparatorLine(state, nextLineNumber)) {
          nextLineNumber += 1
        }
        if (nextLineNumber > state.doc.lines) return false

        const block = blocks.find((item) => item.startLine === nextLineNumber)
        if (!block) return false

        view.dispatch({
          selection: { anchor: getCodeBlockEntryPos(state, block) },
          scrollIntoView: true,
        })
        focusCodeBlockEditor(view, getCodeBlockEntryPos(state, block), 'start')
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
        let prevLineNumber = currentLine.number - 1
        if (prevLineNumber < 1) return false

        if (isHiddenSeparatorLine(state, prevLineNumber)) {
          prevLineNumber -= 1
        }
        if (prevLineNumber < 1) return false

        const block = blocks.find((item) => item.endLine === prevLineNumber)
        if (!block) return false

        view.dispatch({
          selection: { anchor: getCodeBlockExitPos(state, block) },
          scrollIntoView: true,
        })
        focusCodeBlockEditor(view, getCodeBlockEntryPos(state, block), 'end')
        return true
      },
    },
  ]),
)

export const codeBlockWysiwygExtension = [
  codeBlockWysiwygField,
  codeBlockWysiwygKeymap,
]

declare global {
  interface HTMLElementTagNameMap {
    'cm-wysiwyg-codeblock': CodeBlockElement
  }
}
