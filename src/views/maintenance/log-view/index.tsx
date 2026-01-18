import { FileText, Radio } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { LogListView } from './tabs/log-list'
import { RealtimeLogPipeline } from './tabs/realtime-log'

const tabs = [
  { key: '0', label: '日志文件', icon: FileText },
  { key: '1', label: '实时日志', icon: Radio },
] as const

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const activeTab = computed(() => route.query.tab?.toString() || '0')

    const setTab = (tab: string) => {
      router.replace({
        ...route,
        query: { ...route.query, tab },
      })
    }

    return () => (
      <div class="flex h-full flex-col">
        {/* Tab Navigation */}
        <div class="mb-4 flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab.value === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                class={[
                  'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
                  'dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900',
                  isActive
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                ]}
              >
                <Icon class="size-4" />
                {tab.label}
                {/* Active indicator */}
                {isActive && (
                  <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white" />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div class="min-h-0 flex-1">
          {activeTab.value === '0' ? <LogListView /> : <RealtimeLogPipeline />}
        </div>
      </div>
    )
  },
})
