import { defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import type {
  ChatBubble,
  ReviewBatch,
  ToolCallGroupItem,
} from '@haklex/rich-agent-core'
import type { PropType } from 'vue'

import { DiffReviewBubble } from './bubbles/DiffReviewBubble'
import { DiffSummaryBubble } from './bubbles/DiffSummaryBubble'
import { ErrorBubble } from './bubbles/ErrorBubble'
import { StreamdownBubble } from './bubbles/StreamdownBubble'
import { ThinkingChain } from './bubbles/ThinkingChain'
import { ToolCallGroup } from './bubbles/ToolCallGroup'
import { UserBubble } from './bubbles/UserBubble'

interface ToolCallGroupView {
  id: string
  items: ToolCallGroupItem[]
  type: 'tool_call_group_view'
}

type MergedBubble = ChatBubble | ToolCallGroupView

function mergeBubbles(bubbles: ChatBubble[]): MergedBubble[] {
  const result: MergedBubble[] = []
  let legacyGroup: ToolCallGroupItem[] | null = null
  let legacyGroupStartIdx = 0

  function flushLegacy() {
    if (legacyGroup && legacyGroup.length > 0) {
      result.push({
        type: 'tool_call_group_view',
        id: `legacy-${legacyGroupStartIdx}`,
        items: legacyGroup,
      })
      legacyGroup = null
    }
  }

  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i]

    if (b.type === 'tool_call_group') {
      flushLegacy()
      result.push({ type: 'tool_call_group_view', id: b.id, items: b.items })
      continue
    }

    if (b.type === 'tool_call') {
      if (!legacyGroup) {
        legacyGroup = []
        legacyGroupStartIdx = i
      }
      const next = bubbles[i + 1]
      if (next?.type === 'tool_result' && next.toolName === b.toolName) {
        legacyGroup.push({
          id: `fallback-${i}`,
          toolName: b.toolName,
          params: b.params,
          status: next.success ? 'completed' : 'error',
          result: next.success ? next.summary : undefined,
          resultPreview: next.success ? next.summary.slice(0, 80) : undefined,
          error: !next.success ? next.summary : undefined,
        })
        i++
      } else {
        legacyGroup.push({
          id: `fallback-${i}`,
          toolName: b.toolName,
          params: b.params,
          status: 'running',
        })
      }
      continue
    }

    if (b.type === 'tool_result') {
      flushLegacy()
      continue
    }

    flushLegacy()
    result.push(b)
  }
  flushLegacy()
  return result
}

export const ChatMessageList = defineComponent({
  name: 'ChatMessageList',
  props: {
    bubbles: { type: Array as PropType<ChatBubble[]>, required: true },
    getBatch: {
      type: Function as PropType<(batchId: string) => ReviewBatch | undefined>,
      default: undefined,
    },
  },
  emits: ['acceptBatch', 'rejectBatch', 'retry'],
  setup(props, { emit }) {
    const scrollRef = ref<HTMLDivElement>()
    let userScrolledUp = false

    function scrollToBottom() {
      if (userScrolledUp) return
      nextTick(() => {
        if (scrollRef.value) {
          scrollRef.value.scrollTop = scrollRef.value.scrollHeight
        }
      })
    }

    function handleScroll() {
      if (!scrollRef.value) return
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.value
      userScrolledUp = scrollHeight - scrollTop - clientHeight > 50
    }

    onMounted(scrollToBottom)
    watch(() => props.bubbles.length, scrollToBottom)
    watch(() => {
      const last = props.bubbles[props.bubbles.length - 1]
      if (last && 'content' in last) return last.content
      return null
    }, scrollToBottom)

    return () => {
      const merged = mergeBubbles(props.bubbles)

      return (
        <div
          ref={scrollRef}
          class="px-4.5 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-6 pt-5"
          onScroll={handleScroll}
        >
          {merged.map((item, i) => {
            switch (item.type) {
              case 'user':
                return <UserBubble key={i} content={item.content} />
              case 'thinking':
                return (
                  <ThinkingChain
                    key={i}
                    id={
                      'id' in item && item.id ? item.id : `legacy-thinking-${i}`
                    }
                    isStreaming={
                      ('isStreaming' in item && item.isStreaming) ?? false
                    }
                    rawText={
                      'rawText' in item
                        ? (item.rawText ?? item.content)
                        : item.content
                    }
                    steps={
                      'steps' in item && item.steps
                        ? item.steps
                        : item.content
                          ? item.content.split(/\n{2,}/).filter(Boolean)
                          : []
                    }
                  />
                )
              case 'assistant':
                return (
                  <StreamdownBubble
                    key={i}
                    content={item.content}
                    isStreaming={item.streaming ?? false}
                  />
                )
              case 'tool_call_group_view':
                return <ToolCallGroup key={i} id={item.id} items={item.items} />
              case 'error':
                return (
                  <ErrorBubble
                    key={i}
                    message={item.message}
                    onRetry={() => emit('retry')}
                  />
                )
              case 'diff_summary':
                return (
                  <DiffSummaryBubble
                    key={i}
                    accepted={item.accepted}
                    rejected={item.rejected}
                    pending={item.pending}
                  />
                )
              case 'diff_review': {
                const batch = props.getBatch?.(item.batchId)
                if (!batch) return null
                return (
                  <DiffReviewBubble
                    key={i}
                    batch={batch}
                    onAccept={(id: string) => emit('acceptBatch', id)}
                    onReject={(id: string) => emit('rejectBatch', id)}
                  />
                )
              }
              default:
                return null
            }
          })}
        </div>
      )
    }
  },
})
