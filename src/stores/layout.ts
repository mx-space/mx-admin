import { shallowReactive, shallowRef } from 'vue'
import type { VNode } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const headerActions = shallowRef<VNode | null>(null)
  const footerActions = shallowRef<VNode | null>(null)
  const pageTitle = ref<string | null>(null)
  const hideHeader = ref(false)
  const headerClass = ref<string | null>(null)
  const headerSubtitle = shallowRef<VNode | null>(null)
  const contentPadding = ref(true)
  const floatButtons = shallowReactive<Map<symbol, VNode>>(new Map())

  const addFloatButton = (button: VNode): symbol => {
    const key = Symbol('floatButton')
    floatButtons.set(key, button)
    return key
  }

  const removeFloatButton = (key: symbol) => {
    floatButtons.delete(key)
  }

  const reset = () => {
    headerActions.value = null
    footerActions.value = null
    pageTitle.value = null
    hideHeader.value = false
    headerClass.value = null
    headerSubtitle.value = null
    contentPadding.value = true
    floatButtons.clear()
  }

  return {
    headerActions,
    footerActions,
    pageTitle,
    hideHeader,
    headerClass,
    headerSubtitle,
    contentPadding,
    floatButtons,
    addFloatButton,
    removeFloatButton,
    reset,
  }
})

export { useLayoutStore as LayoutStore }
