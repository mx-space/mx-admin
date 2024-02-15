<script lang="ts">
import { bgUrl } from 'constants/env'

export default defineComponent({
  setup() {
    const loaded = ref(false)

    onMounted(() => {
      const $$ = new Image()
      $$.src = bgUrl
      $$.onload = (e) => {
        loaded.value = true
      }
    })

    return {
      bgUrl,
      loaded,
    }
  },
})
</script>

<template>
  <div>
    <div
      class="bg"
      :style="{ backgroundImage: `url(${bgUrl})`, opacity: loaded ? 1 : 0.4 }"
    />

    <router-view />
  </div>
</template>

<style scoped lang="postcss">
.bg {
  @apply fixed bottom-0 left-0 right-0 top-0;
  @apply -m-4 bg-gray-600 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-linear;

  filter: blur(5px);
}
</style>
