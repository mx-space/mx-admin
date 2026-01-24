import { defineComponent } from 'vue'
import type { PropType } from 'vue'

/**
 * 设置页面的标准卡片容器
 */
export const SettingsCard = defineComponent({
  name: 'SettingsCard',
  props: {
    title: String,
    description: String,
    icon: Object as PropType<any>, // Icon component
    pure: Boolean, // 如果为 true，则不添加 padding，适合放表格
  },
  setup(props, { slots }) {
    return () => (
      <section class="group mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div class="flex flex-col gap-4 border-b border-neutral-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between dark:border-neutral-800">
          <div class="flex gap-4">
            {props.icon && (
              <div class="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 sm:flex dark:bg-neutral-800 dark:text-neutral-400">
                <props.icon class="size-5" />
              </div>
            )}
            <div class="flex min-w-0 flex-1 items-center">
              <h3 class="text-base font-semibold leading-6 text-neutral-900 dark:text-neutral-100">
                {props.title || slots.title?.()}
              </h3>
              {(props.description || slots.description) && (
                <p class="mt-1 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                  {props.description || slots.description?.()}
                </p>
              )}
            </div>
          </div>
          {slots.actions && <div class="shrink-0">{slots.actions()}</div>}
        </div>

        {/* Content */}
        <div class={props.pure ? '' : 'p-6'}>{slots.default?.()}</div>

        {/* Footer */}
        {slots.footer && (
          <div class="flex justify-end border-t border-neutral-100 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
            {slots.footer()}
          </div>
        )}
      </section>
    )
  },
})

/**
 * 设置页面的单行配置项（分栏布局）
 */
export const SettingsItem = defineComponent({
  name: 'SettingsItem',
  props: {
    title: String,
    description: String,
    layout: {
      type: String as PropType<'row' | 'col'>,
      default: 'row',
    },
  },
  setup(props, { slots }) {
    return () => (
      <div
        class={[
          'flex flex-col gap-y-4 border-b border-neutral-100 px-6 py-5 last:border-0 dark:border-neutral-800',
          props.layout === 'row'
            ? 'md:flex-row md:items-start md:gap-x-12'
            : '',
        ]}
      >
        <div
          class={[
            'flex min-w-0 flex-1 flex-col justify-start',
            props.layout === 'row' ? 'md:w-1/3 md:max-w-xs md:shrink-0' : '',
          ]}
        >
          <label class="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.title || slots.title?.()}
          </label>
          {(props.description || slots.description) && (
            <div class="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {props.description || slots.description?.()}
            </div>
          )}
        </div>

        <div class="relative min-w-0 flex-1">{slots.default?.()}</div>
      </div>
    )
  },
})
