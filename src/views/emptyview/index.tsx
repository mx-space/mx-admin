import { defineAsyncComponent, defineComponent } from '@vue/runtime-core'

export const PlaceHolderView = defineComponent({
  setup() {
    return () => <span></span>
  },
})
