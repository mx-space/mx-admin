<script lang="ts">
import { defineComponent } from 'vue'
import { Sidebar } from '../../components/sidebar'
export default defineComponent({
  name: 'sidebar-layout',
  components: { Sidebar },
  setup() {},
})
</script>

<template>
  <div class="wrapper">
    <Sidebar></Sidebar>
    <div class="ml-20 relative content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
@import './index.css';
</style>
