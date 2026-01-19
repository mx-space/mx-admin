import { Save as SaveIcon } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormDSL } from '~/components/config-form/types'

import { optionsApi } from '~/api/options'
import { useLayout } from '~/hooks/use-layout'

import { SettingSidebar, SettingTab } from './components/SettingSidebar'
import styles from './index.module.css'
import { TabAuth } from './tabs/auth'
import { TabMetaPresets } from './tabs/meta-presets'
import { TabSecurity } from './tabs/security'
import { TabSystem } from './tabs/system'
import { TabUser } from './tabs/user'

const tabComponentMap = {
  [SettingTab.User]: TabUser,
  [SettingTab.System]: TabSystem,
  [SettingTab.Security]: TabSecurity,
  [SettingTab.Auth]: TabAuth,
  [SettingTab.MetaPreset]: TabMetaPresets,
}

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { setActions } = useLayout()
    const activeTab = ref<SettingTab>(
      (route.params.type as SettingTab) || SettingTab.User,
    )
    const systemSchema = ref<FormDSL | null>(null)
    const systemTabRef = ref<any>(null)
    const dirtyInfo = ref<{ isDirty: boolean; count: number }>({
      isDirty: false,
      count: 0,
    })

    // activeGroupKey synced with route query
    const activeGroupKey = computed(() => {
      const queryGroup = route.query.group as string
      if (
        queryGroup &&
        systemSchema.value?.groups?.some((g) => g.key === queryGroup)
      ) {
        return queryGroup
      }
      return systemSchema.value?.groups?.[0]?.key || ''
    })

    onBeforeMount(async () => {
      try {
        systemSchema.value = await optionsApi.getFormSchema()
      } catch (e) {
        console.error('Failed to load system schema', e)
      }
    })

    watch(
      () => route.params.type,
      (newType) => {
        if (newType) {
          activeTab.value = newType as SettingTab
        }
      },
    )

    const handleTabChange = (key: SettingTab) => {
      const query =
        key === SettingTab.System ? { group: activeGroupKey.value } : {}
      router.replace({
        name: route.name as string,
        params: { ...route.params, type: key },
        query,
      })
    }

    const handleGroupChange = (groupKey: string) => {
      router.replace({
        name: route.name as string,
        params: { ...route.params, type: SettingTab.System },
        query: { group: groupKey },
      })
    }

    const isSystemTabActive = computed(
      () => activeTab.value === SettingTab.System,
    )

    const activeGroup = computed(() => {
      if (!systemSchema.value?.groups) return null
      return systemSchema.value.groups.find(
        (g) => g.key === activeGroupKey.value,
      )
    })

    const handleDirtyInfoUpdate = (info: {
      isDirty: boolean
      count: number
    }) => {
      dirtyInfo.value = info
    }

    const handleSaveAll = async () => {
      if (systemTabRef.value?.saveAll) {
        await systemTabRef.value.saveAll()
      }
    }

    // Setup header actions based on dirty state
    // Access dirtyInfo before condition to ensure Vue tracks it as dependency
    watchEffect(() => {
      const { isDirty, count } = dirtyInfo.value

      if (isSystemTabActive.value && isDirty) {
        setActions(
          <div class="flex items-center gap-3">
            <span class="text-sm text-neutral-600 dark:text-neutral-400">
              你有 {count} 项未保存的修改
            </span>
            <NButton
              type="primary"
              size="small"
              onClick={handleSaveAll}
              renderIcon={() => <SaveIcon size={16} />}
            >
              保存全部
            </NButton>
          </div>,
        )
      } else {
        setActions(null)
      }
    })

    // Clean up on unmount
    onUnmounted(() => {
      console.log('onUnmounted')
      setActions(null)
    })

    return () => {
      const ActiveComponent = tabComponentMap[activeTab.value] || TabUser

      return (
        <div class={styles.container}>
          <SettingSidebar
            activeTab={activeTab.value}
            activeGroupKey={activeGroupKey.value}
            systemSchema={systemSchema.value}
            onTabChange={handleTabChange}
            onGroupChange={handleGroupChange}
          />

          <main class={styles.content}>
            <TabSystem
              ref={systemTabRef}
              activeGroup={activeGroup.value}
              schema={systemSchema.value}
              style={{ display: isSystemTabActive.value ? undefined : 'none' }}
              {...{ 'onUpdate:dirty-info': handleDirtyInfoUpdate }}
            />
            {!isSystemTabActive.value && <ActiveComponent />}
          </main>
        </div>
      )
    }
  },
})
