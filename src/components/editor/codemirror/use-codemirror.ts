import { Ref, onMounted, ref } from 'vue'

import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { highlightActiveLineGutter, lineNumbers } from '@codemirror/gutter'
import { defaultHighlightStyle } from '@codemirror/highlight'
import { history, historyKeymap } from '@codemirror/history'
import { markdownKeymap } from '@codemirror/lang-markdown'
import { indentOnInput } from '@codemirror/language'
import { bracketMatching } from '@codemirror/matchbrackets'
import { EditorState } from '@codemirror/state'
import { EditorView, highlightActiveLine, keymap } from '@codemirror/view'

import { codemirrorReconfigureExtension } from './extension'
import { syntaxHighlighting } from './syntax-highlight'
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
  const { onChange } = props

  onMounted(() => {
    if (!refContainer.value) return

    const startState = EditorState.create({
      doc: props.initialDoc,
      extensions: [
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...markdownKeymap,
          indentWithTab,
        ]),
        keymap.of([
          {
            key: 'Mod-s',
            run(view) {
              return false
            },
            preventDefault: true,
          },
        ]),

        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        defaultHighlightStyle.fallback,
        highlightActiveLine(),
        EditorState.tabSize.of(2),

        syntaxHighlighting,
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

  return [refContainer, editorView]
}
