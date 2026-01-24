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
import { computed, defineComponent } from 'vue'
import type { FormDSL, FormGroup } from '~/components/config-form/types'
import type { LucideIcon } from 'lucide-vue-next'
import type { PropType } from 'vue'

import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'

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

export const SettingSidebar = defineComponent({
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
    const { sidebarCollapse } = useStoreRef(UIStore)

    const getGroupIcon = (iconName: string) => {
      return iconMap[iconName] || SettingsIcon
    }

    const allGroups = computed(() => {
      const systemGroups = props.systemSchema?.groups || []
      return [...staticGroupsBefore, ...systemGroups, ...staticGroupsAfter]
    })

    const renderGroupItem = (
      group: FormGroup | StaticGroup,
      isActive: boolean,
    ) => {
      const GroupIcon = getGroupIcon(group.icon)
      return (
        <button
          class={[
            'flex w-full cursor-pointer items-start gap-3 rounded-lg border-0 bg-transparent px-3 py-3 text-left transition-colors md:px-4',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            'focus-visible:ring-primary/50 focus-visible:outline-none focus-visible:ring-2',
            isActive && 'bg-neutral-100 dark:bg-neutral-800',
          ]}
          onClick={() => props.onGroupChange(group.key)}
          type="button"
        >
          <div
            class={[
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
              isActive
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
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
      )
    }

    return () => (
      <nav
        class={[
          'sticky top-0 z-10 -mx-8 shrink-0 border-b border-neutral-200 bg-[var(--content-bg)] px-8 py-3 dark:border-neutral-800',
          'md:fixed md:top-0 md:mx-0 md:h-screen md:w-64 md:overflow-y-auto md:border-b-0 md:bg-[var(--page-bg)] md:px-4 md:py-6 md:pt-16',
          'md:transition-[left] md:duration-200 md:ease-in-out',
          sidebarCollapse.value
            ? 'md:left-0'
            : 'md:left-[var(--sidebar-width)]',
        ]}
      >
        {/* Mobile: horizontal group navigation */}
        <MobileGroupNav
          groups={allGroups.value}
          activeGroupKey={props.activeGroupKey}
          onGroupChange={props.onGroupChange}
        />

        {/* Desktop: vertical flat list */}
        <div class="hidden md:block">
          <ul class="m-0 list-none space-y-1 p-0">
            {allGroups.value.map((group) => {
              const isActive = props.activeGroupKey === group.key
              return <li key={group.key}>{renderGroupItem(group, isActive)}</li>
            })}
          </ul>
        </div>
      </nav>
    )
  },
})

const MobileGroupNav = defineComponent({
  props: {
    groups: {
      type: Array as PropType<(FormGroup | StaticGroup)[]>,
      required: true,
    },
    activeGroupKey: {
      type: String,
      required: true,
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

    return () => (
      <div class="-mx-8 border-b border-neutral-200 bg-neutral-50 px-4 py-2 md:hidden dark:border-neutral-800 dark:bg-neutral-900">
        <ul class="scrollbar-none m-0 flex list-none gap-2 overflow-x-auto p-0">
          {props.groups.map((group) => {
            const GroupIcon = getGroupIcon(group.icon)
            const isActive = props.activeGroupKey === group.key
            return (
              <li key={group.key}>
                <button
                  class={[
                    'flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border-0 bg-transparent px-3 py-1.5 text-xs font-medium transition-colors',
                    'hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200',
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-neutral-500 dark:text-neutral-400',
                  ]}
                  onClick={() => props.onGroupChange(group.key)}
                  type="button"
                >
                  <GroupIcon class="size-3.5" />
                  {group.title}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  },
})
