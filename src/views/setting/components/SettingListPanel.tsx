import {
  Bell as BellIcon,
  Database as DatabaseIcon,
  FileText as FileTextIcon,
  Globe as GlobeIcon,
  ListPlus as ListPlusIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Sparkles as SparklesIcon,
  User as UserIcon,
} from 'lucide-vue-next'
import { NScrollbar } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { FormDSL } from '~/components/config-form/types'
import type { LucideIcon } from 'lucide-vue-next'
import type { PropType } from 'vue'

export interface StaticGroup {
  key: string
  title: string
  description: string
  icon: string
}

const staticGroupsBefore: StaticGroup[] = [
  { key: 'user', title: '用户', description: '个人资料', icon: 'user' },
]

const staticGroupsAfter: StaticGroup[] = [
  {
    key: 'account',
    title: '账号安全',
    description: '登录、认证、凭证',
    icon: 'shield',
  },
  {
    key: 'meta-preset',
    title: 'Meta 预设',
    description: '预设模板',
    icon: 'list-plus',
  },
]

const iconMap: Record<string, LucideIcon> = {
  globe: GlobeIcon,
  search: SearchIcon,
  bell: BellIcon,
  shield: ShieldIcon,
  settings: SettingsIcon,
  sparkles: SparklesIcon,
  user: UserIcon,
  'list-plus': ListPlusIcon,
  database: DatabaseIcon,
  'file-text': FileTextIcon,
}

export const SettingListPanel = defineComponent({
  props: {
    activeGroupKey: {
      type: String,
      required: true,
    },
    systemSchema: {
      type: Object as PropType<FormDSL | null>,
      default: null,
    },
    onGroupChange: {
      type: Function as PropType<(key: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const getGroupIcon = (iconName: string) => {
      return iconMap[iconName] || SettingsIcon
    }

    const allGroups = computed(() => {
      const systemGroups = props.systemSchema?.groups || []
      return [...staticGroupsBefore, ...systemGroups, ...staticGroupsAfter]
    })

    return () => (
      <div class="flex h-full flex-col">
        <div class="flex h-12 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            设置
          </span>
          <span class="text-xs text-neutral-400">
            {allGroups.value.length} 项
          </span>
        </div>

        <div class="min-h-0 flex-1">
          <NScrollbar class="h-full">
            <ul class="m-0 list-none p-0">
              {allGroups.value.map((group) => {
                const GroupIcon = getGroupIcon(group.icon)
                const isActive = props.activeGroupKey === group.key
                return (
                  <li key={group.key}>
                    <button
                      class={[
                        'flex w-full cursor-pointer items-center gap-3 border-0 border-b border-neutral-100 bg-transparent px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
                        isActive
                          ? 'bg-neutral-100 dark:bg-neutral-800'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
                      ]}
                      onClick={() => props.onGroupChange(group.key)}
                      type="button"
                    >
                      <div
                        class={[
                          'flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
                          isActive
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
                        ]}
                      >
                        <GroupIcon />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {group.title}
                        </div>
                        <div class="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {group.description}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </NScrollbar>
        </div>
      </div>
    )
  },
})
