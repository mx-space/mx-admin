import { NPopover } from 'naive-ui'
import { parseDate, relativeTimeFromNow } from 'utils/time'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'

const _RelativeTime = defineComponent({
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

export const RelativeTime = defineComponent({
  props: {
    time: {
      type: [String, Date],
      required: true,
    },
    showPopoverInfoAbsoluteTime: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    return () =>
      props.showPopoverInfoAbsoluteTime ? (
        <NPopover trigger="hover">
          {{
            trigger() {
              return (
                <span>
                  <_RelativeTime time={props.time} />
                </span>
              )
            },
            default() {
              return parseDate(props.time, 'yyyy年M月d日 HH:mm:ss')
            },
          }}
        </NPopover>
      ) : (
        <_RelativeTime time={props.time} />
      )
  },
})
