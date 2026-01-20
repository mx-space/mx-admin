import {
  ExternalLink,
  LogOut,
  Monitor,
  Moon,
  PanelLeftClose,
  Sun,
} from 'lucide-vue-next'
import { NDropdown, NLayoutContent } from 'naive-ui'
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ThemeMode } from '~/stores/ui'
import type { DropdownOption } from 'naive-ui'
import type { PropType } from 'vue'
import type { MenuModel } from '../../utils/build-menus'

import { onClickOutside } from '@vueuse/core'

import { userApi } from '~/api'
import { WEB_URL } from '~/constants/env'
import { RouteName } from '~/router/name'
import { AppStore } from '~/stores/app'
import { UIStore } from '~/stores/ui'
import { removeToken } from '~/utils'
import { authClient } from '~/utils/authjs/auth'

import { useStoreRef } from '../../hooks/use-store-ref'
import { UserStore } from '../../stores/user'
import { buildMenuModel, buildMenus } from '../../utils/build-menus'
import { Avatar } from '../avatar'
import { useSidebarStatusInjection } from './hooks'
import styles from './index.module.css'

export const Sidebar = defineComponent({
  name: 'SideBar',
  props: {
    collapse: {
      type: Boolean,
      required: true,
    },
    onCollapseChange: {
      type: Function as PropType<{ (status: boolean): void }>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()
    const { user } = useStoreRef(UserStore)
    const route = computed(() => router.currentRoute.value)
    const menus = ref<MenuModel[]>([])
    const app = useStoreRef(AppStore)
    onMounted(() => {
      // @ts-expect-error
      menus.value = buildMenus(router.getRoutes())
    })

    watch(
      () => app.app.value?.version,
      () => {
        const version = app.app.value?.version
        if (!version) return

        if (version === 'dev' || window.injectData.PAGE_PROXY) {
          const route = router
            .getRoutes()
            .find((item) => item.path === '/debug') as any

          menus.value.unshift(buildMenuModel(route, false, ''))
        }
      },
    )

    const indexRef = ref(0)

    function updateIndex(nextIndex: number) {
      if (nextIndex === indexRef.value) {
        indexRef.value = -1
        return
      }
      indexRef.value = nextIndex
    }

    function handleRoute(item: MenuModel, nextIndex?: number) {
      if (item.subItems?.length) {
        return
      }

      if (route.value.path === item.fullPath) {
        return
      }

      router.push({
        path: item.fullPath,
        query: item.query,
      })
      if (typeof nextIndex === 'number') {
        updateIndex(nextIndex)
      }
    }

    const sidebarRef = ref<HTMLDivElement>()
    const uiStore = useStoreRef(UIStore)
    onClickOutside(sidebarRef, () => {
      const v = uiStore.viewport
      const isM = v.value.pad || v.value.mobile
      if (isM) {
        props.onCollapseChange(true)
      }
    })
    const { isDark, themeMode, setThemeMode } = useStoreRef(UIStore)

    const userDropdownOptions = computed<DropdownOption[]>(() => [
      {
        key: 'header',
        type: 'render',
        render: () =>
          h('div', { class: 'flex items-center gap-3 px-3 py-2.5' }, [
            h(Avatar, {
              src: user.value?.avatar,
              size: 36,
              class: 'rounded-full flex-shrink-0',
            }),
            h('div', { class: 'flex flex-col min-w-0' }, [
              h(
                'span',
                {
                  class:
                    'text-sm font-medium text-[var(--sidebar-text-active)] truncate',
                },
                user.value?.name,
              ),
              user.value?.mail &&
                h(
                  'span',
                  {
                    class: 'text-xs text-[var(--sidebar-text)] truncate',
                  },
                  user.value.mail,
                ),
            ]),
          ]),
      },
      { type: 'divider', key: 'd1' },
      {
        label: '前往主站',
        key: 'visit-site',
        icon: () => h(ExternalLink, { size: 14 }),
      },
      {
        label: '登出',
        key: 'logout',
        icon: () => h(LogOut, { size: 14 }),
      },
    ])

    const handleUserDropdownSelect = async (key: string) => {
      if (key === 'visit-site') {
        window.open(WEB_URL)
      } else if (key === 'logout') {
        await userApi.logout()
        removeToken()
        await authClient.signOut()
        router.push({ name: RouteName.Login })
      }
    }

    const themeDropdownOptions = computed<DropdownOption[]>(() => [
      {
        label: 'Light',
        key: 'light',
        icon: () => h(Sun, { size: 14 }),
      },
      {
        label: 'Dark',
        key: 'dark',
        icon: () => h(Moon, { size: 14 }),
      },
      {
        label: 'System',
        key: 'system',
        icon: () => h(Monitor, { size: 14 }),
      },
    ])

    const handleThemeSelect = (key: string) => {
      setThemeMode(key as ThemeMode)
    }

    const { onTransitionEnd, statusRef } = useSidebarStatusInjection(
      () => props.collapse,
    )

    return () => {
      return (
        <div
          class={[
            styles.root,
            props.collapse ? styles.collapse : null,
            styles[statusRef.value],
          ]}
          onTransitionend={onTransitionEnd}
          ref={sidebarRef}
        >
          <div class={styles.sidebar}>
            <div class={styles.header}>
              <NDropdown
                options={userDropdownOptions.value}
                onSelect={handleUserDropdownSelect}
                placement="bottom-start"
                trigger="click"
              >
                <button
                  class={styles['user-avatar-btn']}
                  title={user.value?.name || 'User'}
                >
                  <Avatar
                    src={user.value?.avatar}
                    size={32}
                    class="rounded-full"
                  />
                </button>
              </NDropdown>

              <div class={styles['header-actions']}>
                <button
                  class={styles['header-btn']}
                  onClick={() => props.onCollapseChange(!props.collapse)}
                  title={props.collapse ? '展开' : '收起'}
                >
                  <PanelLeftClose
                    size={16}
                    class={[
                      'transition-transform duration-200',
                      props.collapse && 'rotate-180',
                    ]}
                  />
                </button>
              </div>
            </div>

            <NLayoutContent
              class={[styles.menu, '!bg-transparent']}
              nativeScrollbar={false}
            >
              <nav class={styles.items}>
                {menus.value.map((item, index) => {
                  const isActive =
                    route.value.fullPath === item.fullPath ||
                    route.value.fullPath.startsWith(item.fullPath)

                  return (
                    <div
                      key={item.fullPath}
                      class={[styles.item, isActive && styles.active]}
                      data-path={item.fullPath}
                    >
                      <MenuItem
                        title={item.title}
                        onClick={() =>
                          item.subItems?.length
                            ? updateIndex(index)
                            : handleRoute(item, index)
                        }
                        collapse={props.collapse}
                      >
                        {{
                          icon: () => item.icon,
                        }}
                      </MenuItem>

                      {item.subItems && item.subItems.length > 0 && (
                        <div
                          class={[
                            styles['has-child'],
                            indexRef.value === index && styles.expand,
                          ]}
                          style={{
                            maxHeight:
                              indexRef.value === index
                                ? `${item.subItems.length * 2.75}rem`
                                : '0',
                          }}
                        >
                          {item.subItems.map((child) => {
                            const isChildActive =
                              route.value.fullPath === child.fullPath ||
                              route.value.fullPath.startsWith(child.fullPath)

                            return (
                              <div
                                key={child.path}
                                class={[
                                  styles.item,
                                  isChildActive && styles.active,
                                ]}
                              >
                                <MenuItem
                                  collapse={props.collapse}
                                  title={child.title}
                                  onClick={() => handleRoute(child)}
                                >
                                  {{
                                    icon: () => child.icon,
                                  }}
                                </MenuItem>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </NLayoutContent>

            <div class={styles['sidebar-footer']}>
              <NDropdown
                options={themeDropdownOptions.value}
                onSelect={handleThemeSelect}
                placement="top-end"
                trigger="click"
                value={themeMode.value}
              >
                <button class={styles['theme-toggle-btn']} title="切换主题">
                  {themeMode.value === 'system' ? (
                    <Monitor size={16} />
                  ) : isDark.value ? (
                    <Moon size={16} />
                  ) : (
                    <Sun size={16} />
                  )}
                </button>
              </NDropdown>
            </div>
          </div>
        </div>
      )
    }
  },
})

const MenuItem = defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
    onClick: {
      type: Function as PropType<() => any>,
      required: true,
    },
    collapse: {
      type: Boolean,
      required: true,
    },
  },

  setup(props, { slots }) {
    return () => (
      <button onClick={props.onClick}>
        <span class="flex items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">
          {slots.icon!()}
        </span>
        <span class={styles['item-title']}>{props.title}</span>
      </button>
    )
  },
})
