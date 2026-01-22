import { defineComponent, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'

import { bgUrl } from '~/constants/env'

import styles from './setup-view.module.css'

export const SetupView = defineComponent({
  name: 'SetupView',
  setup() {
    const loaded = ref(false)

    onMounted(() => {
      const img = new Image()
      img.src = bgUrl
      img.addEventListener('load', () => {
        loaded.value = true
      })
    })

    return () => (
      <div class="relative min-h-screen isolate">
        <div
          class={styles.bg}
          style={{
            backgroundImage: `url(${bgUrl})`,
            opacity: loaded.value ? 1 : 0.4,
          }}
        />
        {/* Dark overlay for contrast */}
        <div class="fixed inset-0 -z-10 bg-black/40" />
        <RouterView />
      </div>
    )
  },
})

// eslint-disable-next-line import/no-default-export
export default SetupView
