import { ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next'
import { NScrollbar } from 'naive-ui'
import { defineComponent } from 'vue'
import type { PropType, VNode } from 'vue'

import { useMasterDetailLayout } from '~/components/layout'

/**
 * 设置详情面板容器
 */
export const SettingsDetailPanel = defineComponent({
  name: 'SettingsDetailPanel',
  props: {
    title: String,
    onBack: Function as PropType<() => void>,
  },
  setup(props, { slots }) {
    const { isMobile } = useMasterDetailLayout()

    return () => (
      <div class="flex h-full flex-col">
        {/* Header */}
        <div class="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {isMobile.value && props.onBack && (
              <button
                onClick={props.onBack}
                class="-ml-2 flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeftIcon class="size-5" />
              </button>
            )}
            <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {props.title}
            </h2>
          </div>
          {slots.actions && (
            <div class="flex items-center gap-2">{slots.actions()}</div>
          )}
        </div>

        {/* Content */}
        <NScrollbar class="min-h-0 flex-1">
          <div class="mx-auto max-w-3xl p-6">{slots.default?.()}</div>
        </NScrollbar>
      </div>
    )
  },
})

/**
 * 设置 Section 分组标题
 */
export const SettingsSection = defineComponent({
  name: 'SettingsSection',
  props: {
    title: String,
    description: String,
    icon: Object as PropType<any>,
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-6 last:mb-0">
        {/* Section Header */}
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            {props.icon && (
              <div class="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                <props.icon class="size-4" />
              </div>
            )}
            <div>
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {props.title || slots.title?.()}
              </h3>
              {(props.description || slots.description) && (
                <p class="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {props.description || slots.description?.()}
                </p>
              )}
            </div>
          </div>
          {slots.actions && <div class="shrink-0">{slots.actions()}</div>}
        </div>

        {/* Section Content */}
        <div class="divide-y divide-neutral-100 border-y border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
          {slots.default?.()}
        </div>
      </div>
    )
  },
})

/**
 * 设置项行（分栏布局）
 */
export const SettingsRow = defineComponent({
  name: 'SettingsRow',
  props: {
    title: String,
    description: [String, Object] as PropType<string | VNode>,
    layout: {
      type: String as PropType<'row' | 'col'>,
      default: 'row',
    },
  },
  setup(props, { slots }) {
    return () => (
      <div
        class={[
          'flex gap-4 px-4 py-4',
          props.layout === 'row'
            ? 'flex-col md:flex-row md:items-start md:gap-8'
            : 'flex-col',
        ]}
      >
        <div
          class={[
            'flex min-w-0 flex-col',
            props.layout === 'row' ? 'md:w-1/3 md:max-w-xs md:shrink-0' : '',
          ]}
        >
          <label class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.title || slots.title?.()}
          </label>
          {(props.description || slots.description) && (
            <div class="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {props.description || slots.description?.()}
            </div>
          )}
        </div>

        <div class="min-w-0 flex-1">{slots.default?.()}</div>
      </div>
    )
  },
})

// Legacy exports for compatibility
export const SettingsCard = SettingsSection
export const SettingsItem = SettingsRow
