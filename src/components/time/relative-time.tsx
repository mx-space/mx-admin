import { relativeTimeFromNow } from 'utils/time'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'

export const RelativeTime = defineComponent({
  props: {
    time: {
      type: [String, Date],
      required: true,
    },
  },
  setup(props) {
    const time = ref(relativeTimeFromNow(props.time))
    let timer: ReturnType<typeof setInterval> | undefined | void
    onMounted(() => {
      timer = setInterval(() => {
        time.value = relativeTimeFromNow(props.time)
      }, 1000)
    })

    onUnmounted(() => {
      timer && (timer = clearInterval(timer))
    })

    return () => time.value
  },
})
