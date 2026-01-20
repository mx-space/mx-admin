import { NSkeleton } from 'naive-ui'
import { defineComponent } from 'vue'
import type { PropType, VNode } from 'vue'

import { Icon } from '@vicons/utils'

export const ChartCard = defineComponent({
  props: {
    title: { type: String, required: true },
    icon: { type: Object as PropType<VNode> },
    loading: { type: Boolean, default: false },
    height: { type: Number, default: 250 },
  },
  setup(props, { slots }) {
    return () => (
      <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div class="flex items-center justify-between px-4 py-3">
          <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {props.title}
          </h4>
          {props.icon && (
            <Icon class="text-sm text-neutral-400">{props.icon}</Icon>
          )}
        </div>
        {props.loading ? (
          <div class="px-4 pb-3">
            <NSkeleton height={`${props.height}px`} />
          </div>
        ) : (
          <div style={{ height: `${props.height}px` }}>{slots.default?.()}</div>
        )}
      </div>
    )
  },
})
