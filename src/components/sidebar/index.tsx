import { LogOut, Moon, PanelLeftClose, Sun } from 'lucide-vue-next'
import { NLayoutContent } from 'naive-ui'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { PropType } from 'vue'
import type { MenuModel } from '../../utils/build-menus'

import { onClickOutside } from '@vueuse/core'

import { WEB_URL } from '~/constants/env'
import { RouteName } from '~/router/name'
import { AppStore } from '~/stores/app'
import { UIStore } from '~/stores/ui'
import { removeToken, RESTManager } from '~/utils'
import { authClient } from '~/utils/authjs/auth'

import { configs } from '../../configs'
import { useStoreRef } from '../../hooks/use-store-ref'
import { UserStore } from '../../stores/user'
import { buildMenuModel, buildMenus } from '../../utils/build-menus'
import { Avatar } from '../avatar'
import { useSidebarStatusInjection } from './hooks'
import styles from './index.module.css'
import uwu from './uwu.png'

export const Sidebar = defineComponent({
  name: 'SideBar',
  props: {
    collapse: {
      type: Boolean,
      required: true,
    },
    width: {
      type: Number,
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

      router.push({
        path: item.fullPath,
        query: item.query,
      })
      if (typeof nextIndex === 'number') {
        updateIndex(nextIndex)
      }
    }

    const title = configs.title
    const sidebarRef = ref<HTMLDivElement>()
    const uiStore = useStoreRef(UIStore)
    onClickOutside(sidebarRef, () => {
      const v = uiStore.viewport
      const isM = v.value.pad || v.value.mobile
      if (isM) {
        props.onCollapseChange(true)
      }
    })
    const { isDark, toggleDark } = useStoreRef(UIStore)

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
            {/* Header */}
            <div class={styles.header}>
              {/* Logo */}
              <div class={styles.logo}>
                {!props.collapse && <img src={uwu} alt={title} />}
              </div>

              {/* Header Actions */}
              <div class={styles['header-actions']}>
                <button
                  class={styles['header-btn']}
                  onClick={() => void toggleDark()}
                  title={isDark.value ? '切换亮色' : '切换暗色'}
                >
                  {isDark.value ? <Moon size={16} /> : <Sun size={16} />}
                </button>
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

            {/* Menu */}
            <NLayoutContent class={styles.menu} nativeScrollbar={false}>
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
                                ? `${item.subItems.length * 2.5}rem`
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

            {/* Footer */}
            <button
              class={styles['sidebar-footer']}
              onClick={() => window.open(WEB_URL)}
              title="访问网站"
            >
              <LogoutAvatarButton />
              <span class={styles['sidebar-username']}>{user.value?.name}</span>
            </button>
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

const LogoutAvatarButton = defineComponent({
  setup() {
    const { user } = useStoreRef(UserStore)
    const router = useRouter()

    const handleLogout = async (e: MouseEvent) => {
      e.stopPropagation()
      await RESTManager.api.user.logout.post({})
      removeToken()
      await authClient.signOut()
      router.push({
        name: RouteName.Login,
      })
    }

    return () => {
      const avatar = user.value?.avatar

      return (
        <div
          class="group relative h-8 w-8 flex-shrink-0"
          onClick={handleLogout}
          role="button"
          title="退出登录"
        >
          <Avatar src={avatar} size={32} class="rounded-full" />
          <div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <LogOut size={14} color="#fff" />
          </div>
        </div>
      )
    }
  },
})
