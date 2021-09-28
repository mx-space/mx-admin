export const useMountAndUnmount = (callback: () => any) => {
  let res

  onMounted(() => {
    res = callback()
  })

  onUnmounted(() => {
    if (res && typeof res === 'function') {
      res()
    }
  })
}
