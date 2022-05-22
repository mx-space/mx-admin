import { useAsyncLoadMonaco } from 'hooks/use-async-monaco'
import { RESTManager } from 'utils'
import type { PropType, Ref } from 'vue'

import * as typeDefines from './lib.declare'

export const FunctionCodeEditor = defineComponent({
  props: {
    value: {
      type: Object as PropType<Ref<string>>,
      required: true,
    },
    onSave: { type: Function as PropType<() => any>, required: false },
    language: {
      type: String as PropType<string>,
      default: 'typescript',
    },
  },
  setup(props, { expose }) {
    const editorElRef = ref<HTMLDivElement>()

    const $editor = useAsyncLoadMonaco(
      editorElRef,
      props.value,
      (val) => {
        props.value.value = val
      },
      {
        language: props.language,
      },
    )

    expose($editor)

    watch(
      () => [$editor.loaded.value, props.language],
      ([loaded, language]) => {
        if (loaded) {
          import('monaco-editor').then((mo) => {
            const model = $editor.editor.getModel()
            if (!model) {
              return
            }
            mo.editor.setModelLanguage(model, language as string)
          })
        }
      },
    )

    onMounted(() => {
      import('monaco-editor').then((monaco) => {
        const compilerOptions =
          monaco.languages.typescript.typescriptDefaults.getCompilerOptions()
        compilerOptions.target = monaco.languages.typescript.ScriptTarget.ESNext
        compilerOptions.allowNonTsExtensions = true
        compilerOptions.moduleResolution =
          monaco.languages.typescript.ModuleResolutionKind.NodeJs
        compilerOptions.esModuleInterop = true

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
          compilerOptions,
        )

        const libUri = 'ts:filename/global.d.ts'
        if (!monaco.editor.getModel(monaco.Uri.parse(libUri))) {
          RESTManager.api.fn.types.get<any>().then((data) => {
            const libSource = data

            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              libSource,
              libUri,
            )
            // When resolving definitions and references, the editor will try to use created models.
            // Creating a model for the library allows "peek definition/references" commands to work with the library.
            monaco.editor.createModel(
              libSource,
              'typescript',
              monaco.Uri.parse(libUri),
            )
          })
        }

        Object.keys(typeDefines).forEach((key) => {
          const namespace = typeDefines[key] as {
            libSource: string
            libUri: string
          }
          const { libSource, libUri } = namespace
          const uri = monaco.Uri.parse(libUri)
          if (monaco.editor.getModel(uri)) {
            return
          }

          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            libSource,
            libUri,
          )
          // When resolving definitions and references, the editor will try to use created models.
          // Creating a model for the library allows "peek definition/references" commands to work with the library.
          monaco.editor.createModel(
            libSource,
            'typescript',
            monaco.Uri.parse(libUri),
          )
        })
      })
    })

    const cleaner = watch(
      () => $editor.loaded.value,
      (loaded) => {
        cleaner()
        import('monaco-editor').then((monaco) => {
          $editor.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
              props.onSave?.()
            },
          )
        })
      },
    )

    return () => {
      return (
        <div class="h-full relative w-full">
          <div class="relative h-full w-full" ref={editorElRef}></div>
          {h($editor.Snip)}
        </div>
      )
    }
  },
})
