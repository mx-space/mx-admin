import {
  Check,
  ChevronRight,
  Copy,
  Loader2,
  RotateCw,
  X,
} from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'
import type {
  ToolCallGroupItem,
  ToolCallItemStatus,
} from '@haklex/rich-agent-core'
import type { PropType } from 'vue'
import type { ReplayStateMap } from '../composables/use-agent-reapply'

import { groupReplayKey } from '../composables/use-agent-reapply'
import { ToolCall } from './ToolCall'

function deriveGroupStatus(items: ToolCallGroupItem[]): ToolCallItemStatus {
  if (items.some((i) => i.status === 'error')) return 'error'
  if (items.some((i) => i.status === 'running')) return 'running'
  if (items.every((i) => i.status === 'completed')) return 'completed'
  if (items.some((i) => i.status === 'completed' || i.status === 'running'))
    return 'running'
  return 'pending'
}

function formatGroupSummary(summary: {
  succeeded: number
  conflicted: number
  failed: number
  total: number
}): string {
  const parts: string[] = [`${summary.succeeded}/${summary.total} reapplied`]
  if (summary.conflicted > 0) parts.push(`${summary.conflicted} conflicted`)
  if (summary.failed > 0) parts.push(`${summary.failed} failed`)
  return parts.join(', ')
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
    defaultExpanded: { type: Boolean, default: false },
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
    isReplayableItem: {
      type: Function as PropType<(item: ToolCallGroupItem) => boolean>,
      default: undefined,
    },
  },
  emits: ['reapplyItem', 'reapplyGroup'],
  setup(props, { emit }) {
    const expanded = ref(props.defaultExpanded)
    const groupStatus = computed(() => deriveGroupStatus(props.items))
    const completedCount = computed(
      () => props.items.filter((i) => i.status === 'completed').length,
    )
    const hasReplayable = computed(
      () => props.isReplayableItem && props.items.some(props.isReplayableItem),
    )
    const groupRKey = computed(() => groupReplayKey(props.id))
    const groupRState = computed(() => props.replayState?.[groupRKey.value])

    return () => {
      if (props.items.length === 1) {
        const item = props.items[0]
        return (
          <ToolCall
            item={item}
            replayState={props.replayState}
            isReplayable={!!props.isReplayableItem?.(item)}
            onReapply={() => emit('reapplyItem', item.id, item)}
          />
        )
      }

      const title =
        groupStatus.value === 'completed'
          ? `Executed ${props.items.length} tasks`
          : 'Executing parallel tasks'

      return (
        <div class="min-w-0 max-w-full">
          <button
            class="font-inherit group flex w-full min-w-0 max-w-full cursor-pointer items-center gap-2 border-none bg-transparent py-1 text-left text-[13px] leading-snug text-neutral-400 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
            type="button"
            onClick={() => {
              expanded.value = !expanded.value
            }}
          >
            <GroupStatusIcon status={groupStatus.value} />
            <span class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <span
                class="truncate font-mono text-[13px]"
                style={
                  groupStatus.value === 'running'
                    ? { color: 'var(--n-text-color)' }
                    : undefined
                }
              >
                {title}
              </span>
              <span class="flex-shrink-0 font-mono text-xs text-neutral-400 opacity-50">
                {completedCount.value}/{props.items.length}
              </span>
            </span>
            <span
              role="button"
              tabindex={0}
              title="复制全组 JSON"
              class="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded opacity-40 transition-opacity hover:bg-neutral-100 hover:opacity-100 dark:hover:bg-neutral-800"
              onClick={async (e: MouseEvent) => {
                e.stopPropagation()
                try {
                  await navigator.clipboard.writeText(
                    JSON.stringify(
                      { id: props.id, items: props.items },
                      null,
                      2,
                    ),
                  )
                  toast.success('已复制')
                } catch {
                  toast.error('复制失败')
                }
              }}
            >
              <Copy size={12} />
            </span>
            {hasReplayable.value && (
              <>
                {groupRState.value?.summary && (
                  <span class="flex-shrink-0 text-xs text-neutral-400">
                    {formatGroupSummary(groupRState.value.summary)}
                  </span>
                )}
                {groupRState.value?.status === 'running' && (
                  <span class="flex flex-shrink-0 items-center">
                    <Loader2 size={12} class="animate-spin text-neutral-400" />
                  </span>
                )}
                {(!groupRState.value ||
                  groupRState.value.status === 'idle') && (
                  <span
                    role="button"
                    tabindex={0}
                    title="Re-apply all tool calls"
                    class="flex h-5 flex-shrink-0 cursor-pointer items-center gap-1 rounded px-1 text-xs text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 hover:!opacity-100 group-hover:opacity-60 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      emit('reapplyGroup', props.id, props.items)
                    }}
                  >
                    <RotateCw size={11} />
                    Re-apply all
                  </span>
                )}
              </>
            )}
            <ChevronRight
              size={12}
              class={[
                'flex-shrink-0 text-neutral-400 opacity-40 transition-transform',
                expanded.value && 'rotate-90',
              ]}
            />
          </button>

          {expanded.value && (
            <div class="min-w-0 max-w-full pl-4 pt-0.5">
              {props.items.map((item) => (
                <ToolCall
                  item={item}
                  key={item.id}
                  replayState={props.replayState}
                  isReplayable={!!props.isReplayableItem?.(item)}
                  onReapply={() => emit('reapplyItem', item.id, item)}
                />
              ))}
            </div>
          )}
        </div>
      )
    }
  },
})
