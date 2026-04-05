import {
  Check,
  ChevronRight,
  Copy,
  Loader2,
  RotateCw,
  X,
} from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'
import type { ToolCallGroupItem } from '@haklex/rich-agent-core'
import type { PropType } from 'vue'
import type { ReplayStateMap } from '../composables/use-agent-reapply'

import { itemReplayKey } from '../composables/use-agent-reapply'

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('已复制')
  } catch {
    toast.error('复制失败')
  }
}

function serializeItem(item: ToolCallGroupItem): string {
  return JSON.stringify(
    {
      id: item.id,
      toolName: item.toolName,
      description: item.description,
      status: item.status,
      params: item.params,
      result: item.result,
      error: item.error,
      startedAt: item.startedAt,
      finishedAt: item.finishedAt,
    },
    null,
    2,
  )
}

function StatusIcon({ status }: { status: ToolCallGroupItem['status'] }) {
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

function Section({
  label,
  text,
  tone,
}: {
  label: string
  text: string
  tone?: 'error'
}) {
  const isError = tone === 'error'
  return (
    <div class="group/section relative min-w-0 max-w-full">
      <div class="mb-0.5 flex min-w-0 items-center justify-between gap-2">
        <span class="font-mono text-[10px] uppercase tracking-wide text-neutral-400">
          {label}
        </span>
        <span
          role="button"
          tabindex={0}
          title={`复制 ${label}`}
          class="flex h-5 cursor-pointer items-center gap-1 rounded px-1 text-[10px] text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 group-hover/section:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          onClick={(e: MouseEvent) => {
            e.stopPropagation()
            copyText(text)
          }}
        >
          <Copy size={10} />
          Copy
        </span>
      </div>
      <pre
        class={[
          'm-0 max-h-64 max-w-full overflow-auto whitespace-pre-wrap break-all rounded p-1.5 font-mono text-[11px]',
          isError
            ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
            : 'bg-neutral-50 text-neutral-500 dark:bg-neutral-900',
        ]}
      >
        {text}
      </pre>
    </div>
  )
}

function formatDuration(item: ToolCallGroupItem): string | null {
  if (!item.startedAt || !item.finishedAt) return null
  return `${item.finishedAt - item.startedAt}ms`
}

export const ToolCall = defineComponent({
  name: 'ToolCall',
  props: {
    item: { type: Object as PropType<ToolCallGroupItem>, required: true },
    defaultExpanded: { type: Boolean, default: false },
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
    isReplayable: { type: Boolean, default: false },
  },
  emits: ['reapply'],
  setup(props, { emit }) {
    const expanded = ref(props.defaultExpanded)

    return () => {
      const item = props.item
      const hasContent =
        Object.keys(item.params).length > 0 || item.result || item.error
      const duration = formatDuration(item)
      const rKey = itemReplayKey(item.id)
      const rState = props.replayState?.[rKey]
      const isReplayRunning = rState?.status === 'running'

      return (
        <div class="group/toolcall min-w-0 max-w-full">
          <button
            class={[
              'font-inherit flex w-full min-w-0 max-w-full items-center gap-2 border-none bg-transparent py-1 text-left text-[13px] leading-snug text-neutral-400 transition-colors',
              hasContent
                ? 'cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200'
                : 'cursor-default',
            ]}
            type="button"
            onClick={() => hasContent && (expanded.value = !expanded.value)}
          >
            <StatusIcon status={item.status} />
            <span class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <span
                class="truncate font-mono text-[13px]"
                style={
                  item.status === 'running'
                    ? { color: 'var(--n-text-color)' }
                    : undefined
                }
              >
                {item.toolName}
              </span>
              {item.description && (
                <span class="min-w-0 flex-1 truncate text-[13px] text-neutral-300">
                  {item.description}
                </span>
              )}
            </span>
            {duration && (
              <span class="flex-shrink-0 font-mono text-xs text-neutral-300 opacity-50">
                {duration}
              </span>
            )}
            <span
              role="button"
              tabindex={0}
              title="复制此 tool call JSON"
              class="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded opacity-0 transition-opacity hover:bg-neutral-100 hover:opacity-100 group-hover/toolcall:opacity-60 dark:hover:bg-neutral-800"
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                copyText(serializeItem(item))
              }}
            >
              <Copy size={12} />
            </span>
            {props.isReplayable && (
              <>
                {rState?.status === 'success' && (
                  <span class="flex-shrink-0 text-xs text-green-600">
                    Re-applied
                  </span>
                )}
                {rState?.status === 'conflict' && (
                  <span
                    class="flex-shrink-0 text-xs text-amber-600"
                    title={rState.message}
                  >
                    Conflict
                  </span>
                )}
                {rState?.status === 'error' && (
                  <span
                    class="flex-shrink-0 text-xs text-red-600"
                    title={rState.message}
                  >
                    Failed
                  </span>
                )}
                {(!rState || rState.status === 'idle') && (
                  <span
                    role="button"
                    tabindex={0}
                    title="Re-apply this tool call"
                    class="flex h-5 flex-shrink-0 cursor-pointer items-center gap-1 rounded px-1 text-xs text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 hover:!opacity-100 group-hover/toolcall:opacity-60 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      emit('reapply')
                    }}
                  >
                    <RotateCw size={11} />
                    Re-apply
                  </span>
                )}
                {isReplayRunning && (
                  <span class="flex flex-shrink-0 items-center gap-1 text-xs text-neutral-400">
                    <Loader2 size={11} class="animate-spin" />
                  </span>
                )}
              </>
            )}
            {hasContent && (
              <ChevronRight
                size={12}
                class={[
                  'flex-shrink-0 text-neutral-400 opacity-40 transition-transform',
                  expanded.value && 'rotate-90',
                ]}
              />
            )}
          </button>

          {hasContent && expanded.value && (
            <div class="flex min-w-0 max-w-full flex-col gap-2 pb-2 pl-6">
              {Object.keys(item.params).length > 0 && (
                <Section
                  label="params"
                  text={JSON.stringify(item.params, null, 2)}
                />
              )}
              {item.result && <Section label="result" text={item.result} />}
              {item.error && (
                <Section label="error" text={item.error} tone="error" />
              )}
              {rState &&
                (rState.status === 'conflict' || rState.status === 'error') &&
                rState.message && (
                  <Section
                    label="replay"
                    text={rState.message}
                    tone={rState.status === 'error' ? 'error' : undefined}
                  />
                )}
            </div>
          )}
        </div>
      )
    }
  },
})
