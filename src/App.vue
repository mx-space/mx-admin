<!--
 * @Author: Innei
 * @Date: 2021-03-21 21:23:31
 * @LastEditTime: 2021-03-22 11:50:39
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/App.vue
 * Mark: Coding with Love
-->

<template>
  <SidebarLayout>
    <router-view></router-view>
  </SidebarLayout>
</template>

<script lang="ts">
import { defineComponent, onMounted } from '@vue/runtime-core'
import sidebarVue from './layouts/sidebar/index.vue'
import { UIStore } from './stores/ui'
import { useProviders } from './utils/deps-injection'
// import { Sidebar } from './components/sidebar'
export default defineComponent({
  name: 'home',
  components: {
    SidebarLayout: sidebarVue,
    // Sidebar,
  },
  setup() {
    useProviders(UIStore)
  },
})
</script>
