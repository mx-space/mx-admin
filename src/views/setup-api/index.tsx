import { Bug, Check, RotateCcw, Server } from 'lucide-vue-next'
import { NSelect, NSwitch } from 'naive-ui'
import { defineComponent, reactive } from 'vue'

const storeApiUrlKey = 'mx-admin:setup-api:url'
const storeGatewayUrlKey = 'mx-admin:setup-api:gateway'

export default defineComponent({
  setup() {
    const apiRecord = reactive({
      apiUrl:
        localStorage.getItem('__api') ||
        `${location.protocol}//${location.host}/api/v2`,
      gatewayUrl:
        localStorage.getItem('__gateway') ||
        `${location.protocol}//${location.host}`,

      persist: true,
    })

    const handleOk = () => {
      const { apiUrl, gatewayUrl, persist } = apiRecord

      const fullApiUrl = transformFullUrl(apiUrl)
      const fullGatewayUrl = transformFullUrl(gatewayUrl)

      if (persist) {
        fullApiUrl && localStorage.setItem('__api', fullApiUrl)
        fullGatewayUrl && localStorage.setItem('__gateway', fullGatewayUrl)
      } else {
        fullApiUrl && sessionStorage.set('__api', fullApiUrl)
        fullGatewayUrl && sessionStorage.set('__gateway', fullGatewayUrl)
      }

      localStorage.setItem(
        storeApiUrlKey,
        JSON.stringify([...new Set(historyApiUrl.concat(apiUrl))]),
      )
      localStorage.setItem(
        storeGatewayUrlKey,
        JSON.stringify([...new Set(historyApiUrl.concat(gatewayUrl))]),
      )
      const url = new URL(location.href)
      url.hash = '#/dashboard'
      location.href = url.toString()
      location.reload()
    }

    const handleReset = () => {
      localStorage.removeItem('__api')
      localStorage.removeItem('__gateway')

      sessionStorage.removeItem('__api')
      sessionStorage.removeItem('__gateway')

      location.href = location.pathname
      location.hash = ''
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
      <div class="flex min-h-screen flex-col items-center justify-center p-4">
        {/* Icon */}
        <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <Server class="h-10 w-10" aria-hidden="true" />
        </div>

        {/* Title */}
        <h1 class="mb-2 text-xl font-medium tracking-wide text-white drop-shadow-lg">
          设置 API
        </h1>
        <p class="mb-8 text-sm text-white/70">配置后端服务地址</p>

        {/* Form Card */}
        <div class="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleOk()
            }}
          >
            {/* API URL */}
            <div class="mb-4">
              <label
                for="api-url"
                class="mb-2 block text-sm font-medium text-white/90"
              >
                API 地址
              </label>
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
                class="setup-api-select"
              />
            </div>

            {/* Gateway URL */}
            <div class="mb-4">
              <label
                for="gateway-url"
                class="mb-2 block text-sm font-medium text-white/90"
              >
                Gateway 地址
              </label>
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
                class="setup-api-select"
              />
            </div>

            {/* Persist Toggle */}
            <div class="mb-6 flex items-center justify-between">
              <span class="text-sm text-white/90">持久化保存</span>
              <NSwitch
                value={apiRecord.persist}
                onUpdateValue={(v) => {
                  apiRecord.persist = v
                }}
              />
            </div>

            {/* Actions */}
            <div class="flex gap-3">
              <button
                type="button"
                onClick={handleLocalDev}
                aria-label="本地调试"
                class="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 text-sm text-white/90 backdrop-blur-sm transition-all hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <Bug class="h-4 w-4" aria-hidden="true" />
                <span>本地调试</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                aria-label="重置"
                class="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 text-sm text-white/90 backdrop-blur-sm transition-all hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <RotateCcw class="h-4 w-4" aria-hidden="true" />
                <span>重置</span>
              </button>

              <button
                type="submit"
                aria-label="确定"
                class="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white/90 text-sm font-medium text-neutral-900 transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <Check class="h-4 w-4" aria-hidden="true" />
                <span>确定</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  },
})

const transformFullUrl = (url: string) => {
  if (!url) return ''

  if (url.startsWith('http')) return url
  else {
    const protocol = ['localhost', '127.0.0.1'].includes(url) ? 'http' : 'https'
    return `${protocol}://${url}`
  }
}
