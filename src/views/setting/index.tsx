import { Save as SaveIcon } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormDSL } from '~/components/config-form/types'

import { optionsApi } from '~/api/options'
import { useLayout } from '~/hooks/use-layout'

import { SettingSidebar } from './components/SettingSidebar'
import { TabAccount } from './tabs/account'
import { TabMetaPresets } from './tabs/meta-presets'
import { TabSystem } from './tabs/system'
import { TabUser } from './tabs/user'

const staticGroupKeys = ['user', 'account', 'meta-preset']

const staticComponentMap: Record<string, ReturnType<typeof defineComponent>> = {
  user: TabUser,
  account: TabAccount,
  'meta-preset': TabMetaPresets,
}

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { setActions, setHeaderClass } = useLayout()

    const systemSchema = ref<FormDSL | null>(null)
    const systemTabRef = ref<any>(null)
    const dirtyInfo = ref<{ isDirty: boolean; count: number }>({
      isDirty: false,
      count: 0,
    })

    const activeGroupKey = computed(() => {
      const queryGroup = route.query.group as string
      if (queryGroup) {
        const isStaticGroup = staticGroupKeys.includes(queryGroup)
        const isSystemGroup = systemSchema.value?.groups?.some(
          (g) => g.key === queryGroup,
        )
        if (isStaticGroup || isSystemGroup) {
          return queryGroup
        }
      }
      return 'user'
    })

    onBeforeMount(async () => {
      try {
        systemSchema.value = await optionsApi.getFormSchema()
      } catch (e) {
        console.error('Failed to load system schema', e)
      }
    })

    const handleGroupChange = (groupKey: string) => {
      router.replace({
        name: route.name as string,
        query: { group: groupKey },
      })
    }

    const isSystemGroup = computed(() => {
      return (
        systemSchema.value?.groups?.some(
          (g) => g.key === activeGroupKey.value,
        ) ?? false
      )
    })

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

    watchEffect(() => {
      const { isDirty, count } = dirtyInfo.value

      if (isSystemGroup.value && isDirty) {
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
    onMounted(() => {
      setHeaderClass('md:pl-72 mt-4')
    })

    onUnmounted(() => {
      setActions(null)
      setHeaderClass(null)
    })

    return () => {
      const StaticComponent = staticComponentMap[activeGroupKey.value]

      return (
        <div class="-mx-8 flex h-full flex-col md:flex-row">
          <SettingSidebar
            activeGroupKey={activeGroupKey.value}
            systemSchema={systemSchema.value}
            onGroupChange={handleGroupChange}
          />

          <main
            class={[
              'min-w-0 flex-1 overflow-y-auto px-8 py-6',
              'md:transition-[margin-left] md:duration-200 md:ease-in-out',
              'md:ml-64',
            ]}
          >
            <TabSystem
              ref={systemTabRef}
              activeGroup={activeGroup.value}
              schema={systemSchema.value}
              style={{ display: isSystemGroup.value ? undefined : 'none' }}
              {...{ 'onUpdate:dirty-info': handleDirtyInfoUpdate }}
            />
            {!isSystemGroup.value && StaticComponent && <StaticComponent />}
          </main>
        </div>
      )
    }
  },
})
