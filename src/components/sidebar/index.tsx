import Hamburger from '@iconify-icons/radix-icons/hamburger-menu'
import { Icon } from '@iconify/vue'
import { defineComponent, onMounted, ref, PropType } from 'vue'
import { useRouter } from 'vue-router'
import { configs } from '../../configs'
import { buildMenus, MenuModel } from '../../utils/build-menus'
import styles from './index.module.css'
export const Sidebar = defineComponent({
  name: 'sidebar-comp',
  setup() {
    const router = useRouter()

    const menu = ref<MenuModel[]>([])
    onMounted(() => {
      const routers = router.getRoutes()

      menu.value = buildMenus(routers)
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
      } else {
        console.log(item.fullPath)

        router.push({
          path: item.fullPath,
          query: item.query,
        })
        if (index) {
          updateIndex(index)
        }
      }
    }

    const title = configs.title

    return () => (
      <div class={styles['wrapper']}>
        <div
          class={
            'fixed left-0 top-0 bottom-0 bg-gray-300 overflow-auto ' +
            styles['sidebar']
          }
        >
          <div class="title relative font-medium text-center text-2xl">
            <h1 class="py-4">{title}</h1>
            <button class="absolute right-0 mr-4 top-0 bottom-0 text-lg">
              <Icon icon={Hamburger} />
            </button>
          </div>

          <div class={styles['items']}>
            {menu.value.map((item, index) => {
              return (
                <div class="py-2 px-4">
                  <button
                    key={item.title}
                    class="py-2 flex items-center justify-center"
                    onClick={
                      item.subItems?.length
                        ? () => updateIndex(index)
                        : () => handleRoute(item, index)
                    }
                  >
                    {item.icon && <span class="mr-4"> {item.icon}</span>}
                    <span>{item.title}</span>
                  </button>
                  {item.subItems && (
                    <ul
                      class={
                        'overflow-hidden pl-6 ' +
                        (!!item.subItems.length ? styles['has-child'] : '')
                      }
                      style={{
                        maxHeight:
                          _index.value === index
                            ? item.subItems.length * 2.5 + 'rem'
                            : '0',
                      }}
                    >
                      {item.subItems.map((child) => {
                        return (
                          <li key={child.path} class="py-2">
                            <button onClick={() => handleRoute(child)}>
                              {child.title}
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
        </div>
      </div>
    )
  },
})
