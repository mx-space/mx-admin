import { FunctionCodeEditor } from 'components/function-editor'
import { CenterSpin } from 'components/spin'
import { useAsyncLoadMonaco, usePropsValueToRef } from 'hooks/use-async-monaco'
import { PropType } from 'vue'
export const CodeEditorForSnippet = defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
    onChange: {
      type: Function as PropType<(str: string) => void>,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const editorRef = ref()

    const value = usePropsValueToRef(props)

    const obj = useAsyncLoadMonaco(
      editorRef,
      value,
      (v) => {
        value.value = v
      },
      {
        language: props.language,
      },
    )

    watch(
      () => value.value,
      (v) => {
        props.onChange(v)
      },
    )
    let timer: any = null
    onUnmounted(() => {
      if (timer) {
        timer = clearTimeout(timer)
      }
    })
    const setModelLanguage = (language: string) => {
      const editor = obj.editor
      if (!editor) {
        timer = setTimeout(() => {
          setModelLanguage(language)
        }, 100)
        return
      }
      const model = editor.getModel()
      if (!model) {
        timer = setTimeout(() => {
          setModelLanguage(language)
        }, 100)
        return
      }
      import('monaco-editor').then((mo) => {
        mo.editor.setModelLanguage(model, language)
      })
    }

    watch(
      () => props.language,
      (lang) => {
        setModelLanguage(lang)
      },
    )
    return () => (
      <div class={'h-full w-full relative'}>
        <div
          ref={editorRef}
          class={'h-full w-full relative'}
          style={{ display: props.language === 'javascript' ? 'none' : '' }}
        />

        {!obj.loaded.value && (
          <CenterSpin description="Monaco 体积较大耐心等待加载完成..." />
        )}

        {props.language === 'javascript' && (
          <FunctionCodeEditor value={value} />
        )}
      </div>
    )
  },
})
