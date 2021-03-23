<template>
  <div class="avatar" :style="{ height: `${size}px`, width: `${size}px` }">
    <img
      :src="src"
      alt="####avatar"
      :style="{ display: loaded ? '' : 'none' }"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/runtime-core'

export default defineComponent({
  props: {
    size: {
      type: Number,
      default: 50,
    },
    src: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const loaded = ref(false)

    onMounted(() => {
      const $$ = new Image()
      $$.src = props.src

      $$.onload = (e) => {
        loaded.value = true
      }
    })

    return {
      loaded,
    }
  },
})
</script>

<style>
.avatar {
  display: inline-block;
  background-color: #dddddd;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  user-select: none;
}
.avatar img {
  border-radius: 50%;
  height: 100%;
  max-width: 100%;
  animation: scale 0.5s ease-out;
}
@keyframes scale {
  0% {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}
</style>
