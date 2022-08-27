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
import { UIStore } from 'stores/ui'
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
import styles from './index.module.css'

export const Sidebar = defineComponent({
  name: 'SidebarComp',
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

    const _index = ref(0)

    function updateIndex(index: number) {
      if (index === _index.value) {
        _index.value = -1
        return
      }
      _index.value = index
    }

    function handleRoute(item: MenuModel, index?: number) {
      if (item.subItems?.length) {
        return
      }

      router.push({
        path: item.fullPath,
        query: item.query,
      })
      if (index) {
        updateIndex(index)
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

    return () => (
      <div
        class={[styles['root'], props.collapse ? styles['collapse'] : null]}
        style={{
          width: !props.collapse && props.width ? `${props.width}px` : '',
        }}
        ref={sidebarRef}
      >
        <div
          class={`fixed left-0 top-0 h-screen overflow-hidden z-10 text-white ${styles['sidebar']}`}
        >
          <div
            class={'flex-shrink-0 relative font-medium text-center text-2xl'}
          >
            <button
              class={styles['toggle-color-btn']}
              onClick={() => void toggleDark()}
            >
              {!isDark.value ? <SunIcon /> : <MoonIcon />}
            </button>
            <h1 class={['py-6', props.collapse ? 'hidden' : '']}>{title}</h1>
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
                    <button
                      key={item.title}
                      class={'py-2 flex w-full items-center'}
                      onClick={
                        item.subItems?.length
                          ? () => updateIndex(index)
                          : () => handleRoute(item, index)
                      }
                    >
                      <span
                        style={{ flexBasis: '3rem' }}
                        class="flex justify-center"
                      >
                        <Icon>{item.icon}</Icon>
                      </span>
                      <span class={styles['item-title']}>{item.title}</span>
                    </button>
                    {item.subItems && (
                      <ul
                        class={[
                          `overflow-hidden  ${
                            item.subItems.length ? styles['has-child'] : ''
                          }`,
                          _index.value === index ? styles['expand'] : '',
                        ]}
                        style={{
                          maxHeight:
                            _index.value === index
                              ? `${item.subItems.length * 3.5}rem`
                              : '0',
                        }}
                      >
                        {item.subItems.map((child) => {
                          return (
                            <li
                              key={child.path}
                              // data-fullPath={child.fullPath}
                              class={[
                                route.value.fullPath === child.fullPath ||
                                route.value.fullPath.startsWith(child.fullPath)
                                  ? styles['active']
                                  : '',
                                styles['item'],
                              ]}
                            >
                              <button
                                onClick={() => handleRoute(child)}
                                class={'flex w-full items-center py-4'}
                              >
                                <span
                                  class="flex justify-center items-center"
                                  style={{ flexBasis: '3rem' }}
                                >
                                  <Icon>{child.icon}</Icon>
                                </span>
                                <span class={styles['item-title']}>
                                  {child.title}
                                </span>
                              </button>
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
            class={[
              'bottom-bar flex space-x-2 items-center phone:hidden flex-shrink-0 py-8',
              props.collapse ? 'px-8' : 'px-12',
            ]}
            onClick={() => {
              window.open(WEB_URL)
            }}
          >
            <LogoutAvatarButton />
            {!props.collapse ? (
              <span class="pl-12">{user.value?.name}</span>
            ) : null}
          </button>
          <button
            class="hidden phone:flex w-full items-center justify-center absolute bottom-0 pb-4"
            onClick={() => {
              window.open(WEB_URL)
            }}
          >
            <LogoutAvatarButton />
          </button>
        </div>
      </div>
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
          class={'h-[40px] w-[40px] relative'}
          onClick={handleLogout}
          role="button"
        >
          <Avatar src={avatar} size={40} class="absolute inset-0 z-1" />
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
