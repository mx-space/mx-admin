import { Check, ChevronRight, Loader2, X } from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import type {
  ToolCallGroupItem,
  ToolCallItemStatus,
} from '@haklex/rich-agent-core'
import type { PropType } from 'vue'

import { ToolCall } from './ToolCall'

function deriveGroupStatus(items: ToolCallGroupItem[]): ToolCallItemStatus {
  if (items.some((i) => i.status === 'error')) return 'error'
  if (items.some((i) => i.status === 'running')) return 'running'
  if (items.every((i) => i.status === 'completed')) return 'completed'
  if (items.some((i) => i.status === 'completed' || i.status === 'running'))
    return 'running'
  return 'pending'
}

function GroupStatusIcon({ status }: { status: ToolCallItemStatus }) {
  return (
    <span class="flex h-4 w-4 flex-shrink-0 items-center justify-center">
      {status === 'pending' && (
        <span class="h-1.5 w-1.5 rounded-full bg-neutral-300 opacity-40" />
      )}
      {status === 'running' && <Loader2 size={14} class="animate-spin" />}
      {status === 'completed' && <Check size={14} />}
      {status === 'error' && <X size={14} class="text-red-600" />}
    </span>
  )
}

export const ToolCallGroup = defineComponent({
  name: 'ToolCallGroup',
  props: {
    id: { type: String, required: true },
    items: { type: Array as PropType<ToolCallGroupItem[]>, required: true },
    defaultExpanded: { type: Boolean, default: true },
  },
  setup(props) {
    const expanded = ref(props.defaultExpanded)
    const groupStatus = computed(() => deriveGroupStatus(props.items))
    const completedCount = computed(
      () => props.items.filter((i) => i.status === 'completed').length,
    )

    return () => {
      if (props.items.length === 1) {
        return <ToolCall item={props.items[0]} />
      }

      const title =
        groupStatus.value === 'completed'
          ? `Executed ${props.items.length} tasks`
          : 'Executing parallel tasks'

      return (
        <div>
          <button
            class="font-inherit flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-1 text-left text-[13px] leading-snug text-neutral-400 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
            type="button"
            onClick={() => {
              expanded.value = !expanded.value
            }}
          >
            <GroupStatusIcon status={groupStatus.value} />
            <span
              class="flex-shrink-0 font-mono text-[13px]"
              style={
                groupStatus.value === 'running'
                  ? { color: 'var(--n-text-color)' }
                  : undefined
              }
            >
              {title}
            </span>
            <span class="font-mono text-xs text-neutral-400 opacity-50">
              {completedCount.value}/{props.items.length}
            </span>
            <span class="flex-1" />
            <ChevronRight
              size={12}
              class={[
                'flex-shrink-0 text-neutral-400 opacity-40 transition-transform',
                expanded.value && 'rotate-90',
              ]}
            />
          </button>

          {expanded.value && (
            <div class="pl-4 pt-0.5">
              {props.items.map((item) => (
                <ToolCall item={item} key={item.id} />
              ))}
            </div>
          )}
        </div>
      )
    }
  },
})
