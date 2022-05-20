import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
} from 'naive-ui'
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    const apiRecord = reactive({
      apiUrl: localStorage.getItem('__api') || '',
      gatewayUrl: localStorage.getItem('__gateway') || '',

      persist: false,
    })

    const handleOk = () => {
      const url = new URL(location.href)
      const { apiUrl, gatewayUrl, persist } = apiRecord
      apiUrl && url.searchParams.set('__api', apiUrl)
      gatewayUrl && url.searchParams.set('__gateway', gatewayUrl)

      if (persist) {
        apiUrl && localStorage.setItem('__api', apiUrl)
        gatewayUrl && localStorage.setItem('__gateway', gatewayUrl)
      }

      url.pathname = '/'

      if (!__DEV__) {
        url.hash = ''
      }
      location.href = url.toString()
    }
    const handleReset = () => {
      localStorage.removeItem('__api')
      localStorage.removeItem('__gateway')
      location.href = '/'
    }
    const handleLocalDev = () => {
      apiRecord.apiUrl = 'http://localhost:2333'
      apiRecord.gatewayUrl = 'http://localhost:2333'
    }
    return () => (
      <div class={'relative h-screen w-full flex items-center justify-center'}>
        <NCard title="设置 API" class="modal-card sm m-auto form-card">
          <NForm onSubmit={handleOk}>
            <NFormItem label="API 地址">
              <NInput
                value={apiRecord.apiUrl}
                onUpdateValue={(val) => {
                  apiRecord.apiUrl = val
                }}
              />
            </NFormItem>
            <NFormItem label="Gateway 地址">
              <NInput
                value={apiRecord.gatewayUrl}
                onUpdateValue={(val) => {
                  apiRecord.gatewayUrl = val
                }}
              />
            </NFormItem>

            <NFormItem label="持久化" labelPlacement="left">
              <NSwitch
                value={apiRecord.persist}
                onUpdateValue={(v) => {
                  apiRecord.persist = v
                }}
              ></NSwitch>
            </NFormItem>

            <div class="text-center space-x-2">
              <NButton onClick={handleLocalDev} round>
                本地调试
              </NButton>
              <NButton onClick={handleReset} round>
                重置
              </NButton>
              <NButton onClick={handleOk} round type="primary">
                确定
              </NButton>
            </div>
          </NForm>
        </NCard>
      </div>
    )
  },
})
