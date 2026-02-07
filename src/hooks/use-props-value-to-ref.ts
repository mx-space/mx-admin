import { ref, watch } from 'vue'

export const usePropsValueToRef = <T extends { value: string }>(props: T) => {
  const value = ref(props.value)
  watch(
    () => props.value,
    (n) => {
      value.value = n
    },
  )
  return value
}
