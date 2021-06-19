import { ContentLayout } from 'layouts/content'
import { NTabPane, NTabs } from 'naive-ui'
import { defineComponent, inject, provide, Ref, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TabSystem } from './tabs/system'
import { TabUser } from './tabs/user'

const HeaderActionInjectKey = Symbol('tab')
export const useSystemHeaderAction = (): Ref<JSX.Element | null> =>
  inject(HeaderActionInjectKey) as any
enum SettingTab {
  User = 'user',
  System = 'system',
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
    const headerActionsEl = ref<null | JSX.Element>(null)
    provide(HeaderActionInjectKey, headerActionsEl)
    return () => (
      <ContentLayout actionsElement={headerActionsEl.value}>
        <NTabs
          value={tabValue.value}
          onUpdateValue={(e) => {
            router.replace({ ...route, params: { ...route.params, type: e } })
          }}
        >
          <NTabPane tab="用户" name={SettingTab.User}>
            <TabUser />
          </NTabPane>

          <NTabPane tab="系统" name={SettingTab.System}>
            <TabSystem />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})
