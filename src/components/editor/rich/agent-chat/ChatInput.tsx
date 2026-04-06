import { ArrowUp, Square, Type, X } from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import type {
  AgentStoreStatus,
  CapturedSelection,
} from '@haklex/rich-agent-core'
import type { PropType } from 'vue'

const STATUS_LABELS: Partial<Record<AgentStoreStatus, string>> = {
  thinking: 'Thinking...',
  writing: 'Writing...',
  running: 'Processing...',
  calling_tool: 'Calling tool...',
}

export const ChatInput = defineComponent({
  name: 'ChatInput',
  props: {
    disabled: { type: Boolean, default: false },
    isRunning: { type: Boolean, default: false },
    pinnedSelection: {
      type: Object as PropType<CapturedSelection | null>,
      default: null,
    },
    status: { type: String as PropType<AgentStoreStatus>, default: 'idle' },
  },
  emits: ['send', 'abort', 'dismissSelection'],
  setup(props, { emit, slots }) {
    const input = ref('')
    const textareaRef = ref<HTMLTextAreaElement>()
    const isComposing = ref(false)

    function handleSend() {
      const trimmed = input.value.trim()
      if (!trimmed) return
      emit('send', trimmed)
      input.value = ''
      if (textareaRef.value) textareaRef.value.style.height = 'auto'
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isComposing.value) return
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!props.disabled && !props.isRunning) handleSend()
      }
    }

    function handleInput(e: Event) {
      const ta = e.target as HTMLTextAreaElement
      input.value = ta.value
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
    }

    return () => {
      const isAbortMode = Boolean(props.isRunning)
      const statusLabel = props.status ? STATUS_LABELS[props.status] : undefined

      return (
        <div class="flex flex-shrink-0 flex-col">
          {props.pinnedSelection && (
            <div class="mx-3 mb-1.5 mt-1 flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              <Type
                class="flex-shrink-0 text-neutral-400 dark:text-neutral-500"
                size={12}
                strokeWidth={2}
              />
              <span class="min-w-0 flex-1 truncate">
                {props.pinnedSelection.type === 'text'
                  ? `"${props.pinnedSelection.text.length > 60 ? `${props.pinnedSelection.text.slice(0, 60)}…` : props.pinnedSelection.text}"`
                  : `${props.pinnedSelection.blockIds.length} block${props.pinnedSelection.blockIds.length > 1 ? 's' : ''} selected`}
              </span>
              <button
                aria-label="Dismiss selection"
                class="inline-flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                type="button"
                onClick={() => emit('dismissSelection')}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          )}
          {props.isRunning && statusLabel && (
            <div class="flex items-center gap-1.5 px-4 py-1.5 text-xs text-neutral-400">
              <span class="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span>{statusLabel}</span>
            </div>
          )}
          <div class="relative border-t border-neutral-200 dark:border-neutral-700/80">
            <textarea
              ref={textareaRef}
              class="w-full resize-none overflow-hidden border-none bg-transparent px-4 pb-10 pt-3 text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-200"
              disabled={props.disabled}
              placeholder="Message..."
              rows={1}
              value={input.value}
              onCompositionstart={() => (isComposing.value = true)}
              onCompositionend={() => (isComposing.value = false)}
              onInput={handleInput}
              onKeydown={handleKeyDown}
            />
            <div class="absolute bottom-1 left-1 right-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div>{slots.modelSelector?.()}</div>
                {!isAbortMode && (
                  <span class="text-xs text-neutral-400/60 dark:text-neutral-500/60">
                    Enter
                  </span>
                )}
              </div>
              <button
                aria-label={isAbortMode ? 'Stop' : 'Send'}
                class={
                  isAbortMode
                    ? 'inline-flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-600 bg-transparent text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20'
                    : 'inline-flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-blue-500/20 text-white shadow-[inset_0_0_0_1px_rgba(98,164,255,0.16)] transition-opacity hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:bg-neutral-200/80 disabled:text-neutral-400 disabled:shadow-none dark:disabled:bg-neutral-700/50 dark:disabled:text-neutral-500'
                }
                disabled={
                  isAbortMode ? false : props.disabled || !input.value.trim()
                }
                type="button"
                onClick={isAbortMode ? () => emit('abort') : handleSend}
              >
                {isAbortMode ? (
                  <Square fill="currentColor" size={13} strokeWidth={0} />
                ) : (
                  <ArrowUp size={15} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      )
    }
  },
})
