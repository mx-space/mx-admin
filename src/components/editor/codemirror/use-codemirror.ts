import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { markdownKeymap } from '@codemirror/lang-markdown'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { search, searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'

import { createToolbarKeymapExtension } from '../toolbar'
import { useEditorConfig } from '../universal/use-editor-setting'
import { useEditorStore } from './editor-store'
import { codemirrorReconfigureExtension } from './extension'
import { syntaxTheme } from './syntax-highlight'
import { useCodeMirrorConfigureFonts } from './use-auto-fonts'
import { useCodeMirrorAutoToggleTheme } from './use-auto-theme'

interface Props {
  initialDoc: string
  onChange?: (state: EditorState) => void
  onArrowUpAtFirstLine?: () => void
  enableEditorStore?: boolean
}

export const useCodeMirror = <T extends Element>(
  props: Props,
): [Ref<T | undefined>, Ref<EditorView | undefined>] => {
  const refContainer = ref<T>()
  const editorView = ref<EditorView>()
  const editorStore =
    props.enableEditorStore === false ? null : useEditorStore()
  const { general } = useEditorConfig()
  const { onChange, onArrowUpAtFirstLine } = props
  let cleanupDebugListeners: (() => void) | null = null

  onMounted(() => {
    if (!refContainer.value) return

    const startState = EditorState.create({
      doc: props.initialDoc,
      extensions: [
        keymap.of([
          {
            key: 'Mod-s',
            run() {
              return false
            },
            preventDefault: true,
          },
          {
            key: 'Enter',
            run(view) {
              // In WYSIWYG mode, insert double newline for paragraph separation
              if (general.setting.renderMode === 'wysiwyg') {
                const { state } = view
                const { from, to } = state.selection.main

                // Insert two newlines (empty line + new line position)
                view.dispatch({
                  changes: { from, to, insert: '\n\n' },
                  selection: { anchor: from + 2 },
                })

                return true // Prevent default Enter behavior
              }

              return false // Use default Enter behavior in plain mode
            },
          },
          {
            key: 'Mod-/',
            run() {
              general.setting.renderMode =
                general.setting.renderMode === 'wysiwyg' ? 'plain' : 'wysiwyg'
              return true
            },
          },
          {
            key: 'ArrowUp',
            run(view) {
              // In WYSIWYG mode, if cursor is at first line, jump to title input
              if (
                general.setting.renderMode === 'wysiwyg' &&
                onArrowUpAtFirstLine
              ) {
                const { state } = view
                const cursorPos = state.selection.main.head
                const firstLine = state.doc.line(1)

                // Check if cursor is on the first line
                if (cursorPos <= firstLine.to) {
                  onArrowUpAtFirstLine()
                  return true
                }
              }
              return false // Use default ArrowUp behavior
            },
          },
        ]),
        createToolbarKeymapExtension(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...markdownKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),

        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        EditorState.tabSize.of(2),
        search({
          top: true,
        }),

        syntaxTheme,

        ...codemirrorReconfigureExtension,

        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.changes) {
            onChange && onChange(update.state)
          }
        }),
      ],
    })

    const view = new EditorView({
      state: startState,
      parent: refContainer.value,
    })

    editorView.value = view

    const shouldDebugWysiwyg = () => {
      if (general.setting.renderMode !== 'wysiwyg') return false
      if (typeof window === 'undefined') return false
      const enabled =
        (window as unknown as { __CM_WYSIWYG_DEBUG__?: boolean })
          .__CM_WYSIWYG_DEBUG__ === true
      return enabled || window.localStorage?.getItem('cm-wysiwyg-debug') === '1'
    }

    const shorten = (text: string, max = 120) =>
      text.length > max ? `${text.slice(0, max - 1)}…` : text

    const describeNode = (node: EventTarget | null): string => {
      if (!node) return 'null'
      if (node === window) return 'window'
      if (node === document) return 'document'
      if (node instanceof Text) {
        return `#text("${shorten(node.data)}")`
      }
      if (node instanceof HTMLElement) {
        const classes = typeof node.className === 'string' ? node.className : ''
        const classHint = classes
          ? `.${classes.split(/\s+/).filter(Boolean).slice(0, 4).join('.')}`
          : ''
        const dataHint = node.dataset?.enterPos
          ? `[data-enter-pos=${node.dataset.enterPos}]`
          : node.dataset?.matchStart
            ? `[data-match-start=${node.dataset.matchStart}]`
            : ''
        return `<${node.tagName.toLowerCase()}${classHint}${dataHint}>`
      }
      return Object.prototype.toString.call(node)
    }

    const describePath = (path: EventTarget[]) =>
      path.slice(0, 6).map(describeNode).join(' > ')

    const getCaretInfo = (x: number, y: number) => {
      try {
        if (document.caretPositionFromPoint) {
          const caret = document.caretPositionFromPoint(x, y)
          if (!caret) return null
          return { node: caret.offsetNode, offset: caret.offset }
        }
        if (document.caretRangeFromPoint) {
          const range = document.caretRangeFromPoint(x, y)
          if (!range) return null
          return { node: range.startContainer, offset: range.startOffset }
        }
      } catch {
        return null
      }
      return null
    }

    const logSelection = (label: string) => {
      const selection = view.state.selection.main
      const line = view.state.doc.lineAt(selection.head)
      console.log(`[CM WYSIWYG] ${label}`, {
        selection: {
          from: selection.from,
          to: selection.to,
          head: selection.head,
          anchor: selection.anchor,
          empty: selection.empty,
        },
        line: {
          number: line.number,
          from: line.from,
          to: line.to,
          text: shorten(line.text),
        },
      })
    }

    const debugPointerDown = (event: PointerEvent) => {
      if (!shouldDebugWysiwyg()) return
      const coords = { x: event.clientX, y: event.clientY }
      const pos = view.posAtCoords(coords)
      const posLeft = view.posAtCoords(coords, false)
      const posRight = view.posAtCoords(coords)
      const line = pos == null ? null : view.state.doc.lineAt(pos)
      const domAtPos = pos == null ? null : view.domAtPos(pos).node
      const caretInfo = getCaretInfo(coords.x, coords.y)
      const caretNode = caretInfo?.node ?? null
      const caretPos =
        caretNode && view.dom.contains(caretNode)
          ? view.posAtDOM(caretNode, caretInfo?.offset ?? 0)
          : null

      console.log('[CM WYSIWYG] pointerdown', {
        coords,
        button: event.button,
        pos,
        posLeft,
        posRight,
        line: line
          ? {
              number: line.number,
              from: line.from,
              to: line.to,
              text: shorten(line.text),
            }
          : null,
        selection: {
          from: view.state.selection.main.from,
          to: view.state.selection.main.to,
          head: view.state.selection.main.head,
          anchor: view.state.selection.main.anchor,
          empty: view.state.selection.main.empty,
        },
        target: describeNode(event.target),
        path:
          typeof event.composedPath === 'function'
            ? describePath(event.composedPath())
            : 'n/a',
        domAtPos: describeNode(domAtPos),
        caret: caretInfo
          ? {
              node: describeNode(caretInfo.node as EventTarget),
              offset: caretInfo.offset,
              posAtDOM: caretPos,
            }
          : null,
      })
    }

    const debugPointerUp = () => {
      if (!shouldDebugWysiwyg()) return
      setTimeout(() => logSelection('pointerup'), 0)
    }

    view.dom.addEventListener('pointerdown', debugPointerDown, true)
    view.dom.addEventListener('pointerup', debugPointerUp, true)

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push(file)
        }
      }

      if (imageFiles.length > 0 && editorStore) {
        event.preventDefault()
        imageFiles.forEach((file) => editorStore.uploadImageFile(file))
      }
    }

    // 设置 store
    editorStore?.setEditorView(view)

    view.dom.addEventListener('paste', handlePaste)

    cleanupDebugListeners = () => {
      view.dom.removeEventListener('pointerdown', debugPointerDown, true)
      view.dom.removeEventListener('pointerup', debugPointerUp, true)
      view.dom.removeEventListener('paste', handlePaste)
    }
  })

  useCodeMirrorAutoToggleTheme(editorView)
  useCodeMirrorConfigureFonts(editorView)

  onBeforeUnmount(() => {
    cleanupDebugListeners?.()
    editorView.value?.destroy()
    // 清理 store
    editorStore?.setEditorView(undefined)
  })

  return [refContainer, editorView]
}
