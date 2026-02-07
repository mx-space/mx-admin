import { defineComponent, h, onMounted, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'

import { systemApi } from '~/api'
import { useAsyncLoadMonaco } from '~/hooks/use-async-monaco'

import { createDebouncedATA, initATA } from './use-ata'

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

    let debouncedAta: ((code: string) => void) | undefined

    const $editor = useAsyncLoadMonaco(
      editorElRef,
      props.value,
      (val) => {
        props.value.value = val
        debouncedAta?.(val)
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
            if (!model) return
            mo.editor.setModelLanguage(model, language as string)
          })
        }
      },
    )

    onMounted(() => {
      import('monaco-editor').then(async (monaco) => {
        const compilerOptions = {
          ...monaco.typescript.typescriptDefaults.getCompilerOptions(),
          target: monaco.typescript.ScriptTarget.ESNext,
          module: monaco.typescript.ModuleKind.ESNext,
          allowNonTsExtensions: true,
          moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          baseUrl: 'file:///',
        }

        monaco.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
        monaco.typescript.javascriptDefaults.setCompilerOptions({
          ...monaco.typescript.javascriptDefaults.getCompilerOptions(),
          ...compilerOptions,
        })
        monaco.typescript.typescriptDefaults.setEagerModelSync(true)
        monaco.typescript.javascriptDefaults.setEagerModelSync(true)

        const libUri = 'ts:filename/global.d.ts'
        if (!monaco.editor.getModel(monaco.Uri.parse(libUri))) {
          systemApi.getFnTypes().then((libSource) => {
            monaco.typescript.typescriptDefaults.addExtraLib(libSource, libUri)
            monaco.typescript.javascriptDefaults.addExtraLib(libSource, libUri)
            monaco.editor.createModel(
              libSource,
              'typescript',
              monaco.Uri.parse(libUri),
            )
          })
        }

        const ataFn = await initATA(monaco)
        debouncedAta = createDebouncedATA(ataFn)
        ataFn(props.value.value).catch(() => {})
      })
    })

    const cleaner = watch(
      () => $editor.loaded.value,
      (_loaded) => {
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
        <div class="relative h-full w-full">
          <div class="relative h-full w-full" ref={editorElRef} />
          {h($editor.Snip)}
        </div>
      )
    }
  },
})
