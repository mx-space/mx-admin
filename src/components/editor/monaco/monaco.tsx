import { CenterSpin } from 'components/spin'
import { useSaveConfirm } from 'hooks/use-save-confirm'
import { useStoreRef } from 'hooks/use-store-ref'
import type { editor as Editor } from 'monaco-editor'
// eslint-disable-next-line
import type monaco from 'monaco-editor'
import { UIStore } from 'stores/ui'
import type { PropType, Ref } from 'vue'
import { defineComponent, onMounted, ref, toRaw, watch } from 'vue'

import styles from '../universal/editor.module.css'
import { editorBaseProps } from '../universal/props'
import { useEditorConfig } from '../universal/use-editor-setting'
import { useDefineMyThemes } from './use-define-theme'

export const MonacoEditor = defineComponent({
  name: 'MonacoEditor',
  props: {
    innerRef: {
      type: Object as PropType<Ref<Editor.IStandaloneCodeEditor> | undefined>,
    },
    ...editorBaseProps,
  },
  setup(props) {
    const editorRef = ref<HTMLDivElement>()
    const loaded = ref(false)
    let editor: Editor.IStandaloneCodeEditor
    const { isDark } = useStoreRef(UIStore)
    const {
      general: {
        setting: { autocorrect },
      },
    } = useEditorConfig()

    watch(
      () => [autocorrect],
      () => {
        if (!editor) {
          return
        }
      },
    )

    const initAutoCorrect = (editor: Editor.IStandaloneCodeEditor) => {
      Promise.all([
        import('@huacnlee/autocorrect'),
        import('monaco-editor'),
      ]).then(([autocorrect, monaco]) => {
        editor.onKeyDown((e) => {
          if (e.code === 'Enter') {
            const result = autocorrect.lintFor(editor.getValue(), 'text')

            if (result.lines.length) {
              const { l, c, new: newText } = result.lines[0]
              const position = editor.getPosition()

              if (!position) {
                return
              }

              editor.executeEdits('autocorrect', [
                {
                  range: new monaco.Range(l, c, l, Infinity),
                  text: newText,
                },
              ])
            }
          }
        })
        editor.onDidChangeModelContent(() => {
          const result = autocorrect.lintFor(editor.getValue(), 'text')

          monaco.editor.setModelMarkers(
            // @ts-ignore
            editor.getModel(),
            'autocorrect',
            createMarkers(result),
          )
        })

        function createMarkers(result: any) {
          const markers: monaco.editor.IMarkerData[] = result.lines.map(
            (lineResult: any) => {
              return {
                severity:
                  lineResult.severity === 1
                    ? monaco.MarkerSeverity.Warning
                    : monaco.MarkerSeverity.Info,
                startLineNumber: lineResult.l,
                startColumn: lineResult.c,
                endLineNumber: lineResult.l,
                endColumn: lineResult.c + lineResult.old.length + 1,
                message: `AutoCorrect: ${lineResult.new}`,
              }
            },
          )

          return markers
        }
      })
    }

    useDefineMyThemes()
    onBeforeUnmount(() => {
      editor?.dispose?.()
    })
    onMounted(async () => {
      if (!editorRef.value) {
        return
      }
      editor = await initEditor(editorRef.value, props.text, isDark)
      loaded.value = true
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

      if (autocorrect) {
        initAutoCorrect(editor)
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
        class={['editor relative overflow-hidden', styles.editor]}
        ref={editorRef}
      >
        {loaded.value ? null : <CenterSpin />}
      </div>
    )
  },
})

const initEditor = async (
  $el: HTMLElement,
  initialValue: string,
  isDark: Ref<boolean>,
) => {
  const { editor: Editor, KeyCode, KeyMod } = await import('monaco-editor')

  const editor = Editor.create($el, {
    value: initialValue,
    language: 'markdown',
    automaticLayout: true,
    wrappingStrategy: 'advanced',
    minimap: { enabled: false },
    theme: isDark.value ? 'dark' : 'light',
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
        theme: isDark ? 'dark' : 'light',
      })
    },
  )

  editor.addAction({
    id: 'bold',
    label: 'bold',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KeyB],
    // @ts-ignore
    run: (e) => {
      registerRule(editor, '**')

      return null
    },
  })

  editor.addAction({
    id: 'em',
    label: 'em',
    keybindings: [KeyMod.CtrlCmd | KeyCode.KeyI],
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
      KeyMod.CtrlCmd | KeyCode.KeyS,
      KeyMod.Shift | KeyMod.Alt | KeyCode.KeyF,
    ],
    // @ts-ignore
    run: (e) => {
      return null
    },
  })

  editor.addAction({
    id: 'del',
    label: 'del',
    keybindings: [KeyMod.Alt | KeyCode.KeyD],
    // @ts-ignore
    run: (e) => {
      registerRule(editor, '~~')

      return null
    },
  })

  // eslint-disable-next-line no-sparse-arrays
  const keycodeMap: number[] = [
    ,
    KeyCode.Digit1,
    KeyCode.Digit2,
    KeyCode.Digit3,
    KeyCode.Digit4,
    KeyCode.Digit5,
  ] as any
  Array.from({ length: 5 })
    .fill(null)
    .forEach((_, _i) => {
      const i = _i + 1
      editor.addAction({
        id: `head-${i}`,
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

          if (prefix && prefix == `${'#'.repeat(i)} `) {
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

const registerRule = async (
  editor: Editor.IStandaloneCodeEditor,
  symbol: string,
) => {
  const { Selection } = await import('monaco-editor')
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
