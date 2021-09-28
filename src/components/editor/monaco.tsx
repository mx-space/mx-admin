import { useInjector } from 'hooks/use-deps-injection'
import { useSaveConfirm } from 'hooks/use-save-confirm'
import { editor as Editor, KeyCode, KeyMod, Selection } from 'monaco-editor'
import { UIStore } from 'stores/ui'
import {
  defineComponent,
  onMounted,
  PropType,
  Ref,
  ref,
  toRaw,
  watch,
} from 'vue'
import { editorBaseProps } from './universal/props'

const _MonacoEditor = defineComponent({
  props: {
    innerRef: {
      type: Object as PropType<Ref<Editor.IStandaloneCodeEditor> | undefined>,
    },
    ...editorBaseProps,
  },
  setup(props) {
    const editorRef = ref<HTMLDivElement>()
    let editor: Editor.IStandaloneCodeEditor
    onMounted(() => {
      if (!editorRef.value) {
        return
      }
      editor = initEditor(editorRef.value, props.text)
      ;['onKeyDown', 'onDidPaste', 'onDidBlurEditorText'].forEach(
        (eventName) => {
          // @ts-ignore
          editor[eventName](() => {
            const value = editor.getValue()
            props.onChange(value)
          })
        },
      )

      if (props.innerRef) {
        props.innerRef.value = editor
      }
    })
    // HACK
    let memoInitialValue: string = toRaw(props.text)

    watch(
      () => props.text,
      (n) => {
        if (!memoInitialValue && n) {
          memoInitialValue = n
        }
        if (editor && n != editor.getValue()) {
          editor.setValue(n)
        }
      },
    )

    useSaveConfirm(
      props.unSaveConfirm,
      () => memoInitialValue === editor.getValue(),
    )

    return () => (
      <div
        class="editor relative overflow-hidden"
        style={{ height: 'calc(100vh - 18rem)' }}
        ref={editorRef}
      ></div>
    )
  },
})

export const MonacoEditor = _MonacoEditor

const initEditor = ($el: HTMLElement, initialValue: string) => {
  const { isDark } = useInjector(UIStore)
  const editor = Editor.create($el, {
    value: initialValue,
    language: 'markdown',
    automaticLayout: true,
    wrappingStrategy: 'advanced',
    minimap: { enabled: false },
    theme: isDark.value ? 'vs-dark' : 'vs',
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

  watch(
    () => isDark.value,
    (isDark) => {
      editor.updateOptions({
        theme: isDark ? 'vs-dark' : 'vs',
      })
    },
  )

  editor.addAction({
    id: 'bold',
    label: 'bold',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_B],
    // @ts-ignore
    run: (e) => {
      registerRule(editor, '**')

      return null
    },
  })

  editor.addAction({
    id: 'em',
    label: 'em',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_I],
    // @ts-ignore
    run: (e) => {
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
    run: (e) => {
      return null
    },
  })

  editor.addAction({
    id: 'del',
    label: 'del',
    keybindings: [KeyMod.Alt | KeyCode.KEY_D],
    // @ts-ignore
    run: (e) => {
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
        run: (e) => {
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
