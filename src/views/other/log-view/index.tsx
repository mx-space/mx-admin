import { ContentLayout } from 'layouts/content'
import { NTabPane, NTabs } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { LogListView } from './tabs/log-list'
import { RealtimeLogPipeline } from './tabs/realtime-log'

export default defineComponent({
  setup() {
    const route = useRoute()
    const tabIndex = computed(() => route.query.tab?.toString() || '0')
    const router = useRouter()

    return () => (
      <ContentLayout>
        <NTabs
          size="medium"
          value={tabIndex.value}
          onUpdateValue={(tab) => {
            router.replace({
              ...route,
              query: {
                ...route.query,
                tab,
              },
            })
          }}
        >
          <NTabPane tab={'日志'} name="0">
            <LogListView />
          </NTabPane>
          <NTabPane tab={'实时'} name="1">
            <RealtimeLogPipeline />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})
