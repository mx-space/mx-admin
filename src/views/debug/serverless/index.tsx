import { HeaderActionButton } from 'components/button/rounded-button'
import { FunctionCodeEditor } from 'components/function-editor'
import { CheckCircleOutlinedIcon } from 'components/icons'
import { useInjector } from 'hooks/use-deps-injection'
import { ContentLayout } from 'layouts/content'
import { TwoColGridLayout } from 'layouts/two-col'
import { defaultServerlessFunction } from 'models/snippet'
import { NGi, useMessage } from 'naive-ui'
import ReactJSONView from 'react-json-view'
import { UIStore } from 'stores/ui'
import { RESTManager } from 'utils'
import { ReactWrapper } from 'vue-react-wrapper'

import { useLocalStorage } from '@vueuse/core'

const object = reactive({
  // props
  src: null as any,
  indentWidth: 2,
  theme: 'rjv-default',

  text: '',
})
const JSONView = ReactWrapper(ReactJSONView, object)

export default defineComponent({
  setup() {
    const value = useLocalStorage('debug-serverless', defaultServerlessFunction)
    const ui = useInjector(UIStore)
    watch(
      () => ui.isDark.value,
      (dark) => {
        object.theme = dark ? 'chalk' : 'rjv-default'
      },
      {
        immediate: true,
      },
    )
    const message = useMessage()

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

        if (typeof res.data === 'object') {
          object.src = res.data
          object.text = ''
        } else {
          object.text = res
          object.src = null
        }
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
          <NGi span="18" class={'overflow-auto'}>
            {!object.src && !object.text ? null : !object.text ? (
              <JSONView />
            ) : (
              <pre class="overflow-auto">{object.text}</pre>
            )}
          </NGi>
        </TwoColGridLayout>
      </ContentLayout>
    )
  },
})
