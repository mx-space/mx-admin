import {
  Bell as BellIcon,
  ChevronDown as ChevronDownIcon,
  Fingerprint as FingerprintIcon,
  Globe as GlobeIcon,
  ListPlus as ListPlusIcon,
  Puzzle as PuzzleIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Sparkles as SparklesIcon,
  User as UserIcon,
} from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import type { FormDSL, FormGroup } from '~/components/config-form/types'
import type { LucideIcon } from 'lucide-vue-next'
import type { PropType } from 'vue'

import styles from '../index.module.css'

export enum SettingTab {
  User = 'user',
  System = 'system',
  Security = 'security',
  Auth = 'auth',
  MetaPreset = 'meta-preset',
}

export interface TabConfig {
  key: SettingTab
  label: string
  icon: LucideIcon
  hasGroups?: boolean
}

export const tabConfigs: TabConfig[] = [
  { key: SettingTab.User, label: '用户', icon: UserIcon },
  {
    key: SettingTab.System,
    label: '系统',
    icon: SettingsIcon,
    hasGroups: true,
  },
  { key: SettingTab.Security, label: '安全', icon: ShieldIcon },
  { key: SettingTab.Auth, label: '登入方式', icon: FingerprintIcon },
  { key: SettingTab.MetaPreset, label: 'Meta 预设', icon: ListPlusIcon },
]

const iconMap: Record<string, LucideIcon> = {
  globe: GlobeIcon,
  search: SearchIcon,
  bell: BellIcon,
  puzzle: PuzzleIcon,
  shield: ShieldIcon,
  settings: SettingsIcon,
  sparkles: SparklesIcon,
}

export const SettingSidebar = defineComponent({
  props: {
    activeTab: {
      type: String as PropType<SettingTab>,
      required: true,
    },
    activeGroupKey: {
      type: String,
      default: '',
    },
    systemSchema: {
      type: Object as PropType<FormDSL | null>,
      default: null,
    },
    onTabChange: {
      type: Function as PropType<(key: SettingTab) => void>,
      required: true,
    },
    onGroupChange: {
      type: Function as PropType<(key: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const systemExpanded = ref(true)

    const isSystemTabActive = computed(
      () => props.activeTab === SettingTab.System,
    )

    const getGroupIcon = (iconName: string) => {
      return iconMap[iconName] || SettingsIcon
    }

    const toggleSystemExpand = () => {
      systemExpanded.value = !systemExpanded.value
    }

    const handleSystemClick = () => {
      if (props.activeTab !== SettingTab.System) {
        props.onTabChange(SettingTab.System)
      }
      toggleSystemExpand()
    }

    return () => (
      <nav class={styles.sidebar}>
        {/* Mobile: horizontal tab navigation */}
        <ul class={styles.navList}>
          {tabConfigs.map((tab) => {
            const Icon = tab.icon
            const isActive = props.activeTab === tab.key

            return (
              <li key={tab.key} class="md:hidden">
                <button
                  class={[styles.navItem, isActive && styles.navItemActive]}
                  onClick={() => props.onTabChange(tab.key)}
                  type="button"
                >
                  <Icon class={styles.navIcon} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Desktop: vertical navigation with collapsible system groups */}
        <div class="hidden md:block">
          <ul class="m-0 list-none p-0">
            {tabConfigs.map((tab) => {
              const Icon = tab.icon
              const isActive = props.activeTab === tab.key

              if (tab.hasGroups) {
                return (
                  <li key={tab.key} class="mb-2">
                    {/* System tab header - clickable to expand/collapse */}
                    <button
                      class={[
                        styles.navItem,
                        isActive && styles.navItemActive,
                        'w-full justify-between',
                      ]}
                      onClick={handleSystemClick}
                      type="button"
                    >
                      <div class="flex items-center gap-3">
                        <Icon class={styles.navIcon} aria-hidden="true" />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronDownIcon
                        class={[
                          styles.navExpandIcon,
                          systemExpanded.value && styles.navExpandIconOpen,
                        ]}
                      />
                    </button>

                    {/* Collapsible group list */}
                    {systemExpanded.value && props.systemSchema?.groups && (
                      <ul class="m-0 mt-1 list-none space-y-1 p-0">
                        {props.systemSchema.groups.map((group: FormGroup) => {
                          const GroupIcon = getGroupIcon(group.icon)
                          const isGroupActive =
                            isActive && props.activeGroupKey === group.key

                          return (
                            <li key={group.key}>
                              <button
                                class={[
                                  styles.groupNavItem,
                                  isGroupActive && styles.groupNavItemActive,
                                ]}
                                onClick={() => props.onGroupChange(group.key)}
                                type="button"
                              >
                                <div
                                  class={[
                                    styles.groupNavIcon,
                                    isGroupActive && styles.groupNavIconActive,
                                  ]}
                                >
                                  <GroupIcon />
                                </div>
                                <div class={styles.groupNavContent}>
                                  <div class={styles.groupNavTitle}>
                                    {group.title}
                                  </div>
                                  <div class={styles.groupNavDescription}>
                                    {group.description}
                                  </div>
                                </div>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }

              return (
                <li key={tab.key}>
                  <button
                    class={[styles.navItem, isActive && styles.navItemActive]}
                    onClick={() => props.onTabChange(tab.key)}
                    type="button"
                  >
                    <Icon class={styles.navIcon} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Mobile: horizontal group navigation for system tab */}
        {isSystemTabActive.value && props.systemSchema?.groups && (
          <MobileGroupNav
            groups={props.systemSchema.groups}
            activeGroupKey={props.activeGroupKey}
            onGroupChange={props.onGroupChange}
          />
        )}
      </nav>
    )
  },
})

const MobileGroupNav = defineComponent({
  props: {
    groups: {
      type: Array as PropType<FormGroup[]>,
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
      <div class={styles.mobileGroupNav}>
        <ul class={styles.mobileGroupNavList}>
          {props.groups.map((group) => {
            const GroupIcon = getGroupIcon(group.icon)
            return (
              <li key={group.key}>
                <button
                  class={[
                    styles.mobileGroupNavItem,
                    props.activeGroupKey === group.key &&
                      styles.mobileGroupNavItemActive,
                  ]}
                  onClick={() => props.onGroupChange(group.key)}
                  type="button"
                >
                  <GroupIcon class={styles.mobileGroupNavIcon} />
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
