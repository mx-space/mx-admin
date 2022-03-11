import { useLocalStorage } from '@vueuse/core'
import { HeaderActionButton } from 'components/button/rounded-button'
import { CheckCircleOutlinedIcon } from 'components/icons'
import { useAsyncLoadMonaco } from 'hooks/use-async-monaco'
import { ContentLayout } from 'layouts/content'
import { TwoColGridLayout } from 'layouts/two-col'
import { defaultServerlessFunction } from 'models/snippet'
import { NGi, useMessage } from 'naive-ui'
import { RESTManager } from 'utils'

export default defineComponent({
  setup() {
    const editorRef = ref()

    const value = useLocalStorage('debug-serverless', defaultServerlessFunction)

    const $editor = useAsyncLoadMonaco(
      editorRef,
      value,
      (val) => {
        value.value = val
      },
      {
        language: 'javascript',
      },
    )

    onMounted(() => {
      import('monaco-editor').then((monaco) => {
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
        })

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
        })
      })
    })

    const message = useMessage()
    const previewRef = ref<HTMLPreElement>()
    const errorMsg = ref('')
    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              icon={<CheckCircleOutlinedIcon></CheckCircleOutlinedIcon>}
              onClick={async () => {
                try {
                  const res = await RESTManager.api.debug.function.post<any>({
                    data: {
                      function: value.value,
                    },
                    errorHandler: (err) => {
                      errorMsg.value = `Error: ${err.data.message}`
                      message.error(err.data.message)
                    },
                  })

                  import('monaco-editor').then((mo) => {
                    mo.editor
                      .colorize(
                        JSON.stringify(res.data, null, 2),
                        'typescript',
                        { tabSize: 2 },
                      )
                      .then((res) => {
                        previewRef.value!.innerHTML = res
                      })
                  })
                } catch (e: any) {}
              }}
            ></HeaderActionButton>
          </>
        }
      >
        <TwoColGridLayout>
          <NGi span="18">
            <div class="h-[80vh]" ref={editorRef}></div>
          </NGi>
          <NGi span="18">
            <pre
              class="overflow-auto max-h-[calc(100vh-10rem)] !bg-none !bg-transparent"
              ref={previewRef}
            >
              {errorMsg.value}
            </pre>
          </NGi>
        </TwoColGridLayout>
      </ContentLayout>
    )
  },
})
