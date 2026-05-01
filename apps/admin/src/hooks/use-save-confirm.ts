import { useDialog } from 'naive-ui'
import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 *
 * @param enable
 * @param comparedFn true: 不提示，false: 提示
 */
export const useSaveConfirm = (
  enable: boolean,
  comparedFn: () => boolean,
  message = '文章未保存是否确定离开？',
): void => {
  if (!enable) {
    return
  }

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

    const shouldLeave = await new Promise<boolean>((resolve) => {
      dialog.warning({
        title: message,
        negativeText: '取消',
        positiveText: '确认',
        onNegativeClick() {
          resolve(false) // 取消离开
        },
        onPositiveClick() {
          resolve(true) // 确认离开
        },
      })
    })

    if (shouldLeave) {
      next()
    } else {
      next(false)
    }
  })
}
