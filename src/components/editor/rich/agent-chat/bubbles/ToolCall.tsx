import { Check, ChevronRight, Loader2, X } from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import type { ToolCallGroupItem } from '@haklex/rich-agent-core'
import type { PropType } from 'vue'

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

function formatDuration(item: ToolCallGroupItem): string | null {
  if (!item.startedAt || !item.finishedAt) return null
  return `${item.finishedAt - item.startedAt}ms`
}

export const ToolCall = defineComponent({
  name: 'ToolCall',
  props: {
    item: { type: Object as PropType<ToolCallGroupItem>, required: true },
    defaultExpanded: { type: Boolean, default: false },
  },
  setup(props) {
    const expanded = ref(props.defaultExpanded)

    return () => {
      const item = props.item
      const hasContent =
        Object.keys(item.params).length > 0 || item.result || item.error
      const duration = formatDuration(item)

      return (
        <div>
          <button
            class={[
              'font-inherit flex w-full items-center gap-2 border-none bg-transparent py-1 text-left text-[13px] leading-snug text-neutral-400 transition-colors',
              hasContent
                ? 'cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200'
                : 'cursor-default',
            ]}
            type="button"
            onClick={() => hasContent && (expanded.value = !expanded.value)}
          >
            <StatusIcon status={item.status} />
            <span
              class="flex-shrink-0 font-mono text-[13px]"
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
            <span class="min-w-0 flex-1" />
            {duration && (
              <span class="flex-shrink-0 font-mono text-xs text-neutral-300 opacity-50">
                {duration}
              </span>
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
            <div class="flex flex-col gap-2 pb-2 pl-6">
              {Object.keys(item.params).length > 0 && (
                <pre class="m-0 overflow-x-auto whitespace-pre-wrap break-all rounded bg-neutral-50 p-1.5 font-mono text-[11px] dark:bg-neutral-900">
                  {JSON.stringify(item.params, null, 2)}
                </pre>
              )}
              {item.result && (
                <pre class="m-0 overflow-x-auto whitespace-pre-wrap break-all rounded bg-neutral-50 p-1.5 font-mono text-[11px] text-neutral-500 dark:bg-neutral-900">
                  {item.result}
                </pre>
              )}
              {item.error && (
                <pre class="m-0 overflow-x-auto whitespace-pre-wrap break-all rounded bg-red-50 p-1.5 font-mono text-[11px] text-red-600 dark:bg-red-950/20">
                  {item.error}
                </pre>
              )}
            </div>
          )}
        </div>
      )
    }
  },
})
