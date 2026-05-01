/**
 * Split Resize Trigger
 * NSplit 的 resize-trigger 插槽通用组件，用于左右分栏拖拽手柄
 */
import { defineComponent } from 'vue'

export const SplitResizeTrigger = defineComponent({
  name: 'SplitResizeTrigger',
  props: {
    /** 内层手柄的额外 class，如 z-[10] 用于浮于内容之上 */
    triggerClass: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    return () => (
      <div class="group relative h-full w-0 cursor-col-resize">
        <div
          class={[
            'absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300 transition-colors group-hover:bg-neutral-400 dark:bg-neutral-700 dark:group-hover:bg-neutral-600',
            props.triggerClass,
          ]}
        />
      </div>
    )
  },
})
