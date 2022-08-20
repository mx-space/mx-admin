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
