import type { VNode } from 'vue'

import { LayoutStore } from '~/stores/layout'

import { useStoreRef } from './use-store-ref'

/**
 * 用于页面组件设置 ContentLayout 的状态
 *
 * @example
 * ```tsx
 * const { setActions, setTitle } = useLayout()
 *
 * // 设置静态 actions
 * setActions(<HeaderActionButton icon={<Plus />} onClick={handleAdd} />)
 *
 * // 设置响应式 actions（使用 watchEffect）
 * watchEffect(() => {
 *   setActions(<Button disabled={!hasSelection.value}>删除</Button>)
 * })
 *
 * // 设置自定义标题
 * setTitle(id.value ? '编辑文章' : '新建文章')
 *
 * // 隐藏 header
 * setHideHeader(true)
 * ```
 */
export const useLayout = () => {
  const layout = useStoreRef(LayoutStore)

  return {
    /** 设置 header 右侧操作按钮 */
    setActions: (el: VNode | null) => {
      layout.headerActions.value = el
    },

    /** 设置自定义页面标题（覆盖 route.meta.title） */
    setTitle: (title: string | null) => {
      layout.pageTitle.value = title
    },

    /** 设置是否隐藏 header */
    setHideHeader: (hide: boolean) => {
      layout.hideHeader.value = hide
    },

    /** 设置 footer 操作按钮（如编辑页的设置按钮） */
    setFooterActions: (el: VNode | null) => {
      layout.footerActions.value = el
    },

    /** 设置自定义 header class */
    setHeaderClass: (cls: string | null) => {
      layout.headerClass.value = cls
    },

    /** 设置 header 副标题/元信息（如 slug 编辑器） */
    setHeaderSubtitle: (el: VNode | null) => {
      layout.headerSubtitle.value = el
    },

    /** 设置内容区域是否有 padding（沉浸式编辑时设为 false） */
    setContentPadding: (hasPadding: boolean) => {
      layout.contentPadding.value = hasPadding
    },

    /** 设置内容区域是否强制 min-h-full（需要撑满高度时设为 true） */
    setContentMinFullHeight: (isFull: boolean) => {
      layout.contentMinFullHeight.value = isFull
    },

    /** 添加浮动按钮，返回用于删除的 key */
    addFloatButton: (button: VNode): symbol => {
      return layout.addFloatButton(button)
    },

    /** 移除浮动按钮 */
    removeFloatButton: (key: symbol) => {
      layout.removeFloatButton(key)
    },
  }
}
