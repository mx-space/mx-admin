import { defineComponent, onMounted, ref } from '@vue/runtime-core'
import { useRouter } from 'vue-router'

export const PlaceHolderView = defineComponent({
  setup(props, ctx) {
    const router = useRouter()
    console.log(ctx)

    const $$a = ref(0)
    return () => <span>{router.currentRoute.value.fullPath}</span>
  },
})

export default PlaceHolderView
