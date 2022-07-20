import { useDialog } from 'naive-ui'
import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 *
 * @param enable
 * @param comparedFn true: 不提示, false: 提示
 */
export const useSaveConfirm = (
  enable: boolean,
  comparedFn: () => boolean,
  message = '文章未保存是否确定离开？',
): void => {
  const beforeUnloadHandler = (event) => {
    if (comparedFn()) {
      return
    }
    event.preventDefault()

    // Chrome requires returnValue to be set.
    event.returnValue = message
    return false
  }

  onMounted(() => {
    if (enable) {
      window.addEventListener('beforeunload', beforeUnloadHandler)
    }
  })
  onBeforeUnmount(() => {
    if (enable) {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
  })

  const dialog = useDialog()

  onBeforeRouteLeave(async (to, _, next) => {
    if (!enable) {
      next()
      return
    }
    if (comparedFn()) {
      next()
      return
    }

    // HACK
    if (to.hash == '|publish') {
      next()
      return
    }

    const confirm = new Promise<boolean>((r, j) => {
      dialog.warning({
        title: message,
        negativeText: '嗯',
        positiveText: '手抖了啦',
        onNegativeClick() {
          r(true)
        },
        onPositiveClick() {
          r(false)
        },
      })
    })

    const res = await Promise.resolve(confirm)

    if (res) {
      next()
    }
  })
}
