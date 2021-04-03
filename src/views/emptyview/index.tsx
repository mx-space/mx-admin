import {
  defineAsyncComponent,
  defineComponent,
  onMounted,
  ref,
} from '@vue/runtime-core'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import T from './test.vue'

const Children = defineComponent({
  setup() {
    return () => <p>Children</p>
  },
})

const Parent = defineComponent({
  setup({}, { slots, emit }) {
    console.log(slots)
    onMounted(() => {
      emit('mount', 1)
    })
    return () => (
      <div class="">
        <p>Parent</p>
        <p>{slots.header?.()}</p>
        {slots.default?.()}
      </div>
    )
  },
})
export const PlaceHolderView = defineComponent({
  setup({}, ctx) {
    const router = useRouter()
    console.log(ctx)

    const $$a = ref(0)
    return () => (
      <span>
        {router.currentRoute.value.fullPath}

        <Parent
          onMount={(val) => {
            console.log('mount', val)
          }}
        >
          <Children></Children>
        </Parent>
      </span>
    )
  },
})

export default PlaceHolderView
