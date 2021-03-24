import { computed, defineComponent } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import styles from './index.module.css'

export const ContentLayout = defineComponent({
  setup({}, ctx) {
    const { slots } = ctx
    const router = useRouter()
    const route = computed(() => router.currentRoute)

    return () => (
      <>
        <header class={styles['header']}>
          <h1 class={styles['title']}>{route.value.value.meta.title}</h1>
        </header>
        <main class={styles['main']}>{slots.default?.()}</main>
      </>
    )
  },
})
