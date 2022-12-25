import { NPopover } from 'naive-ui'
import { parseDate, relativeTimeFromNow } from 'utils/time'
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'

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
      if (!props.time) {
        return
      }
      timer = setInterval(() => {
        time.value = relativeTimeFromNow(props.time)
      }, 1000)
    })

    onBeforeUnmount(() => {
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
              return props.time
                ? parseDate(props.time, 'yyyy 年 M 月 d 日 HH:mm:ss')
                : '此内容自发布以来没有被修改过'
            },
          }}
        </NPopover>
      ) : (
        <_RelativeTime time={props.time} />
      )
  },
})
