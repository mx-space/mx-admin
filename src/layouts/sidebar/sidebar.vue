<script lang='ts'>
import Hamburger from '@iconify-icons/radix-icons/hamburger-menu'
import { Icon } from '@iconify/vue'
import { defineComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { configs } from '../../configs'
import { buildMenus, MenuModel } from '../../utils/build-menus'

export default defineComponent({
  components: { Icon },
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

    function handleRoute(item: MenuModel, index: number) {

      if (item.subItems?.length) {

      } else {
        router.push({
          path: item.fullPath,
          query: item.query,
        })

        updateIndex(index)
      }

    }

    return {
      menu,
      _index,
      handleRoute: handleRoute,
      updateIndex,
    }
  },


  computed: {
    title() {
      return configs.title
    },
    icon() {
      return {
        ham: Hamburger,
      }
    },
  },
})
</script>

<template>
  <div class='wrapper'>
    <div class='sidebar fixed left-0 top-0 bottom-0 bg-gray-300 overflow-auto'>

      <div class='title relative font-medium text-center text-2xl'>
        <h1 class='py-4'>{{ title }}</h1>
        <button class='absolute right-0 mr-4 top-0 bottom-0 text-lg'>
          <Icon :icon='icon.ham' />
        </button>
      </div>

      <div class='items'>
        <div class='parent' v-for='(item, index) in menu' :key='item.title'>
          <button class='py-2 px-4' @click='item.subItems?.length ? updateIndex(index): handleRoute(item, index)'>

            <span>{{ item.title }}</span>

          </button>

          <ul
            :style="{ maxHeight: _index === index ? item.subItems.length * 2.5  + 'rem' : '0' }"
            :class='{"has-child": !!item.subItems.length }'
            class='overflow-hidden pl-6'
            v-if='item.subItems'
          >
            <li class='py-2'
                v-for='child in item.subItems'
                :key='child.title'
            >
              <button @click='handleRoute(child)'>
                {{ child.title }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class='ml-20 relative content'>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
@import './index.css';
</style>
