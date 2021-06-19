import { ContentLayout } from 'layouts/content'
import { NTabPane, NTabs } from 'naive-ui'
import { defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TabUser } from './tabs/user'

enum SettingTab {
  User = 'user',
}
export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const tabValue = ref(route.params.type as string)

    watch(
      () => route.params.type,
      (n) => {
        if (!n) {
          return
        }
        tabValue.value = n as any
      },
    )
    return () => (
      <ContentLayout>
        <NTabs value={tabValue.value}>
          <NTabPane tab="用户" name={SettingTab.User}>
            <TabUser />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})
