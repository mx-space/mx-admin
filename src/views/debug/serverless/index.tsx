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

    const editor$ = useAsyncLoadMonaco(
      editorRef,
      value,
      (val) => {
        value.value = val
      },
      {
        language: 'javascript',
      },
    )

    const message = useMessage()
    const previewRef = ref<HTMLPreElement>()
    const runResult = ref('')
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
                      runResult.value = `Error: ${err.data.message}`
                      message.error(err.data.message)
                    },
                  })

                  runResult.value = JSON.stringify(res.data, null, 2)
                  import('highlight.js/styles/github.css')

                  import('highlight.js').then((hljs) => {
                    nextTick(() => {
                      hljs.default.highlightElement(previewRef.value!)
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
              {runResult.value}
            </pre>
          </NGi>
        </TwoColGridLayout>
      </ContentLayout>
    )
  },
})
