<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({})
</script>

<template>
  <div class="wrapper">
    <div class="sidebar fixed left-0 top-0 bottom-0 bg-gray-500"></div>
    <div class="ml-20 relative content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
@import './index.css';
</style>
