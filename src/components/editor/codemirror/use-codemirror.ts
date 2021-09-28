import { defaultKeymap } from '@codemirror/commands'
import { highlightActiveLineGutter, lineNumbers } from '@codemirror/gutter'
import {
  defaultHighlightStyle,
  HighlightStyle,
  tags,
} from '@codemirror/highlight'
import { history, historyKeymap } from '@codemirror/history'
import {
  markdown,
  markdownKeymap,
  markdownLanguage,
} from '@codemirror/lang-markdown'
import { indentOnInput } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { bracketMatching } from '@codemirror/matchbrackets'
import { EditorState } from '@codemirror/state'
import { EditorView, highlightActiveLine, keymap } from '@codemirror/view'
import { githubLight as theme } from '@ddietr/codemirror-themes/theme/github-light'
import { onMounted, ref, Ref } from 'vue'

export const customTheme = EditorView.theme({
  '&': {
    height: '100%',
  },
})

const syntaxHighlighting = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: '1.4em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading2,
    fontSize: '1.3em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading3,
    fontSize: '1.2em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading4,
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading5,
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  {
    tag: tags.heading6,
    fontSize: '1.1em',
    fontWeight: 'bold',
  },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.deleted, textDecoration: 'line-through' },
])

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
        keymap.of([...defaultKeymap, ...historyKeymap, ...markdownKeymap]),
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        defaultHighlightStyle.fallback,
        highlightActiveLine(),
        markdown({
          base: markdownLanguage,
          codeLanguages: languages,
          addKeymap: true,
        }),

        syntaxHighlighting,
        theme,
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

  return [refContainer, editorView]
}
