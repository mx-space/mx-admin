import { ChevronRight, Sparkles } from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'

export const ThinkingChain = defineComponent({
  name: 'ThinkingChain',
  props: {
    id: { type: String, required: true },
    isStreaming: { type: Boolean, required: true },
    rawText: { type: String, required: true },
    steps: { type: Array as PropType<string[]>, required: true },
    defaultExpanded: { type: Boolean, default: false },
  },
  setup(props) {
    const expanded = ref(props.defaultExpanded || props.isStreaming)

    return () => (
      <div>
        <button
          class="font-inherit flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-1 text-left text-[13px] leading-snug text-neutral-400 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
          type="button"
          onClick={() => {
            expanded.value = !expanded.value
          }}
        >
          <span class="flex h-4 w-4 flex-shrink-0 items-center justify-center">
            <Sparkles
              size={14}
              style={
                props.isStreaming
                  ? 'animation: pulse 1.5s ease-in-out infinite'
                  : 'opacity: 0.5'
              }
            />
          </span>
          <span
            style={
              props.isStreaming ? { color: 'var(--n-text-color)' } : undefined
            }
          >
            Thinking
          </span>

          {props.isStreaming ? (
            <span class="flex items-center gap-0.5">
              <span class="h-1 w-1 animate-pulse rounded-full bg-neutral-400" />
              <span
                class="h-1 w-1 animate-pulse rounded-full bg-neutral-400"
                style="animation-delay: 0.2s"
              />
              <span
                class="h-1 w-1 animate-pulse rounded-full bg-neutral-400"
                style="animation-delay: 0.4s"
              />
            </span>
          ) : (
            props.steps.length > 0 && (
              <span class="font-mono text-xs text-neutral-400 opacity-50">
                {props.steps.length} steps
              </span>
            )
          )}

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
          <div class="flex flex-col gap-1.5 pb-2 pl-6 pt-1 text-[13px] leading-relaxed text-neutral-400">
            {props.steps.map((step, i) => (
              <p key={i} class="m-0">
                {step}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  },
})
