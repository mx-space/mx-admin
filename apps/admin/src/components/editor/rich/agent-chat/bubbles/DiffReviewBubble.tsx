import { Copy, Loader2, RotateCw } from 'lucide-vue-next'
import { computed, defineComponent } from 'vue'
import { toast } from 'vue-sonner'
import type { ReviewBatch, ReviewBatchStatus } from '@haklex/rich-agent-core'
import type { PropType } from 'vue'
import type { ReplayStateMap } from '../composables/use-agent-reapply'

import { computeDiff } from '@haklex/rich-diff'

import { batchReplayKey } from '../composables/use-agent-reapply'

const STATUS_LABEL: Record<ReviewBatchStatus, string | undefined> = {
  pending: undefined,
  accepted: 'Accepted',
  rejected: 'Rejected',
  order_dependent: 'Order dependent',
  conflicted: 'Conflicted',
}

function extractText(node: any): string {
  if (node.text) return node.text
  if (node.children) return node.children.map(extractText).join('')
  return ''
}

export const DiffReviewBubble = defineComponent({
  name: 'DiffReviewBubble',
  props: {
    batch: { type: Object as PropType<ReviewBatch>, required: true },
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
  },
  emits: ['accept', 'reject', 'reapplyBatch'],
  setup(props, { emit }) {
    const hunks = computed(() =>
      computeDiff(props.batch.baseSnapshot, props.batch.previewSnapshot),
    )

    return () => {
      const batch = props.batch
      const isActionable =
        batch.status !== 'accepted' && batch.status !== 'rejected'
      const n = batch.entries.length
      const statusLabel =
        STATUS_LABEL[batch.status] ?? `${n} change${n > 1 ? 's' : ''}`
      const rKey = batchReplayKey(batch.id)
      const rState = props.replayState?.[rKey]

      return (
        <div class="my-2 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 text-[13px] dark:border-neutral-700">
          <div class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800/50">
            <div class="flex items-center gap-2">
              <span class="rounded-full border border-neutral-200 px-2 py-0.5 font-mono text-[11px] font-medium dark:border-neutral-700">
                {statusLabel}
              </span>
              <button
                type="button"
                title="复制 batch JSON (debug)"
                class="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-none bg-transparent text-neutral-400 opacity-60 transition-opacity hover:bg-neutral-100 hover:opacity-100 dark:hover:bg-neutral-800"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      JSON.stringify(batch, null, 2),
                    )
                    toast.success('已复制')
                  } catch {
                    toast.error('复制失败')
                  }
                }}
              >
                <Copy size={11} />
              </button>
            </div>
            <div class="flex items-center gap-1.5">
              {isActionable && (
                <>
                  <button
                    class="cursor-pointer rounded-md border border-neutral-800 bg-neutral-800 px-2.5 py-0.5 text-xs text-white transition-opacity hover:opacity-85 dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900"
                    type="button"
                    onClick={() => emit('accept', batch.id)}
                  >
                    Accept
                  </button>
                  <button
                    class="cursor-pointer rounded-md border border-red-600 bg-transparent px-2.5 py-0.5 text-xs text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                    type="button"
                    onClick={() => emit('reject', batch.id)}
                  >
                    Reject
                  </button>
                </>
              )}
              {rState?.status === 'running' && (
                <span class="flex items-center gap-1 text-xs text-neutral-400">
                  <Loader2 size={11} class="animate-spin" />
                  Re-applying...
                </span>
              )}
              {rState?.status === 'success' && (
                <span class="text-xs text-green-600">Re-applied</span>
              )}
              {rState?.status === 'conflict' && rState.summary && (
                <span class="text-xs text-amber-600">
                  {rState.summary.succeeded}/{rState.summary.total} reapplied,{' '}
                  {rState.summary.conflicted} conflicted
                </span>
              )}
              {rState?.status === 'error' && (
                <span class="text-xs text-red-600" title={rState.message}>
                  Failed
                  {rState.summary
                    ? ` (${rState.summary.succeeded}/${rState.summary.total})`
                    : ''}
                </span>
              )}
              {rState?.status !== 'running' && (
                <button
                  class="flex cursor-pointer items-center gap-1 rounded-md border border-neutral-200 bg-transparent px-2 py-0.5 text-xs text-neutral-400 transition-colors hover:text-neutral-700 dark:border-neutral-700 dark:hover:text-neutral-200"
                  type="button"
                  title="Re-apply this batch to current editor"
                  onClick={() => emit('reapplyBatch', batch.id)}
                >
                  <RotateCw size={10} />
                  Re-apply
                </button>
              )}
            </div>
          </div>
          {hunks.value.map((hunk, i) => {
            if (hunk.type === 'equal') return null
            const text = hunk.nodes.map(extractText).join('\n')
            if (!text.trim()) return null
            const isInsert = hunk.type === 'insert'
            return (
              <div
                key={i}
                class={[
                  'whitespace-pre-wrap break-all px-3 py-1 font-mono text-xs leading-relaxed',
                  isInsert
                    ? 'bg-green-600/8'
                    : 'bg-red-600/6 line-through opacity-70',
                ]}
              >
                {isInsert ? '+ ' : '- '}
                {text}
              </div>
            )
          })}
        </div>
      )
    }
  },
})
