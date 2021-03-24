import { defineComponent } from '@vue/runtime-core'
import { RouterView } from 'vue-router'

const $RouterView = defineComponent({
  setup() {
    return () => <RouterView />
  },
})
export default $RouterView
