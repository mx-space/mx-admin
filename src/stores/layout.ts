import { shallowReactive, shallowRef } from 'vue'
import type { VNode } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // Header 右侧操作按钮
  const headerActions = shallowRef<VNode | null>(null)
  // Footer 操作按钮（如编辑页的设置按钮）
  const footerActions = shallowRef<VNode | null>(null)
  // 自定义页面标题（覆盖 route.meta.title）
  const pageTitle = ref<string | null>(null)
  // 是否隐藏 header
  const hideHeader = ref(false)
  // 自定义 header class
  const headerClass = ref<string | null>(null)
  // 浮动按钮列表
  const floatButtons = shallowReactive<Map<symbol, VNode>>(new Map())

  // 添加浮动按钮，返回用于删除的 key
  const addFloatButton = (button: VNode): symbol => {
    const key = Symbol('floatButton')
    floatButtons.set(key, button)
    return key
  }

  // 移除浮动按钮
  const removeFloatButton = (key: symbol) => {
    floatButtons.delete(key)
  }

  // 路由变化时重置所有状态
  const reset = () => {
    headerActions.value = null
    footerActions.value = null
    pageTitle.value = null
    hideHeader.value = false
    headerClass.value = null
    floatButtons.clear()
  }

  return {
    headerActions,
    footerActions,
    pageTitle,
    hideHeader,
    headerClass,
    floatButtons,
    addFloatButton,
    removeFloatButton,
    reset,
  }
})

export { useLayoutStore as LayoutStore }
