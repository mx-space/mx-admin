import { useDialog } from 'naive-ui'
import { onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
/**
 *
 * @param enable
 * @param comparedFn true: 不提示, false: 提示
 */
export const useSaveConfirm = (
  enable: boolean,
  comparedFn: () => boolean,
): void => {
  const beforeUnloadHandler = (event) => {
    if (comparedFn()) {
      return
    }
    event.preventDefault()

    // Chrome requires returnValue to be set.
    event.returnValue = '文章未保存是否后退'
    return false
  }

  onMounted(() => {
    if (enable) {
      window.addEventListener('beforeunload', beforeUnloadHandler)
    }
  })
  onUnmounted(() => {
    if (enable) {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
  })

  const dialog = useDialog()

  onBeforeRouteLeave(async (to, _, next) => {
    if (!enable) {
      return
    }
    if (comparedFn()) {
      return
    }

    const confirm = new Promise<boolean>((r, j) => {
      dialog.warning({
        title: '文章未保存是否继续',
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

    // HACK
    if (to.hash == '|publish') {
      return
    }
    // const res = confirm('文章未保存是否继续')
    if (res) {
      next()
    }
  })
}

// export const useMemoTextValue = (
//   initialValue: Ref<string>,
//   getValueFn: () => string,
//   setValueFn: (v: string) => any,
// ): Ref<string> => {
//   const memoInitialValue = initialValue

//   watch(
//     () => initialValue.value,
//     (n) => {
//       if (!memoInitialValue.value && n) {
//         memoInitialValue.value = n
//       }
//       if (n !== getValueFn()) {
//         setValueFn(n)
//       }
//     },
//   )

//   return memoInitialValue
// }
