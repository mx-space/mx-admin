import { ContentLayout } from 'layouts/content'
import { NTabPane, NTabs } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { Tab2ForEdit } from './tabs/for-edit'
import { Tab1ForList } from './tabs/for-list'

export default defineComponent({
  name: 'SnippetView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const currentTab = computed(() => route.query.tab || '0')

    return () => (
      <ContentLayout>
        <NTabs
          size="medium"
          value={currentTab.value as string}
          onUpdateValue={(e) => {
            router.push({
              query: {
                tab: e,
              },
            })
          }}
        >
          <NTabPane name={'0'} tab={'列表'}>
            <Tab1ForList />
          </NTabPane>

          <NTabPane name={'1'} tab={'编辑'}>
            <Tab2ForEdit />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})
