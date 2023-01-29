import {
  LogoutIcon,
  MoonIcon,
  SidebarCloseIcon,
  SunIcon,
} from 'components/icons'
import { WEB_URL } from 'constants/env'
import { NIcon, NLayoutContent } from 'naive-ui'
import { RouteName } from 'router/name'
import { AppStore } from 'stores/app'
import { UIStore, useUIStore } from 'stores/ui'
import { RESTManager } from 'utils'
import type { PropType } from 'vue'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Icon } from '@vicons/utils'
import { onClickOutside } from '@vueuse/core'

import { configs } from '../../configs'
import { useStoreRef } from '../../hooks/use-store-ref'
import { UserStore } from '../../stores/user'
import type { MenuModel } from '../../utils/build-menus'
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

    watchEffect(() => {
      const version = app.app.value?.version
      if (version === 'dev') {
        const route = router
          .getRoutes()
          .find((item) => item.path === '/debug') as any

        menus.value.unshift(buildMenuModel(route, false, ''))
      }
    })

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
      const isPhone = uiStore.viewport.value.mobile
      return (
        <div
          class={[
            styles['root'],
            props.collapse ? styles['collapse'] : null,

            styles[statusRef.value],
          ]}
          style={{
            width: !props.collapse && props.width ? `${props.width}px` : '',
          }}
          onTransitionend={onTransitionEnd}
          ref={sidebarRef}
        >
          <div class={styles['sidebar']}>
            <div
              class={
                'flex-shrink-0 relative font-medium text-center text-2xl h-20'
              }
            >
              <button
                class={styles['toggle-color-btn']}
                onClick={() => void toggleDark()}
              >
                {!isDark.value ? <SunIcon /> : <MoonIcon />}
              </button>
              <h1 class={styles['header-title']}>{title}</h1>
              <button
                class={styles['collapse-button']}
                onClick={() => {
                  props.onCollapseChange(!props.collapse)
                }}
              >
                <SidebarCloseIcon />
              </button>
            </div>

            <NLayoutContent class={styles['menu']} nativeScrollbar={false}>
              <div class={styles['items']}>
                {menus.value.map((item, index) => {
                  return (
                    <div
                      class={[
                        'py-2',
                        route.value.fullPath === item.fullPath ||
                        route.value.fullPath.startsWith(item.fullPath)
                          ? styles['active']
                          : '',

                        styles['item'],
                      ]}
                      data-path={item.fullPath}
                    >
                      <MenuItem
                        className={!isPhone ? 'py-2' : ''}
                        title={item.title}
                        onClick={() =>
                          item.subItems?.length
                            ? updateIndex(index)
                            : handleRoute(item, index)
                        }
                        collapse={props.collapse}
                      >
                        {{
                          icon() {
                            return item.icon
                          },
                        }}
                      </MenuItem>

                      {item.subItems && (
                        <ul
                          class={[
                            'overflow-hidden',
                            item.subItems.length ? styles['has-child'] : '',
                            indexRef.value === index ? styles['expand'] : '',
                          ]}
                          style={{
                            maxHeight:
                              indexRef.value === index
                                ? `${item.subItems.length * 3.5}rem`
                                : '0',
                          }}
                        >
                          {item.subItems.map((child) => {
                            return (
                              <li
                                key={child.path}
                                class={[
                                  route.value.fullPath === child.fullPath ||
                                  route.value.fullPath.startsWith(
                                    child.fullPath,
                                  )
                                    ? styles['active']
                                    : '',
                                  styles['item'],
                                ]}
                              >
                                <MenuItem
                                  collapse={props.collapse}
                                  title={child.title}
                                  onClick={() => handleRoute(child)}
                                  className={'py-4'}
                                >
                                  {{
                                    icon() {
                                      return child.icon
                                    },
                                  }}
                                </MenuItem>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </NLayoutContent>

            <button
              class={styles['sidebar-footer']}
              onClick={() => {
                window.open(WEB_URL)
              }}
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
    className: {
      type: String,
    },
  },

  setup(props, { slots }) {
    return () => (
      <button
        onClick={props.onClick}
        class={['flex w-full items-center py-4', props.className]}
      >
        <span
          class={[
            'flex justify-center items-center basis-12 transition-all duration-300 ease-in-out',
            props.collapse ? 'basis-[var(--w)]' : '',
          ]}
        >
          <Icon>{slots.icon!()}</Icon>
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
      router.push({
        name: RouteName.Login,
      })
    }

    return () => {
      const avatar = user.value?.avatar

      return (
        <div
          class={'relative h-[35px] w-[35px]'}
          onClick={handleLogout}
          role="button"
        >
          <Avatar src={avatar} size={35} class="absolute inset-0 z-1" />
          <div
            class={[
              'absolute z-2 inset-0 flex items-center justify-center bg-dark-200 bg-opacity-80 rounded-full hover:opacity-50 opacity-0 transition-opacity',
              'text-xl',
            ]}
          >
            <NIcon>
              <LogoutIcon />
            </NIcon>
          </div>
        </div>
      )
    }
  },
})
