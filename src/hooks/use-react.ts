export const useMountAndUnmount = (callback: () => any) => {
  let res

  onMounted(() => {
    res = callback()
  })

  onBeforeUnmount(() => {
    if (res && typeof res === 'function') {
      res()
    }
  })
}
