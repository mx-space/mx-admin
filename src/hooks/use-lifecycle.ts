import { onBeforeUnmount, onMounted } from 'vue'

export const useMountAndUnmount = (callback: () => any) => {
  onMounted(() => {
    const res = callback()
    onBeforeUnmount(() => {
      if (res && typeof res === 'function') {
        res()
      }
    })
  })
}
