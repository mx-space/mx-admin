import {
  defineAsyncComponent,
  defineComponent,
  onMounted,
  PropType,
  Ref,
  ref,
  watch,
} from 'vue'
import { editor as Editor, KeyMod, KeyCode, Selection } from 'monaco-editor'

const _MonacoEditor = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    innerRef: {
      type: Object as PropType<Ref<Editor.IStandaloneCodeEditor> | undefined>,
    },
  },
  setup(props) {
    const editorRef = ref<HTMLDivElement>()
    let editor: Editor.IStandaloneCodeEditor
    onMounted(() => {
      if (!editorRef.value) {
        return
      }
      editor = initEditor(editorRef.value, props.text)
      ;['onKeyDown', 'onDidPaste', 'onDidBlurEditorText'].forEach(eventName => {
        // @ts-ignore
        editor[eventName](() => {
          const value = editor.getValue()
          props.onChange(value)
        })
      })

      if (props.innerRef) {
        props.innerRef.value = editor
      }
    })

    watch(
      () => props.text,
      n => {
        if (editor && n != editor.getValue()) {
          editor.setValue(n)
        }
      },
    )
    return () => (
      <div
        class="editor relative overflow-hidden"
        style={{ height: 'calc(100vh - 15rem)' }}
        ref={editorRef}
      ></div>
    )
  },
})

export const MonacoEditor = defineAsyncComponent(() =>
  Promise.resolve(_MonacoEditor),
)

const initEditor = ($el: HTMLElement, initialValue: string) => {
  const editor = Editor.create($el, {
    value: initialValue,
    language: 'markdown',
    automaticLayout: true,
    wrappingStrategy: 'advanced',
    minimap: { enabled: false },
    wordWrap: 'on',
    cursorStyle: 'line-thin',
    formatOnType: true,
    quickSuggestions: { strings: false, other: false, comments: false },
    tabCompletion: 'off',
    parameterHints: {
      enabled: false,
    },
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    wordBasedSuggestions: false,
  })

  editor.addAction({
    id: 'bold',
    label: 'bold',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_B],
    // @ts-ignore
    run: e => {
      registerRule(editor, '**')

      return null
    },
  })

  editor.addAction({
    id: 'em',
    label: 'em',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_I],
    // @ts-ignore
    run: e => {
      registerRule(editor, '*')

      return null
    },
  })

  editor.addAction({
    id: 'null',
    label: 'null',
    keybindings: [
      KeyMod.CtrlCmd | KeyCode.KEY_S,
      KeyMod.Shift | KeyMod.Alt | KeyCode.KEY_F,
    ],
    // @ts-ignore
    run: e => {
      return null
    },
  })

  editor.addAction({
    id: 'del',
    label: 'del',
    keybindings: [KeyMod.Alt | KeyCode.KEY_D],
    // @ts-ignore
    run: e => {
      registerRule(editor, '~~')

      return null
    },
  })

  // eslint-disable-next-line no-sparse-arrays
  const keycodeMap: number[] = [
    ,
    KeyCode.KEY_1,
    KeyCode.KEY_2,
    KeyCode.KEY_3,
    KeyCode.KEY_4,
    KeyCode.KEY_5,
  ] as any
  Array.from({ length: 5 })
    .fill(null)
    .forEach((_, _i) => {
      const i = _i + 1
      editor.addAction({
        id: 'head-' + i,
        label: 'heading',
        keybindings: [KeyMod.CtrlCmd | keycodeMap[i]],
        // @ts-ignore
        run: e => {
          const selection = e.getSelection()
          if (!selection) {
            return null
          }
          const L = selection.startLineNumber
          const prefixRange = {
            startLineNumber: L,
            endLineNumber: L,
            startColumn: 0,
            endColumn: i + 2,
          }
          const prefix = e.getModel()?.getValueInRange(prefixRange)

          if (prefix && prefix == '#'.repeat(i) + ' ') {
            e.executeEdits('', [{ range: prefixRange, text: '' }])
            return
          }

          e.executeEdits('', [
            {
              range: {
                startLineNumber: L,
                endLineNumber: L,
                startColumn: 0,
                endColumn: 0,
              },
              text: `${'#'.repeat(i)} `,
            },
          ])
        },
      })
    })

  return editor
}

const registerRule = (editor: Editor.IStandaloneCodeEditor, symbol: string) => {
  const e = editor
  if (!e) {
    return
  }

  const len = symbol.length

  const selection = e.getSelection()

  if (!selection) {
    return
  }
  if (
    selection.startLineNumber == selection.endLineNumber &&
    selection.startColumn == selection.endColumn
  ) {
    e.executeEdits('', [{ range: selection, text: symbol.repeat(2) }])

    const newSelection = new Selection(
      selection.startLineNumber,
      selection.startColumn + len,
      selection.startLineNumber,
      selection.startColumn + len,
    )
    e.setSelection(newSelection)
  } else {
    const rangeText = e.getModel()?.getValueInRange(selection)
    if (!rangeText) {
      return
    }
    if (rangeText.startsWith(symbol) && rangeText.endsWith(symbol)) {
      // if already apply rule, cancel it
      e.executeEdits('', [
        {
          range: selection,
          text: `${rangeText.slice(len, rangeText.length - len)}`,
        },
      ])
      return
    }
    e.executeEdits('', [
      { range: selection, text: `${symbol}${rangeText}${symbol}` },
    ])
  }

  return
}
