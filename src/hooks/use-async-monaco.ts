import type { editor } from 'monaco-editor'
import { UIStore } from 'stores/ui'
import { Ref } from 'vue'
import { useInjector } from './use-deps-injection'

export const usePropsValueToRef = <T extends { value: string }>(props: T) => {
  const value = ref(props.value)
  watch(
    () => props.value,
    (n) => {
      value.value = n
    },
  )
  return value
}

export const useAsyncLoadMonaco = (
  editorRef: Ref<any>,
  value: Ref<string>,
  onChange: (str: string) => void,
  options: editor.IStandaloneEditorConstructionOptions,
) => {
  const monaco = {
    editor: null as any as editor.IStandaloneCodeEditor,
  }
  const { isDark } = useInjector(UIStore)

  let memoInitialValue: string = unref(value)

  watch(
    () => value.value,
    (n) => {
      if (!memoInitialValue && n) {
        memoInitialValue = n
      }
      const editor = monaco.editor
      if (editor && n != editor.getValue()) {
        editor.setValue(n)
      }
    },
  )

  watch(
    () => isDark.value,
    (isDark) => {
      const editor = monaco.editor
      editor.updateOptions({
        theme: isDark ? 'vs-dark' : 'vs',
      })
    },
  )

  onMounted(() => {
    import('monaco-editor').then((mo) => {
      monaco.editor = mo.editor.create(editorRef.value, {
        ...options,
        value: value.value,
        theme: isDark.value ? 'vs-dark' : 'vs',
        automaticLayout: true,
        minimap: { enabled: false },
        tabSize: 2,
        fontFamily: 'operator mono, fira code ,monaco, monospace',
        fontSize: 14,
      })
      ;['onKeyDown', 'onDidPaste', 'onDidBlurEditorText'].forEach(
        (eventName) => {
          const editor = monaco.editor
          // @ts-ignore
          editor[eventName](() => {
            const value = editor.getValue()
            onChange(value)
          })
        },
      )
    })
  })

  return monaco
}
