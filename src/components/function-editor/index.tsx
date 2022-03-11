import { CenterSpin } from 'components/spin'
import { useAsyncLoadMonaco } from 'hooks/use-async-monaco'
import { PropType, Ref } from 'vue'
import * as typeDefines from './lib.declare'

export const FunctionCodeEditor = defineComponent({
  props: {
    value: {
      type: Object as PropType<Ref<string>>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const editorElRef = ref<HTMLDivElement>()

    const $editor = useAsyncLoadMonaco(
      editorElRef,
      props.value,
      (val) => {
        props.value.value = val
      },
      {
        language: 'javascript',
      },
    )

    onMounted(() => {
      import('monaco-editor').then((monaco) => {
        const compilerOptions =
          monaco.languages.typescript.javascriptDefaults.getCompilerOptions()
        compilerOptions.target = monaco.languages.typescript.ScriptTarget.ESNext
        compilerOptions.allowNonTsExtensions = true
        compilerOptions.allowJs = true
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
          compilerOptions,
        )
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: false,
        })

        // monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        //   target: monaco.languages.typescript.ScriptTarget.ES2020,
        // })

        Object.keys(typeDefines).forEach((key) => {
          const namespace = typeDefines[key] as {
            libSource: string
            libUri: string
          }
          const { libSource, libUri } = namespace
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            libSource,
            libUri,
          )
          // When resolving definitions and references, the editor will try to use created models.
          // Creating a model for the library allows "peek definition/references" commands to work with the library.
          monaco.editor.createModel(
            libSource,
            'javascript',
            monaco.Uri.parse(libUri),
          )
        })
      })
    })

    return () => {
      const { loaded } = $editor
      return (
        <div class="h-full relative w-full">
          <div class="relative h-full w-full" ref={editorElRef}></div>
          {!loaded.value && (
            <CenterSpin description="Monaco 体积较大耐心等待加载完成..." />
          )}
        </div>
      )
    }
  },
})
