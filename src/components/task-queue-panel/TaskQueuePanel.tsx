import { ChevronDown, ChevronUp, X } from 'lucide-vue-next'
import {
  defineComponent,
  ref,
  Teleport,
  Transition,
  TransitionGroup,
} from 'vue'
import type { VNode } from 'vue'

export interface TaskQueuePanelProps {
  visible: boolean
  isProcessing: boolean
  onClose: () => void
}

export interface TaskQueuePanelSlots<T> {
  icon: () => VNode
  title: () => VNode
  item: (props: { task: T }) => VNode
  footer?: () => VNode
}

export const TaskQueuePanel = defineComponent({
  name: 'TaskQueuePanel',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    isProcessing: {
      type: Boolean,
      required: true,
    },
    tasks: {
      type: Array as () => Array<{ id: string }>,
      required: true,
    },
    closeTitle: {
      type: String,
      default: '关闭',
    },
    showCloseWhenProcessing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  setup(props, { emit, slots }) {
    const collapsed = ref(false)

    const handleClose = () => {
      emit('close')
    }

    const toggleCollapse = () => {
      collapsed.value = !collapsed.value
    }

    const onBeforeEnter = (el: Element) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.height = '0'
      htmlEl.style.opacity = '0'
    }

    const onEnter = (el: Element, done: () => void) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.transition = 'height 0.2s ease-out, opacity 0.2s ease-out'
      htmlEl.style.height = `${htmlEl.scrollHeight}px`
      htmlEl.style.opacity = '1'
      htmlEl.addEventListener('transitionend', done, { once: true })
    }

    const onAfterEnter = (el: Element) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.height = ''
      htmlEl.style.transition = ''
    }

    const onBeforeLeave = (el: Element) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.height = `${htmlEl.scrollHeight}px`
      htmlEl.style.opacity = '1'
    }

    const onLeave = (el: Element, done: () => void) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.transition = 'height 0.15s ease-in, opacity 0.15s ease-in'
      requestAnimationFrame(() => {
        htmlEl.style.height = '0'
        htmlEl.style.opacity = '0'
      })
      htmlEl.addEventListener('transitionend', done, { once: true })
    }

    const onAfterLeave = (el: Element) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.height = ''
      htmlEl.style.transition = ''
    }

    return () => (
      <Teleport to="body">
        <Transition
          enterActiveClass="transition-all duration-300 ease-out"
          enterFromClass="opacity-0 translate-y-4"
          enterToClass="opacity-100 translate-y-0"
          leaveActiveClass="transition-all duration-200 ease-in"
          leaveFromClass="opacity-100 translate-y-0"
          leaveToClass="opacity-0 translate-y-4"
        >
          {props.visible && props.tasks.length > 0 && (
            <div class="fixed bottom-4 right-4 z-50 w-[500px]">
              <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                {/* Header */}
                <div
                  class="flex cursor-pointer select-none items-center justify-between px-4 py-3"
                  onClick={toggleCollapse}
                >
                  <div class="flex items-center gap-2.5">
                    <div class="flex size-6 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800">
                      {slots.icon?.()}
                    </div>
                    <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {slots.title?.()}
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      class="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        toggleCollapse()
                      }}
                      title={collapsed.value ? '展开' : '折叠'}
                    >
                      {collapsed.value ? (
                        <ChevronUp class="size-4" />
                      ) : (
                        <ChevronDown class="size-4" />
                      )}
                    </button>
                    {(props.showCloseWhenProcessing || !props.isProcessing) && (
                      <button
                        class="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation()
                          handleClose()
                        }}
                        title={props.closeTitle}
                      >
                        <X class="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <Transition
                  onBeforeEnter={onBeforeEnter}
                  onEnter={onEnter}
                  onAfterEnter={onAfterEnter}
                  onBeforeLeave={onBeforeLeave}
                  onLeave={onLeave}
                  onAfterLeave={onAfterLeave}
                  css={false}
                >
                  {!collapsed.value && (
                    <div class="overflow-hidden border-t border-neutral-100 dark:border-neutral-800">
                      <div class="h-[600px] overflow-y-auto px-4 py-2">
                        <TransitionGroup
                          moveClass="transition-all duration-200"
                          enterActiveClass="transition-all duration-200"
                          enterFromClass="opacity-0 -translate-x-2"
                          enterToClass="opacity-100 translate-x-0"
                        >
                          {props.tasks.map((task) => (
                            <div key={task.id}>{slots.item?.({ task })}</div>
                          ))}
                        </TransitionGroup>
                      </div>
                      {slots.footer?.()}
                    </div>
                  )}
                </Transition>
              </div>
            </div>
          )}
        </Transition>
      </Teleport>
    )
  },
})
