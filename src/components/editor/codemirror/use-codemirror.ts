import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands'
import { markdownKeymap } from '@codemirror/lang-markdown'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'

import { useEditorConfig } from '../universal/use-editor-setting'
import { codemirrorReconfigureExtension } from './extension'
import { syntaxTheme } from './syntax-highlight'
import { useCodeMirrorAutoToggleTheme } from './ui'

export const customTheme = EditorView.theme({
  '&': {
    height: '100%',
  },
})

interface Props {
  initialDoc: string
  onChange?: (state: EditorState) => void
}

export const useCodeMirror = <T extends Element>(
  props: Props,
): [Ref<T | undefined>, Ref<EditorView | undefined>] => {
  const refContainer = ref<T>()
  const editorView = ref<EditorView>()
  const { general } = useEditorConfig()
  const { onChange } = props

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
          console.log('not support wasm')
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
            run() {
              requestAnimationFrame(format)
              return false
            },
          },
        ]),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...markdownKeymap,
          indentWithTab,
        ]),

        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        EditorState.tabSize.of(2),

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

  onBeforeUnmount(() => {
    editorView.value?.destroy()
  })

  return [refContainer, editorView]
}
