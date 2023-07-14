import type { ComputedGetter, InjectionKey } from 'vue'
import { ref } from 'vue'

type TSidebarCollapseStatus =
  | 'collapsed'
  | 'expanded'
  | 'collapsing'
  | 'expanding'
const useSidebarStatusImpl = (collapseValueRef: ComputedGetter<boolean>) => {
  let prevValue =
    typeof collapseValueRef === 'function'
      ? collapseValueRef()
      : collapseValueRef

  const statusRef = ref<TSidebarCollapseStatus>(
    prevValue ? 'collapsed' : 'expanded',
  )

  const collapseComputedRef = computed(collapseValueRef)
  watch(
    () => collapseComputedRef.value,
    () => {
      if (prevValue !== collapseComputedRef.value) {
        statusRef.value = collapseComputedRef.value ? 'collapsing' : 'expanding'
        prevValue = collapseComputedRef.value
      }
    },
  )

  const onTransitionEnd = () => {
    statusRef.value = collapseComputedRef.value ? 'collapsed' : 'expanded'
  }

  return {
    onTransitionEnd,
    statusRef,
  } as const
}

const injectionKey = Symbol() as InjectionKey<{
  status: TSidebarCollapseStatus
}>

export const useSidebarStatusInjection = (
  collapseValueRef: ComputedGetter<boolean>,
) => {
  const { onTransitionEnd, statusRef } = useSidebarStatusImpl(collapseValueRef)

  provide(injectionKey, {
    status: statusRef.value,
  })
  return {
    onTransitionEnd,
    statusRef,
  }
}
