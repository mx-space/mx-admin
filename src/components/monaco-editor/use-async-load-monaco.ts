import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  unref,
  watch,
} from 'vue'
import type { editor, IKeyboardEvent } from 'monaco-editor'
import type { Ref } from 'vue'

import { CenterSpin } from '~/components/spin'
import { useSaveConfirm } from '~/hooks/use-save-confirm'
import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'

import { useDefineMyThemes } from './use-define-theme'

export const useAsyncLoadMonaco = (
  editorRef: Ref<any>,
  value: Ref<string>,
  onChange: (str: string) => void,
  options: editor.IStandaloneEditorConstructionOptions & {
    unSaveConfirm?: boolean
  },
) => {
  const { unSaveConfirm = true, ...monacoOptions } = options
  useSaveConfirm(unSaveConfirm, () => false, '是否确定离开？')
  useDefineMyThemes()
  const loaded = ref(false)
  const monaco = {
    editor: null as any as editor.IStandaloneCodeEditor,
    module: null as any as typeof import('monaco-editor'),
    loaded: null as any as Ref<boolean>,

    Snip: defineComponent({
      setup() {
        return () =>
          loaded.value
            ? null
            : h(CenterSpin, {
                description: 'Monaco 体积较大耐心等待加载完成...',
              })
      },
    }),
  }
  const { isDark } = useStoreRef(UIStore)

  let memoInitialValue: string = unref(value)

  monaco.loaded = loaded

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
        theme: isDark ? 'dark' : 'light',
      })
    },
  )

  let editorModelMemo: editor.ITextModel | null = null

  onMounted(() => {
    import('monaco-editor').then((module) => {
      const options: editor.IStandaloneEditorConstructionOptions = {
        ...monacoOptions,
        value: value.value,
        theme: isDark.value ? 'dark' : 'light',
        automaticLayout: true,
        cursorStyle: 'line-thin',
        minimap: { enabled: false },
        tabSize: 2,
        fontFamily: 'operator mono, fira code, monaco, monospace',
        fontSize: 14,
      }
      if (options.language === 'typescript') {
        const modelUri = module.Uri.parse(`file:///main.tsx`)
        const existing = module.editor.getModel(modelUri)
        existing?.dispose()
        const editorModel = module.editor.createModel(
          value.value,
          'typescript',
          modelUri,
        )
        Object.assign(options, {
          model: editorModel,
        })

        editorModelMemo = editorModel
      }

      monaco.editor = module.editor.create(editorRef.value, options)

      monaco.module = module
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

      monaco.editor.addAction({
        id: 'trigger-suggestion',
        label: 'Trigger Suggestion',
        keybindings: [module.KeyMod.Shift | module.KeyCode.Space],
        run: () => {
          monaco.editor.trigger('', 'editor.action.triggerSuggest', {})
        },
      })

      monaco.editor.addAction({
        id: 'format',
        label: 'Format Document',
        keybindings: [
          module.KeyMod.Shift | module.KeyCode.KeyF | module.KeyMod.CtrlCmd,
        ],
        run: () => {
          monaco.editor.trigger('', 'editor.action.formatDocument', {})
        },
      })

      function stopHotKey(e: IKeyboardEvent) {
        const keys = [module.KeyCode.KeyS, module.KeyCode.KeyF]
        if ((e.ctrlKey || e.metaKey) && keys.includes(e.keyCode)) {
          e.preventDefault()
        }
      }
      monaco.editor.onKeyDown((e) => {
        stopHotKey(e)
      })
      monaco.editor.onKeyUp((e) => {
        stopHotKey(e)
      })
      loaded.value = true
    })
  })

  onUnmounted(async () => {
    monaco.editor?.dispose?.()
    // @ts-expect-error
    monaco.editor = null
    // @ts-expect-error
    monaco.module = null

    editorModelMemo?.dispose()
  })

  return monaco
}
