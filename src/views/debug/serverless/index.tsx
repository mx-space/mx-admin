import { HeaderActionButton } from 'components/button/rounded-button'
import { FunctionCodeEditor } from 'components/function-editor'
import { CheckCircleOutlinedIcon } from 'components/icons'
import { ContentLayout } from 'layouts/content'
import { TwoColGridLayout } from 'layouts/two-col'
import { defaultServerlessFunction } from 'models/snippet'
import { NGi, useMessage } from 'naive-ui'
import { RESTManager } from 'utils'

import { useLocalStorage } from '@vueuse/core'

export default defineComponent({
  setup() {
    const value = useLocalStorage('debug-serverless', defaultServerlessFunction)

    const message = useMessage()
    const previewRef = ref<HTMLPreElement>()
    const errorMsg = ref('')
    const runTest = async () => {
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
            .colorize(JSON.stringify(res.data, null, 2), 'typescript', {
              tabSize: 2,
            })
            .then((res) => {
              previewRef.value!.innerHTML = res
            })
            .catch(() => {
              previewRef.value!.innerHTML = JSON.stringify(res, null, 2)
            })
        })
      } catch (e: any) {}
    }
    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              icon={<CheckCircleOutlinedIcon></CheckCircleOutlinedIcon>}
              onClick={runTest}
            ></HeaderActionButton>
          </>
        }
      >
        <TwoColGridLayout>
          <NGi span="18">
            <div class="h-[80vh]">
              <FunctionCodeEditor value={value} onSave={runTest} />
            </div>
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
