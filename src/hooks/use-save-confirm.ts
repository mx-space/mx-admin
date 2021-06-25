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

  onBeforeRouteLeave((to) => {
    if (!enable) {
      return
    }
    if (comparedFn()) {
      return
    }

    // HACK
    if (to.hash == '|publish') {
      return
    }
    const res = confirm('文章未保存是否继续')
    if (!res) {
      return false
    }
  })
}
