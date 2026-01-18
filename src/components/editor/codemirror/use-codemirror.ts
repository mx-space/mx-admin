import { onMounted, ref } from 'vue'
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
import { codemirrorReconfigureExtension } from './extension'
import { syntaxTheme } from './syntax-highlight'
import { useCodeMirrorConfigureFonts } from './use-auto-fonts'
import { useCodeMirrorAutoToggleTheme } from './use-auto-theme'

interface Props {
  initialDoc: string
  onChange?: (state: EditorState) => void
  onArrowUpAtFirstLine?: () => void
}

export const useCodeMirror = <T extends Element>(
  props: Props,
): [Ref<T | undefined>, Ref<EditorView | undefined>] => {
  const refContainer = ref<T>()
  const editorView = ref<EditorView>()
  const { general } = useEditorConfig()
  const { onChange, onArrowUpAtFirstLine } = props

  const format = () => {
    const ev = editorView.value
    const autocorrect = general.setting.autocorrect

    if (autocorrect && ev) {
      import('@huacnlee/autocorrect')
        .then(({ formatFor }) => {
          const { state, dispatch } = ev
          const currentLine = state.doc.lineAt(state.selection.main.head)
          if (currentLine.text) {
            return
          }

          const allLineBeforeCurrentLine = state.doc.sliceString(
            0,
            currentLine.from,
          )
          const format = (text: string) => {
            return formatFor(text, 'cm.md').out as string
          }
          const newText = format(allLineBeforeCurrentLine)

          const delta = newText.length - allLineBeforeCurrentLine.length

          const afterCurrentLine = state.doc.sliceString(
            currentLine.to,
            state.doc.length,
          )
          const newAfterCurrentLine = format(afterCurrentLine)

          dispatch({
            changes: {
              from: 0,
              to: state.doc.length,
              insert: newText + newAfterCurrentLine,
            },
            selection: {
              anchor: state.selection.main.anchor + delta,
            },
          })
        })
        .catch(() => {
          // not support wasm
        })
    }
  }
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

                requestAnimationFrame(format)
                return true // Prevent default Enter behavior
              }

              requestAnimationFrame(format)
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
  })

  useCodeMirrorAutoToggleTheme(editorView)
  useCodeMirrorConfigureFonts(editorView)

  onBeforeUnmount(() => {
    editorView.value?.destroy()
  })

  return [refContainer, editorView]
}
