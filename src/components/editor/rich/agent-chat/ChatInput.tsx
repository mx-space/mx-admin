import { ArrowUp, Square } from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import type { AgentStoreStatus } from '@haklex/rich-agent-core'
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
    status: { type: String as PropType<AgentStoreStatus>, default: 'idle' },
  },
  emits: ['send', 'abort'],
  setup(props, { emit, slots }) {
    const input = ref('')
    const textareaRef = ref<HTMLTextAreaElement>()

    function handleSend() {
      const trimmed = input.value.trim()
      if (!trimmed) return
      emit('send', trimmed)
      input.value = ''
      if (textareaRef.value) textareaRef.value.style.height = 'auto'
    }

    function handleKeyDown(e: KeyboardEvent) {
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
        <div class="px-4.5 flex flex-shrink-0 flex-col pb-3.5 pt-2.5">
          {props.isRunning && statusLabel && (
            <div class="mb-2 ml-1 flex items-center gap-1.5 text-xs text-neutral-400">
              <span class="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span>{statusLabel}</span>
            </div>
          )}
          <div class="relative rounded-2xl border border-neutral-200 bg-white shadow-sm transition-colors focus-within:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-neutral-500">
            <textarea
              ref={textareaRef}
              class="w-full resize-none border-none bg-transparent px-4 pb-12 pt-3.5 text-[13px] leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-200"
              disabled={props.disabled}
              placeholder="Message..."
              rows={1}
              value={input.value}
              onInput={handleInput}
              onKeydown={handleKeyDown}
            />
            <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
              <div>{slots.modelSelector?.()}</div>
              <button
                aria-label={isAbortMode ? 'Stop' : 'Send'}
                class={
                  isAbortMode
                    ? 'inline-flex h-[30px] w-[30px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-red-600 bg-transparent text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20'
                    : 'inline-flex h-[30px] w-[30px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-neutral-800 text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-neutral-200 dark:text-neutral-900 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500'
                }
                disabled={
                  isAbortMode ? false : props.disabled || !input.value.trim()
                }
                type="button"
                onClick={isAbortMode ? () => emit('abort') : handleSend}
              >
                {isAbortMode ? (
                  <Square fill="currentColor" size={14} strokeWidth={0} />
                ) : (
                  <ArrowUp size={16} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      )
    }
  },
})
