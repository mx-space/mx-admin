import { NButton, NCard, NForm, NFormItem, NSelect, NSwitch } from 'naive-ui'
import { defineComponent } from 'vue'

const storeApiUrlKey = 'mx-admin:setup-api:url'
const storeGatewayUrlKey = 'mx-admin:setup-api:gateway'

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

      const fullApiUrl = transformFullUrl(apiUrl)
      const fullGatewayUrl = transformFullUrl(gatewayUrl)

      fullApiUrl && url.searchParams.set('__api', fullApiUrl)
      fullGatewayUrl && url.searchParams.set('__gateway', fullGatewayUrl)

      if (persist) {
        fullApiUrl && localStorage.setItem('__api', fullApiUrl)
        fullGatewayUrl && localStorage.setItem('__gateway', fullGatewayUrl)
      }

      url.pathname = '/'

      if (!__DEV__) {
        url.hash = ''
      }

      localStorage.setItem(
        storeApiUrlKey,
        JSON.stringify([...new Set(historyApiUrl.concat(apiUrl))]),
      )
      localStorage.setItem(
        storeGatewayUrlKey,
        JSON.stringify([...new Set(historyApiUrl.concat(gatewayUrl))]),
      )

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

    const historyApiUrl: string[] = JSON.safeParse(
      localStorage.getItem(storeApiUrlKey) || '[]',
    )
    const historyGatewayUrl: string[] = JSON.safeParse(
      localStorage.getItem(storeGatewayUrlKey) || '[]',
    )

    return () => (
      <div class={'relative flex h-screen w-full items-center justify-center'}>
        <NCard title="设置 API" class="modal-card sm form-card m-auto">
          <NForm onSubmit={handleOk}>
            <NFormItem label="API 地址">
              <NSelect
                options={historyApiUrl.map((url) => ({
                  key: url,
                  value: url,
                  label: url,
                }))}
                filterable
                tag
                clearable
                value={apiRecord.apiUrl}
                onUpdateValue={(val) => {
                  apiRecord.apiUrl = val
                }}
              />
            </NFormItem>
            <NFormItem label="Gateway 地址">
              <NSelect
                tag
                options={historyGatewayUrl.map((url) => ({
                  key: url,
                  value: url,
                  label: url,
                }))}
                filterable
                clearable
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

            <div class="space-x-2 text-center">
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

const transformFullUrl = (url: string) => {
  if (!url) return ''

  if (url.startsWith('http')) return url
  else {
    const protocol =
      ['localhost', '127.0.0.1'].indexOf(url) > -1 ? 'http' : 'https'
    return `${protocol}://${url}`
  }
}
