/**
 * Split Panel Layout Component
 * 分栏面板布局 - 支持左右分栏、Resizable、移动端全屏切换
 */
import { computed, defineComponent } from 'vue'
import type { PropType, VNode } from 'vue'

import { useMasterDetailLayout } from './master-detail-layout'
import { SplitPanel } from './split-panel'

export interface SplitPanelLayoutProps {
  /** 是否显示右侧面板（移动端用于控制滑动） */
  showPanel?: boolean
  /** 默认分割比例 (0-1) */
  defaultSize?: number
  /** 最小分割比例 */
  min?: number
  /** 最大分割比例 */
  max?: number
}

export const SplitPanelLayout = defineComponent({
  name: 'SplitPanelLayout',
  props: {
    showPanel: {
      type: Boolean,
      default: false,
    },
    defaultSize: {
      type: [Number, String],
      default: 0.5,
    },
    min: {
      type: [Number, String],
      default: 0.3,
    },
    max: {
      type: [Number, String],
      default: 0.7,
    },
    /** 强制使用移动端布局 */
    forceMobile: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const { isMobile: layoutIsMobile } = useMasterDetailLayout()
    const isMobileView = computed(
      () => props.forceMobile || layoutIsMobile.value,
    )

    // 移动端布局：全屏切换
    const MobileLayout = () => (
      <div class="relative h-full overflow-hidden">
        {/* 列表 */}
        <div
          class={[
            'absolute inset-0 transition-transform duration-300 ease-out',
            props.showPanel && '-translate-x-full',
          ]}
        >
          {slots.list?.()}
        </div>

        {/* 详情面板 */}
        <div
          class={[
            'absolute inset-0 bg-white transition-transform duration-300 ease-out dark:bg-black',
            props.showPanel ? 'translate-x-0' : 'translate-x-full',
          ]}
        >
          {props.showPanel ? slots.panel?.() : slots.empty?.()}
        </div>
      </div>
    )

    // 桌面端布局：分栏 + Resizable
    const DesktopLayout = () => (
      <SplitPanel
        direction="horizontal"
        defaultSize={props.defaultSize}
        min={props.min}
        max={props.max}
        class="h-full"
      >
        <div class="h-full overflow-hidden border-r border-neutral-200 dark:border-neutral-800">
          {slots.list?.()}
        </div>
        <div class="h-full min-w-0 flex-1 overflow-hidden">
          {props.showPanel ? slots.panel?.() : slots.empty?.()}
        </div>
      </SplitPanel>
    )

    return () => (isMobileView.value ? <MobileLayout /> : <DesktopLayout />)
  },
})

/** 分栏面板空状态组件 */
export const SplitPanelEmptyState = defineComponent({
  name: 'SplitPanelEmptyState',
  props: {
    icon: {
      type: Function as PropType<() => VNode>,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-900">
        <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          {props.icon()}
        </div>
        <h3 class="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {props.title}
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          {props.description}
        </p>
      </div>
    )
  },
})
