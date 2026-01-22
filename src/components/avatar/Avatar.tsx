import { defineComponent, onMounted, ref, watch } from 'vue'

import styles from './avatar.module.css'

export const Avatar = defineComponent({
  name: 'Avatar',
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

    const preloadImage = () => {
      if (!props.src) {
        return
      }
      const img = new Image()
      img.src = props.src

      img.addEventListener('load', () => {
        loaded.value = true
      })
    }

    onMounted(() => {
      preloadImage()
    })

    watch(
      () => props.src,
      () => {
        preloadImage()
      },
    )

    return () => (
      <div
        class={styles.avatar}
        style={{ height: `${props.size}px`, width: `${props.size}px` }}
      >
        <img
          src={props.src}
          alt=""
          style={{ display: loaded.value ? '' : 'none' }}
        />
        <div class="sr-only">一个头像</div>
      </div>
    )
  },
})
