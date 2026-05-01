import { defineComponent } from 'vue'

export const ErrorBubble = defineComponent({
  name: 'ErrorBubble',
  props: {
    message: { type: String, required: true },
  },
  emits: ['retry'],
  setup(props, { emit }) {
    return () => (
      <div class="my-2 flex items-baseline gap-2 text-[13px] leading-relaxed text-red-600">
        <span>{props.message}</span>
        <button
          class="font-inherit cursor-pointer border-none bg-transparent p-0 text-xs text-red-600 underline hover:opacity-80"
          type="button"
          onClick={() => emit('retry')}
        >
          Retry
        </button>
      </div>
    )
  },
})
