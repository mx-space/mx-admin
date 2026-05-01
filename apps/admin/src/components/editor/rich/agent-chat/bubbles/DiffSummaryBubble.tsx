import { defineComponent } from 'vue'

export const DiffSummaryBubble = defineComponent({
  name: 'DiffSummaryBubble',
  props: {
    accepted: { type: Number, required: true },
    rejected: { type: Number, required: true },
    pending: { type: Number, required: true },
  },
  setup(props) {
    return () => (
      <div class="max-w-[86%] self-start rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800/50">
        Diff: {props.accepted} accepted, {props.rejected} rejected,{' '}
        {props.pending} pending
      </div>
    )
  },
})
