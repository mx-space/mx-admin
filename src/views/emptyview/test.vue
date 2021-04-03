<template>
  <div class="w-10 m-auto">

    <p>
      <p>{{ $$a ?? 0}}</p>
      <Button @click="$$a++">$$a++</Button>
    </p>
  
    <p>
      <p>{{ a }}</p>
      <Button @click="a++">a++</Button>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Button from 'primevue/button'
export default defineComponent({
  components: { Button },
  setup() {
    const $$a = ref(0)
    const $a = ref(0)
    const a = ref(0)
    return {
      $$a,
      a,
    }
  },
})
</script>
