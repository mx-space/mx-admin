import { defineAsyncComponent, defineComponent } from '@vue/runtime-core'
import { useRouter } from 'vue-router'

export const PlaceHolderView = defineComponent({
  setup() {
    const router = useRouter()
    return () => <span>{router.currentRoute.value.fullPath}</span>
  },
})

export default PlaceHolderView
