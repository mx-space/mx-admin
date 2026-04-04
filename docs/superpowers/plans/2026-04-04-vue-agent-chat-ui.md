# Vue Agent Chat UI + Split Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the React-bridge-based agent chat in admin-vue3 with native Vue TSX components + a reusable split panel layout.

**Architecture:** SplitPanel is a generic layout component. Agent chat UI is a Vue port of `@haklex/rich-agent-chat` React components, using `@haklex/rich-agent-core` Zustand store directly via a thin composable bridge. Markdown rendering reuses admin's existing `marked` + `shiki` pattern. All components are Vue 3 TSX (`defineComponent` + JSX).

**Tech Stack:** Vue 3 TSX, UnoCSS, Naive UI, `@haklex/rich-agent-core` (Zustand), `@haklex/rich-diff-core`, `marked` + `shiki`, `lucide-vue-next`

**Spec:** `docs/superpowers/specs/2026-04-04-vue-agent-chat-ui-design.md`

---

## File Map

```
src/components/ui/
└── SplitPanel.tsx                          # NEW — generic draggable split layout

src/components/editor/rich/agent-chat/
├── composables/
│   ├── use-agent-store.ts                  # NEW — Zustand → Vue reactive bridge
│   ├── use-conversation-sync.ts            # NEW — Vue port of useConversationSync
│   └── use-agent-loop.ts                   # NEW — Vue composable wrapping useAgentLoop
├── AgentChatPanel.tsx                      # NEW — root chat component
├── ChatMessageList.tsx                     # NEW — bubble list with merge logic
├── ChatInput.tsx                           # NEW — composer with auto-resize textarea
├── ModelSelector.tsx                       # NEW — model picker dropdown
└── bubbles/
    ├── UserBubble.tsx                      # NEW
    ├── StreamdownBubble.tsx                # NEW — markdown via marked + shiki
    ├── ThinkingChain.tsx                   # NEW
    ├── ToolCallGroup.tsx                   # NEW
    ├── ToolCall.tsx                        # NEW
    ├── DiffReviewBubble.tsx                # NEW
    ├── DiffSummaryBubble.tsx               # NEW
    └── ErrorBubble.tsx                     # NEW

src/components/editor/rich/
├── RichEditorWithAgent.tsx                 # NEW — SplitPanel + editor bridge + chat
├── RichEditor.tsx                          # MODIFY — use RichEditorWithAgent when agentEnabled
└── RichAgentEditor.tsx                     # DELETE after migration
```

---

### Task 1: SplitPanel Component

**Files:**
- Create: `src/components/ui/SplitPanel.tsx`

- [ ] **Step 1: Create SplitPanel.tsx**

```tsx
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'

export const SplitPanel = defineComponent({
  name: 'SplitPanel',
  props: {
    defaultRatio: { type: Number, default: 0.6 },
    minLeft: { type: Number, default: 300 },
    minRight: { type: Number, default: 280 },
    collapsed: { type: Boolean, default: false },
    collapseThreshold: { type: Number, default: 100 },
    storageKey: { type: String, default: undefined },
  },
  emits: ['update:collapsed'],
  setup(props, { emit, slots }) {
    const containerRef = ref<HTMLDivElement>()
    const ratio = ref(props.defaultRatio)
    const dragging = ref(false)

    // Restore from localStorage
    if (props.storageKey) {
      const saved = localStorage.getItem(`split-panel:${props.storageKey}`)
      if (saved) {
        const parsed = Number.parseFloat(saved)
        if (!Number.isNaN(parsed) && parsed > 0 && parsed < 1) ratio.value = parsed
      }
    }

    let rafId = 0

    function onPointerDown(e: PointerEvent) {
      e.preventDefault()
      dragging.value = true
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging.value || !containerRef.value) return
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = containerRef.value!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const totalW = rect.width
        const rightW = totalW - x

        if (rightW < props.collapseThreshold) {
          emit('update:collapsed', true)
          return
        }

        if (props.collapsed) {
          emit('update:collapsed', false)
        }

        const clamped = Math.max(props.minLeft / totalW, Math.min(1 - props.minRight / totalW, x / totalW))
        ratio.value = clamped
      })
    }

    function onPointerUp() {
      dragging.value = false
      if (props.storageKey) {
        localStorage.setItem(`split-panel:${props.storageKey}`, String(ratio.value))
      }
    }

    function onDividerClick() {
      if (props.collapsed) {
        emit('update:collapsed', false)
      }
    }

    onBeforeUnmount(() => cancelAnimationFrame(rafId))

    const dividerStyle = {
      width: '8px',
      cursor: 'col-resize',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none' as const,
      zIndex: 1,
    }

    const handleStyle = {
      width: '3px',
      height: '32px',
      borderRadius: '2px',
      background: 'var(--n-border-color, #e5e5e5)',
      transition: 'background 120ms',
    }

    return () => {
      const isCollapsed = props.collapsed
      const leftW = isCollapsed ? '100%' : `${ratio.value * 100}%`
      const rightW = isCollapsed ? '0%' : `${(1 - ratio.value) * 100}%`

      return (
        <div
          ref={containerRef}
          class="flex h-full w-full overflow-hidden"
          style={dragging.value ? { cursor: 'col-resize' } : undefined}
        >
          <div class="min-w-0 overflow-hidden" style={{ width: leftW, flexShrink: 0 }}>
            {slots.left?.()}
          </div>
          <div
            style={dividerStyle}
            onPointerdown={onPointerDown}
            onPointermove={onPointerMove}
            onPointerup={onPointerUp}
            onClick={onDividerClick}
          >
            <div
              style={{
                ...handleStyle,
                background: dragging.value ? '#a3a3a3' : undefined,
              }}
            />
          </div>
          {!isCollapsed && (
            <div class="min-w-0 overflow-hidden" style={{ width: rightW }}>
              {slots.right?.()}
            </div>
          )}
        </div>
      )
    }
  },
})
```

- [ ] **Step 2: Verify it renders**

Manually import in any existing view and confirm the split layout renders with two placeholder divs. No automated test needed — this is a layout primitive.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/SplitPanel.tsx
git commit -m "feat: add SplitPanel reusable layout component"
```

---

### Task 2: useAgentStore Composable

**Files:**
- Create: `src/components/editor/rich/agent-chat/composables/use-agent-store.ts`

- [ ] **Step 1: Create use-agent-store.ts**

```ts
import type { AgentStore, AgentStoreSlice } from '@haklex/rich-agent-core'
import type { InjectionKey, ShallowRef } from 'vue'
import { inject, onUnmounted, provide, shallowRef } from 'vue'

const AGENT_STORE_KEY: InjectionKey<AgentStore> = Symbol('agent-store')

export function provideAgentStore(store: AgentStore): void {
  provide(AGENT_STORE_KEY, store)
}

export function useAgentStore(): AgentStore {
  const store = inject(AGENT_STORE_KEY)
  if (!store) throw new Error('AgentStore not provided. Wrap with provideAgentStore().')
  return store
}

export function useAgentStoreSelector<T>(
  selector: (state: AgentStoreSlice) => T,
): ShallowRef<T> {
  const store = useAgentStore()
  const value = shallowRef<T>(selector(store.getState()))

  const unsubscribe = store.subscribe((state) => {
    const next = selector(state)
    if (!Object.is(next, value.value)) {
      value.value = next
    }
  })

  onUnmounted(unsubscribe)

  return value
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/rich/agent-chat/composables/use-agent-store.ts
git commit -m "feat: add useAgentStore composable (Zustand → Vue bridge)"
```

---

### Task 3: Bubble Components (All)

**Files:**
- Create: `src/components/editor/rich/agent-chat/bubbles/UserBubble.tsx`
- Create: `src/components/editor/rich/agent-chat/bubbles/ErrorBubble.tsx`
- Create: `src/components/editor/rich/agent-chat/bubbles/StreamdownBubble.tsx`
- Create: `src/components/editor/rich/agent-chat/bubbles/ThinkingChain.tsx`
- Create: `src/components/editor/rich/agent-chat/bubbles/ToolCall.tsx`
- Create: `src/components/editor/rich/agent-chat/bubbles/ToolCallGroup.tsx`
- Create: `src/components/editor/rich/agent-chat/bubbles/DiffReviewBubble.tsx`
- Create: `src/components/editor/rich/agent-chat/bubbles/DiffSummaryBubble.tsx`

- [ ] **Step 1: Create UserBubble.tsx**

```tsx
import { defineComponent } from 'vue'

export const UserBubble = defineComponent({
  name: 'UserBubble',
  props: {
    content: { type: String, required: true },
  },
  setup(props) {
    return () => (
      <div class="self-end max-w-[82%] rounded-[18px_18px_6px_18px] bg-neutral-800 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:bg-neutral-200 dark:text-neutral-900">
        {props.content}
      </div>
    )
  },
})
```

- [ ] **Step 2: Create ErrorBubble.tsx**

```tsx
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
          class="cursor-pointer border-none bg-transparent p-0 font-inherit text-xs text-red-600 underline hover:opacity-80"
          type="button"
          onClick={() => emit('retry')}
        >
          Retry
        </button>
      </div>
    )
  },
})
```

- [ ] **Step 3: Create StreamdownBubble.tsx**

Uses `marked` + `shiki` pattern from admin's existing `MarkdownRender`. Renders markdown content as HTML. Streaming indicator is a blinking cursor.

```tsx
import { marked } from 'marked'
import { codeToHtml } from 'shiki'
import { defineComponent, onMounted, ref, watch } from 'vue'
import xss from 'xss'

export const StreamdownBubble = defineComponent({
  name: 'StreamdownBubble',
  props: {
    content: { type: String, required: true },
    isStreaming: { type: Boolean, default: false },
  },
  setup(props) {
    const html = ref('')
    const containerRef = ref<HTMLElement>()

    async function render(text: string) {
      if (!text) { html.value = ''; return }

      const isDark = document.documentElement.classList.contains('dark')
      const theme = isDark ? 'github-dark' : 'github-light'

      const renderer = new marked.Renderer()
      renderer.code = ({ text: code, lang }) => {
        return `<pre class="shiki-pending" data-lang="${lang || 'text'}" data-code="${encodeURIComponent(code)}"><code>${xss(code)}</code></pre>`
      }

      const parsed = await marked.parse(text, { gfm: true, breaks: true, renderer })
      html.value = typeof parsed === 'string' ? parsed : ''

      // Lazy highlight code blocks
      setTimeout(async () => {
        if (!containerRef.value) return
        const pending = containerRef.value.querySelectorAll('pre.shiki-pending')
        for (const block of pending) {
          const lang = block.getAttribute('data-lang') || 'text'
          const code = decodeURIComponent(block.getAttribute('data-code') || '')
          try {
            block.outerHTML = await codeToHtml(code, { lang, theme })
          } catch {
            block.classList.remove('shiki-pending')
          }
        }
      }, 0)
    }

    onMounted(() => render(props.content))
    watch(() => props.content, render)

    return () => (
      <div
        ref={containerRef}
        class="text-sm leading-[1.75] [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs [&_pre]:bg-neutral-50 [&_pre]:dark:bg-neutral-900 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:dark:bg-neutral-800 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_a]:text-blue-600 [&_a]:dark:text-blue-400"
        v-html={html.value + (props.isStreaming ? '<span class="inline-block w-0.5 h-4 ml-0.5 align-text-bottom bg-current animate-pulse" />' : '')}
      />
    )
  },
})
```

- [ ] **Step 4: Create ThinkingChain.tsx**

```tsx
import { Sparkles, ChevronRight } from 'lucide-vue-next'
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
          class="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-1 text-left font-inherit text-[13px] leading-snug text-neutral-400 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
          type="button"
          onClick={() => { expanded.value = !expanded.value }}
        >
          <span class="flex h-4 w-4 flex-shrink-0 items-center justify-center">
            <Sparkles
              size={14}
              style={props.isStreaming ? { animation: 'pulse 1.5s ease-in-out infinite' } : { opacity: 0.5 }}
            />
          </span>
          <span style={props.isStreaming ? { color: 'var(--n-text-color)' } : undefined}>Thinking</span>

          {props.isStreaming ? (
            <span class="flex items-center gap-0.5">
              <span class="h-1 w-1 rounded-full bg-neutral-400 animate-pulse" />
              <span class="h-1 w-1 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span class="h-1 w-1 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
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
            class={['flex-shrink-0 text-neutral-400 opacity-40 transition-transform', expanded.value && 'rotate-90']}
          />
        </button>

        {expanded.value && (
          <div class="flex flex-col gap-1.5 pb-2 pl-6 pt-1 text-[13px] leading-relaxed text-neutral-400">
            {props.steps.map((step, i) => (
              <p key={i} class="m-0">{step}</p>
            ))}
          </div>
        )}
      </div>
    )
  },
})
```

- [ ] **Step 5: Create ToolCall.tsx**

```tsx
import type { ToolCallGroupItem } from '@haklex/rich-agent-core'
import { Check, ChevronRight, Loader2, X } from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'

function StatusIcon({ status }: { status: ToolCallGroupItem['status'] }) {
  return (
    <span class="flex h-4 w-4 flex-shrink-0 items-center justify-center">
      {status === 'pending' && <span class="h-1.5 w-1.5 rounded-full bg-neutral-300 opacity-40" />}
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
      const hasContent = Object.keys(item.params).length > 0 || item.result || item.error
      const duration = formatDuration(item)

      return (
        <div>
          <button
            class={[
              'flex w-full items-center gap-2 border-none bg-transparent py-1 text-left font-inherit text-[13px] leading-snug text-neutral-400 transition-colors',
              hasContent ? 'cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200' : 'cursor-default',
            ]}
            type="button"
            onClick={() => hasContent && (expanded.value = !expanded.value)}
          >
            <StatusIcon status={item.status} />
            <span
              class="flex-shrink-0 font-mono text-[13px]"
              style={item.status === 'running' ? { color: 'var(--n-text-color)' } : undefined}
            >
              {item.toolName}
            </span>
            {item.description && (
              <span class="min-w-0 flex-1 truncate text-[13px] text-neutral-300">{item.description}</span>
            )}
            <span class="min-w-0 flex-1" />
            {duration && <span class="flex-shrink-0 font-mono text-xs text-neutral-300 opacity-50">{duration}</span>}
            {hasContent && (
              <ChevronRight
                size={12}
                class={['flex-shrink-0 text-neutral-400 opacity-40 transition-transform', expanded.value && 'rotate-90']}
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
```

- [ ] **Step 6: Create ToolCallGroup.tsx**

```tsx
import type { ToolCallGroupItem, ToolCallItemStatus } from '@haklex/rich-agent-core'
import { Check, ChevronRight, Loader2, X } from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'

import { ToolCall } from './ToolCall'

function deriveGroupStatus(items: ToolCallGroupItem[]): ToolCallItemStatus {
  if (items.some((i) => i.status === 'error')) return 'error'
  if (items.some((i) => i.status === 'running')) return 'running'
  if (items.every((i) => i.status === 'completed')) return 'completed'
  if (items.some((i) => i.status === 'completed' || i.status === 'running')) return 'running'
  return 'pending'
}

function GroupStatusIcon({ status }: { status: ToolCallItemStatus }) {
  return (
    <span class="flex h-4 w-4 flex-shrink-0 items-center justify-center">
      {status === 'pending' && <span class="h-1.5 w-1.5 rounded-full bg-neutral-300 opacity-40" />}
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
    defaultExpanded: { type: Boolean, default: true },
  },
  setup(props) {
    const expanded = ref(props.defaultExpanded)
    const groupStatus = computed(() => deriveGroupStatus(props.items))
    const completedCount = computed(() => props.items.filter((i) => i.status === 'completed').length)

    return () => {
      if (props.items.length === 1) {
        return <ToolCall item={props.items[0]} />
      }

      const title = groupStatus.value === 'completed'
        ? `Executed ${props.items.length} tasks`
        : 'Executing parallel tasks'

      return (
        <div>
          <button
            class="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-1 text-left font-inherit text-[13px] leading-snug text-neutral-400 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
            type="button"
            onClick={() => { expanded.value = !expanded.value }}
          >
            <GroupStatusIcon status={groupStatus.value} />
            <span
              class="flex-shrink-0 font-mono text-[13px]"
              style={groupStatus.value === 'running' ? { color: 'var(--n-text-color)' } : undefined}
            >
              {title}
            </span>
            <span class="font-mono text-xs text-neutral-400 opacity-50">
              {completedCount.value}/{props.items.length}
            </span>
            <span class="flex-1" />
            <ChevronRight
              size={12}
              class={['flex-shrink-0 text-neutral-400 opacity-40 transition-transform', expanded.value && 'rotate-90']}
            />
          </button>

          {expanded.value && (
            <div class="pl-4 pt-0.5">
              {props.items.map((item) => (
                <ToolCall item={item} key={item.id} />
              ))}
            </div>
          )}
        </div>
      )
    }
  },
})
```

- [ ] **Step 7: Create DiffReviewBubble.tsx**

```tsx
import type { ReviewBatch, ReviewBatchStatus } from '@haklex/rich-agent-core'
import { computeDiff } from '@haklex/rich-diff-core'
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'

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
  },
  emits: ['accept', 'reject'],
  setup(props, { emit }) {
    const hunks = computed(() =>
      computeDiff(props.batch.baseSnapshot, props.batch.previewSnapshot),
    )

    return () => {
      const batch = props.batch
      const isActionable = batch.status !== 'accepted' && batch.status !== 'rejected'
      const n = batch.entries.length
      const statusLabel = STATUS_LABEL[batch.status] ?? `${n} change${n > 1 ? 's' : ''}`

      return (
        <div class="my-2 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 text-[13px] dark:border-neutral-700">
          <div class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800/50">
            <span class="rounded-full border border-neutral-200 px-2 py-0.5 font-mono text-[11px] font-medium dark:border-neutral-700">
              {statusLabel}
            </span>
            {isActionable && (
              <div class="flex gap-1.5">
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
              </div>
            )}
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
                  isInsert ? 'bg-green-600/8' : 'bg-red-600/6 line-through opacity-70',
                ]}
              >
                {isInsert ? '+ ' : '- '}{text}
              </div>
            )
          })}
        </div>
      )
    }
  },
})
```

- [ ] **Step 8: Create DiffSummaryBubble.tsx**

```tsx
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
      <div class="self-start max-w-[86%] rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800/50">
        Diff: {props.accepted} accepted, {props.rejected} rejected, {props.pending} pending
      </div>
    )
  },
})
```

- [ ] **Step 9: Commit**

```bash
git add src/components/editor/rich/agent-chat/bubbles/
git commit -m "feat: add Vue agent chat bubble components"
```

---

### Task 4: ChatInput Component

**Files:**
- Create: `src/components/editor/rich/agent-chat/ChatInput.tsx`

- [ ] **Step 1: Create ChatInput.tsx**

```tsx
import type { AgentStoreStatus } from '@haklex/rich-agent-core'
import { ArrowUp, Square } from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import type { PropType, VNode } from 'vue'

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
      // Reset textarea height
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
      // Auto-resize
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
    }

    const isAbortMode = () => Boolean(props.isRunning)
    const statusLabel = () => props.status ? STATUS_LABELS[props.status] : undefined

    return () => (
      <div class="flex flex-shrink-0 flex-col px-4.5 pb-3.5 pt-2.5">
        {props.isRunning && statusLabel() && (
          <div class="mb-2 ml-1 flex items-center gap-1.5 text-xs text-neutral-400">
            <span class="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            <span>{statusLabel()}</span>
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
              aria-label={isAbortMode() ? 'Stop' : 'Send'}
              class={
                isAbortMode()
                  ? 'inline-flex h-[30px] w-[30px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-red-600 bg-transparent text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20'
                  : 'inline-flex h-[30px] w-[30px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-neutral-800 text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-neutral-200 dark:text-neutral-900 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500'
              }
              disabled={isAbortMode() ? false : props.disabled || !input.value.trim()}
              type="button"
              onClick={isAbortMode() ? () => emit('abort') : handleSend}
            >
              {isAbortMode() ? (
                <Square fill="currentColor" size={14} stroke-width={0} />
              ) : (
                <ArrowUp size={16} stroke-width={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/rich/agent-chat/ChatInput.tsx
git commit -m "feat: add Vue ChatInput component with auto-resize"
```

---

### Task 5: ModelSelector Component

**Files:**
- Create: `src/components/editor/rich/agent-chat/ModelSelector.tsx`

- [ ] **Step 1: Create ModelSelector.tsx**

Uses Naive UI `NPopselect` for the dropdown. Flattens provider groups into options.

```tsx
import { NPopselect } from 'naive-ui'
import { ChevronDown } from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'

export interface ProviderGroup {
  id: string
  name: string
  providerType: 'claude' | 'openai-compatible'
  models: { id: string; displayName: string }[]
}

export interface SelectedModel {
  modelId: string
  providerId: string
  providerType: 'claude' | 'openai-compatible'
}

export const ModelSelector = defineComponent({
  name: 'ModelSelector',
  props: {
    providerGroups: { type: Array as PropType<ProviderGroup[]>, required: true },
    selectedModel: { type: Object as PropType<SelectedModel | null>, default: null },
  },
  emits: ['selectModel'],
  setup(props, { emit }) {
    const options = computed(() =>
      props.providerGroups.map((group) => ({
        type: 'group' as const,
        label: group.name,
        key: group.id,
        children: group.models.map((m) => ({
          label: m.displayName,
          value: `${group.id}::${m.id}`,
        })),
      })),
    )

    const selectedValue = computed(() =>
      props.selectedModel
        ? `${props.selectedModel.providerId}::${props.selectedModel.modelId}`
        : null,
    )

    const selectedLabel = computed(() => {
      if (!props.selectedModel) return 'Select model'
      for (const g of props.providerGroups) {
        const m = g.models.find((m) => m.id === props.selectedModel!.modelId)
        if (m) return m.displayName
      }
      return props.selectedModel.modelId
    })

    function handleUpdate(value: string) {
      const [providerId, modelId] = value.split('::')
      const group = props.providerGroups.find((g) => g.id === providerId)
      if (!group) return
      emit('selectModel', {
        modelId,
        providerId,
        providerType: group.providerType,
      })
    }

    return () => (
      <NPopselect
        options={options.value}
        value={selectedValue.value}
        scrollable
        size="small"
        onUpdateValue={handleUpdate}
      >
        <button
          class="inline-flex cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-2 py-1 text-xs text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
          type="button"
        >
          <span class="max-w-[160px] truncate">{selectedLabel.value}</span>
          <ChevronDown size={12} />
        </button>
      </NPopselect>
    )
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/rich/agent-chat/ModelSelector.tsx
git commit -m "feat: add Vue ModelSelector with NPopselect"
```

---

### Task 6: ChatMessageList Component

**Files:**
- Create: `src/components/editor/rich/agent-chat/ChatMessageList.tsx`

- [ ] **Step 1: Create ChatMessageList.tsx**

Ports the `mergeBubbles` logic and renders all bubble types.

```tsx
import type { ChatBubble, ReviewBatch, ToolCallGroupItem } from '@haklex/rich-agent-core'
import { defineComponent, nextTick, onMounted, ref, watch } from 'vue'
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
      result.push({ type: 'tool_call_group_view', id: `legacy-${legacyGroupStartIdx}`, items: legacyGroup })
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
      if (!legacyGroup) { legacyGroup = []; legacyGroupStartIdx = i }
      const next = bubbles[i + 1]
      if (next?.type === 'tool_result' && next.toolName === b.toolName) {
        legacyGroup.push({
          id: `fallback-${i}`, toolName: b.toolName, params: b.params,
          status: next.success ? 'completed' : 'error',
          result: next.success ? next.summary : undefined,
          resultPreview: next.success ? next.summary.slice(0, 80) : undefined,
          error: !next.success ? next.summary : undefined,
        })
        i++
      } else {
        legacyGroup.push({ id: `fallback-${i}`, toolName: b.toolName, params: b.params, status: 'running' })
      }
      continue
    }

    if (b.type === 'tool_result') { flushLegacy(); continue }

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
    getBatch: { type: Function as PropType<(batchId: string) => ReviewBatch | undefined>, default: undefined },
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
    // Also scroll when last bubble content changes (streaming)
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
          class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4.5 pb-6 pt-5"
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
                    id={'id' in item && item.id ? item.id : `legacy-thinking-${i}`}
                    isStreaming={('isStreaming' in item && item.isStreaming) ?? false}
                    rawText={'rawText' in item ? (item.rawText ?? item.content) : item.content}
                    steps={'steps' in item && item.steps ? item.steps : item.content ? item.content.split(/\n{2,}/).filter(Boolean) : []}
                  />
                )
              case 'assistant':
                return <StreamdownBubble key={i} content={item.content} isStreaming={item.streaming ?? false} />
              case 'tool_call_group_view':
                return <ToolCallGroup key={i} id={item.id} items={item.items} />
              case 'error':
                return <ErrorBubble key={i} message={item.message} onRetry={() => emit('retry')} />
              case 'diff_summary':
                return <DiffSummaryBubble key={i} accepted={item.accepted} rejected={item.rejected} pending={item.pending} />
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/rich/agent-chat/ChatMessageList.tsx
git commit -m "feat: add Vue ChatMessageList with bubble merge logic"
```

---

### Task 7: AgentChatPanel Root Component

**Files:**
- Create: `src/components/editor/rich/agent-chat/AgentChatPanel.tsx`

- [ ] **Step 1: Create AgentChatPanel.tsx**

```tsx
import type { AgentStore, ReviewBatch } from '@haklex/rich-agent-core'
import { agentStoreSelectors } from '@haklex/rich-agent-core'
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'

import { ChatInput } from './ChatInput'
import { ChatMessageList } from './ChatMessageList'
import { ModelSelector } from './ModelSelector'
import type { ProviderGroup, SelectedModel } from './ModelSelector'
import { provideAgentStore, useAgentStoreSelector } from './composables/use-agent-store'

export const AgentChatPanel = defineComponent({
  name: 'AgentChatPanel',
  props: {
    store: { type: Object as PropType<AgentStore>, required: true },
    providerGroups: { type: Array as PropType<ProviderGroup[]>, required: true },
    selectedModel: { type: Object as PropType<SelectedModel | null>, default: null },
  },
  emits: ['send', 'abort', 'selectModel', 'acceptBatch', 'rejectBatch', 'retry'],
  setup(props, { emit }) {
    provideAgentStore(props.store)

    const bubbles = useAgentStoreSelector(agentStoreSelectors.bubbles)
    const status = useAgentStoreSelector(agentStoreSelectors.status)
    const reviewState = useAgentStoreSelector(agentStoreSelectors.reviewState)

    const isRunning = computed(() => status.value !== 'idle' && status.value !== 'done')
    const hasModel = computed(() => props.selectedModel !== null)

    function getBatch(batchId: string): ReviewBatch | undefined {
      return reviewState.value?.batches.find((b: ReviewBatch) => b.id === batchId)
    }

    function handleSend(message: string) {
      props.store.getState().addBubble({ type: 'user', content: message })
      emit('send', message)
    }

    return () => (
      <div class="flex h-full min-h-0 flex-col overflow-hidden text-sm">
        <ChatMessageList
          bubbles={bubbles.value}
          getBatch={getBatch}
          onAcceptBatch={(id: string) => emit('acceptBatch', id)}
          onRejectBatch={(id: string) => emit('rejectBatch', id)}
          onRetry={() => emit('retry')}
        />
        <ChatInput
          disabled={!hasModel.value}
          isRunning={isRunning.value}
          status={status.value}
          onSend={handleSend}
          onAbort={() => emit('abort')}
        >
          {{
            modelSelector: () => (
              <ModelSelector
                providerGroups={props.providerGroups}
                selectedModel={props.selectedModel}
                onSelectModel={(model: SelectedModel) => emit('selectModel', model)}
              />
            ),
          }}
        </ChatInput>
      </div>
    )
  },
})
```

- [ ] **Step 2: Create index.ts barrel**

Create `src/components/editor/rich/agent-chat/index.ts`:

```ts
export { AgentChatPanel } from './AgentChatPanel'
export { provideAgentStore, useAgentStore, useAgentStoreSelector } from './composables/use-agent-store'
export type { ProviderGroup, SelectedModel } from './ModelSelector'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/rich/agent-chat/AgentChatPanel.tsx
git add src/components/editor/rich/agent-chat/index.ts
git commit -m "feat: add AgentChatPanel root Vue component"
```

---

### Task 8: Conversation Sync Vue Composable

**Files:**
- Create: `src/components/editor/rich/agent-chat/composables/use-conversation-sync.ts`

- [ ] **Step 1: Create use-conversation-sync.ts**

Port from the React `useConversationSync.ts`. Replace `useEffect` with `watchEffect`, refs with plain variables.

```ts
import type { AgentStore, ChatBubble } from '@haklex/rich-agent-core'
import { onUnmounted, watchEffect } from 'vue'

import { API_URL } from '~/constants/env'

interface ConversationSyncOptions {
  store: AgentStore
  refId: string | undefined
  refType: 'post' | 'note' | 'page'
  model: string
  providerId: string
}

export function useConversationSync({
  store,
  refId,
  refType,
  model,
  providerId,
}: ConversationSyncOptions) {
  let conversationId: string | null = null
  let lastSyncedLength = 0

  if (!refId) return

  // Load existing conversation
  loadConversation(refId, refType)
    .then((conv) => {
      if (conv) {
        conversationId = conv.id
        if (store.getState().bubbles.length === 0 && conv.messages?.length) {
          lastSyncedLength = conv.messages.length
        }
      }
    })
    .catch(() => {})

  // Subscribe to store changes
  const unsubscribe = store.subscribe((state) => {
    if (state.bubbles.length <= lastSyncedLength) return

    const newBubbles = state.bubbles.slice(lastSyncedLength)
    lastSyncedLength = state.bubbles.length

    appendBubbles(newBubbles, refId, refType, model, providerId)
  })

  onUnmounted(unsubscribe)

  async function appendBubbles(
    bubbles: ChatBubble[],
    refId: string,
    refType: string,
    model: string,
    providerId: string,
  ) {
    const messages = bubbles as unknown as Record<string, unknown>[]

    if (!conversationId) {
      try {
        const res = await fetch(`${API_URL}/ai/agent/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refId, refType, model, providerId, messages }),
        })
        if (res.ok) {
          const conv = await res.json()
          conversationId = conv.id
        }
      } catch {}
      return
    }

    try {
      await fetch(`${API_URL}/ai/agent/conversations/${conversationId}/messages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages }),
      })
    } catch {}
  }
}

async function loadConversation(refId: string, refType: string) {
  const res = await fetch(
    `${API_URL}/ai/agent/conversations?refId=${refId}&refType=${refType}`,
    { credentials: 'include' },
  )
  if (!res.ok) return null
  const list = await res.json()
  if (!list?.length) return null

  const detailRes = await fetch(
    `${API_URL}/ai/agent/conversations/${list[0].id}`,
    { credentials: 'include' },
  )
  if (!detailRes.ok) return null
  return detailRes.json()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/rich/agent-chat/composables/use-conversation-sync.ts
git commit -m "feat: port useConversationSync to Vue composable"
```

---

### Task 9: Agent Loop Vue Composable

**Files:**
- Create: `src/components/editor/rich/agent-chat/composables/use-agent-loop.ts`

The React version uses `useAgentLoop` from `@haklex/rich-ext-ai-agent`, which is a React hook that needs a Lexical editor context. Since the editor is still React (bridge), we cannot call the React hook from Vue. Instead, we expose the agent loop **from the React side** by passing a ref callback.

This composable manages `createAgentStore`, `createProvider`, and the abort controller. The actual `useAgentLoop` remains inside the React bridge.

- [ ] **Step 1: Create use-agent-loop.ts**

```ts
import type { AgentStore, ChatBubble, LLMProvider, TransportAdapter } from '@haklex/rich-agent-core'
import { createAgentStore, createProvider } from '@haklex/rich-agent-core'
import { computed, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'

import { API_URL } from '~/constants/env'

import type { ProviderGroup, SelectedModel } from '../ModelSelector'

function createAdminTransport(providerId: string): TransportAdapter {
  return async (messages, tools, model, signal) => {
    return fetch(`${API_URL}/ai/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ model, messages, tools, providerId }),
      signal,
    })
  }
}

function mapProviderType(type: string): 'claude' | 'openai-compatible' {
  if (type === 'anthropic' || type === 'claude') return 'claude'
  return 'openai-compatible'
}

interface UseAgentSetupOptions {
  providerGroups: Ref<ProviderGroup[]>
  selectedModel: Ref<SelectedModel | null>
  initialBubbles?: ChatBubble[]
}

export function useAgentSetup(options: UseAgentSetupOptions) {
  const store = createAgentStore(options.initialBubbles)
  const abortController = shallowRef<AbortController | null>(null)

  const provider = computed<LLMProvider | null>(() => {
    const model = options.selectedModel.value
    if (!model) return null
    const group = options.providerGroups.value.find((g) => g.id === model.providerId)
    if (!group) return null
    const transport = createAdminTransport(model.providerId)
    return createProvider({
      model: model.modelId,
      transport,
      providerType: mapProviderType(group.providerType),
    })
  })

  function abort() {
    abortController.value?.abort()
    store.getState().setStatus('idle')
  }

  function retry() {
    const bubbles = store.getState().bubbles
    const last = [...bubbles].reverse().find((b) => b.type === 'user')
    if (last && last.type === 'user') {
      // The actual send will be triggered by the agentLoop ref from React
      return last.content
    }
    return null
  }

  return {
    store,
    provider,
    abortController,
    abort,
    retry,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/rich/agent-chat/composables/use-agent-loop.ts
git commit -m "feat: add useAgentSetup Vue composable for store + provider"
```

---

### Task 10: RichEditorWithAgent + Integration

**Files:**
- Create: `src/components/editor/rich/RichEditorWithAgent.tsx`
- Modify: `src/components/editor/rich/RichEditor.tsx`

This is the most complex task. The key insight: **the Lexical editor stays in the React bridge**. The React-side `RichAgentEditor` is simplified to only render the editor + `AgentLoopCapture` (which captures the `useAgentLoop` ref). The Vue side owns the layout (SplitPanel) and the chat UI.

- [ ] **Step 1: Create RichEditorWithAgent.tsx**

This Vue component:
1. Creates the agent store + provider via `useAgentSetup`
2. Renders SplitPanel with left=React editor bridge, right=AgentChatPanel
3. Passes an `agentLoopRunner` callback to the React bridge so the React side can expose the `run` function

```tsx
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { defineComponent, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import type { PropType } from 'vue'

import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type { ChatBubble, ReviewBatch } from '@haklex/rich-agent-core'
import { agentStoreSelectors } from '@haklex/rich-agent-core'
import type { RichEditorVariant } from '@haklex/rich-editor'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type { LexicalEditor, LexicalNode, SerializedEditorState } from 'lexical'
import { $getRoot, $getState, $parseSerializedNode } from 'lexical'

import { getVariantClass } from '@haklex/rich-editor'
import { DialogStackProvider } from '@haklex/rich-editor-ui'
import { blockIdState } from '@haklex/rich-editor/plugins'
import { DiffReviewOverlayPlugin, useAgentLoop } from '@haklex/rich-ext-ai-agent'
import { NestedDocDialogEditorProvider, nestedDocEditNodes, NestedDocPlugin } from '@haklex/rich-ext-nested-doc'
import { ExcalidrawConfigProvider, ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { filesApi } from '~/api/files'
import { API_URL } from '~/constants/env'
import { useUIStore } from '~/stores/ui'

import { SplitPanel } from '../../ui/SplitPanel'
import { AgentChatPanel } from './agent-chat/AgentChatPanel'
import { useConversationSync } from './agent-chat/composables/use-conversation-sync'
import { useAgentSetup } from './agent-chat/composables/use-agent-loop'

import '@haklex/rich-ext-ai-agent/style.css'
import '@haklex/rich-kit-shiro/style.css'
import '@haklex/rich-plugin-toolbar/style.css'
import '@haklex/rich-ext-nested-doc/style.css'

// ── React-side helpers (unchanged from RichAgentEditor.tsx) ──

const saveExcalidrawSnapshot = async (snapshot: object, existingRef?: string): Promise<string> => {
  const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' })
  const file = new File([blob], 'snapshot.excalidraw', { type: 'application/json' })
  if (existingRef?.startsWith('ref:file/')) {
    const name = existingRef.slice(9)
    const result = await filesApi.update('file', name, file)
    return `ref:file/${result.name}`
  }
  const result = await filesApi.upload(file, 'file')
  return `ref:file/${result.name}`
}

function NestedDocDialogEditor({ initialValue, onEditorReady }: any) {
  return createElement(ShiroEditor, { initialValue, onEditorReady, extraNodes: nestedDocEditNodes, header: createElement(ToolbarPlugin) })
}

function $findBlockByBlockId(blockId: string): LexicalNode | null {
  const root = $getRoot()
  for (const child of root.getChildren()) {
    if ($getState(child, blockIdState) === blockId) return child
  }
  return null
}

// React component: editor + agent loop capture
function ReactEditorPane(props: {
  editorProps: Record<string, unknown>
  store: any
  provider: any
  onChange?: (v: SerializedEditorState) => void
  onSubmit?: () => void
  onEditorReady?: (editor: LexicalEditor | null) => void
  onAgentLoopReady?: (loop: { run: (msg: string) => Promise<any> } | null) => void
}) {
  return createElement(
    NestedDocDialogEditorProvider,
    { value: NestedDocDialogEditor },
    createElement(
      DialogStackProvider,
      null,
      createElement(
        ExcalidrawConfigProvider,
        { saveSnapshot: saveExcalidrawSnapshot, apiUrl: API_URL },
        createElement(
          ShiroEditor,
          {
            ...props.editorProps,
            extraNodes: [...(props.editorProps.extraNodes as any[] || []), ...nestedDocEditNodes],
            header: createElement(ToolbarPlugin),
            onChange: props.onChange,
            onSubmit: props.onSubmit,
            onEditorReady: props.onEditorReady,
          },
          createElement(DiffReviewOverlayPlugin, { store: props.store }),
          props.provider && createElement(AgentLoopCapture, {
            provider: props.provider,
            store: props.store,
            onReady: props.onAgentLoopReady,
          }),
          createElement(NestedDocPlugin),
        ),
      ),
    ),
  )
}

function AgentLoopCapture({ provider, store, onReady }: { provider: any; store: any; onReady?: (loop: any) => void }) {
  const loop = useAgentLoop({ provider, store })
  onReady?.(loop)
  return null
}

// ── Vue component ──

export const RichEditorWithAgent = defineComponent({
  name: 'RichEditorWithAgent',
  props: {
    initialValue: Object as PropType<SerializedEditorState>,
    theme: String as PropType<'dark' | 'light'>,
    placeholder: String,
    variant: String as PropType<RichEditorVariant>,
    autoFocus: { type: Boolean, default: undefined },
    className: String,
    contentClassName: String,
    debounceMs: Number,
    selfHostnames: Array as PropType<string[]>,
    extraNodes: Array as PropType<any[]>,
    editorStyle: Object as PropType<Record<string, string | number>>,
    imageUpload: Function as PropType<ShiroEditorProps['imageUpload']>,
    agentVisible: { type: Boolean, default: true },
    providerGroups: { type: Array as PropType<ProviderGroup[]>, default: () => [] },
    selectedModel: { type: Object as PropType<SelectedModel | null>, default: null },
    onSelectModel: Function as PropType<(m: SelectedModel) => void>,
    initialBubbles: Array as PropType<ChatBubble[]>,
    refId: String,
    refType: String as PropType<'post' | 'note' | 'page'>,
  },
  emits: ['change', 'textChange', 'submit', 'editorReady', 'update:agentVisible'],
  setup(props, { emit, expose }) {
    const editorContainerRef = ref<HTMLDivElement>()
    const collapsed = ref(!props.agentVisible)
    let reactRoot: any = null
    let editorInstance: LexicalEditor | null = null
    let agentLoop: { run: (msg: string) => Promise<any> } | null = null
    let unmounting = false

    // Agent setup
    const { store, provider, abort } = useAgentSetup({
      providerGroups: toRef(props, 'providerGroups'),
      selectedModel: toRef(props, 'selectedModel'),
      initialBubbles: props.initialBubbles,
    })

    // Conversation sync
    useConversationSync({
      store,
      refId: props.refId,
      refType: props.refType ?? 'post',
      model: props.selectedModel?.modelId ?? '',
      providerId: props.selectedModel?.providerId ?? '',
    })

    // Watch collapsed ↔ agentVisible
    watch(collapsed, (val) => emit('update:agentVisible', !val))
    watch(() => props.agentVisible, (val) => { collapsed.value = !val })

    // ── React rendering ──
    const buildEditorProps = (resolvedTheme: 'dark' | 'light') => {
      const ep: Record<string, unknown> = { theme: resolvedTheme }
      if (props.initialValue !== undefined) ep.initialValue = props.initialValue
      if (props.placeholder !== undefined) ep.placeholder = props.placeholder
      if (props.variant !== undefined) ep.variant = props.variant
      if (props.autoFocus !== undefined) ep.autoFocus = props.autoFocus
      if (props.className !== undefined) ep.className = props.className
      if (props.contentClassName !== undefined) ep.contentClassName = props.contentClassName
      if (props.debounceMs !== undefined) ep.debounceMs = props.debounceMs
      if (props.selfHostnames !== undefined) ep.selfHostnames = props.selfHostnames
      if (props.extraNodes !== undefined) ep.extraNodes = props.extraNodes
      if (props.editorStyle !== undefined) ep.style = props.editorStyle
      if (props.imageUpload !== undefined) ep.imageUpload = props.imageUpload
      return ep
    }

    const handleChange = (value: SerializedEditorState) => {
      if (unmounting) return
      emit('change', value)
      editorInstance?.read(() => emit('textChange', $convertToMarkdownString(TRANSFORMERS)))
    }

    const handleEditorReady = (editor: LexicalEditor | null) => {
      editorInstance = editor
      emit('editorReady', editor)
      editor?.read(() => emit('textChange', $convertToMarkdownString(TRANSFORMERS)))
    }

    const renderReact = (resolvedTheme: 'dark' | 'light') => {
      if (!reactRoot) return
      reactRoot.render(
        createElement(ReactEditorPane, {
          editorProps: buildEditorProps(resolvedTheme),
          store,
          provider: provider.value,
          onChange: handleChange,
          onSubmit: () => emit('submit'),
          onEditorReady: handleEditorReady,
          onAgentLoopReady: (loop: any) => { agentLoop = loop },
        }),
      )
    }

    onMounted(() => {
      reactRoot = createRoot(editorContainerRef.value!)
      const uiStore = useUIStore()
      const resolveTheme = () => props.theme ?? (uiStore.isDark ? 'dark' : 'light')
      renderReact(resolveTheme())

      watch(
        () => [
          props.theme, uiStore.isDark, props.placeholder, props.variant,
          props.autoFocus, props.className, props.contentClassName, props.debounceMs,
          props.selfHostnames, props.extraNodes, props.editorStyle, props.imageUpload,
          provider.value,
        ],
        () => renderReact(resolveTheme()),
      )
    })

    onBeforeUnmount(() => {
      unmounting = true
      reactRoot?.unmount()
      reactRoot = null
      editorInstance = null
    })

    // ── Chat event handlers ──
    function handleSend(message: string) {
      if (!agentLoop) return
      agentLoop.run(message).catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return
        store.getState().addBubble({ type: 'error', message: String(err) })
      })
    }

    function handleRetry() {
      const bubbles = store.getState().bubbles
      const last = [...bubbles].reverse().find((b) => b.type === 'user')
      if (last && last.type === 'user') handleSend(last.content)
    }

    function handleAcceptBatch(batchId: string) {
      store.getState().acceptReviewBatch(batchId)
      const reviewState = store.getState().reviewState
      const batch = reviewState?.batches.find((b: ReviewBatch) => b.id === batchId)
      if (!batch || !editorInstance) return

      editorInstance.update(() => {
        const root = $getRoot()
        for (const entry of batch.entries) {
          const { op } = entry
          if (op.op === 'insert') {
            if (!op.node?.type) continue
            const newNode = $parseSerializedNode(op.node)
            if (op.position.type === 'root') {
              const idx = op.position.index ?? root.getChildrenSize()
              const children = root.getChildren()
              if (idx >= children.length) root.append(newNode)
              else children[idx].insertBefore(newNode)
            } else {
              const target = $findBlockByBlockId(op.position.blockId)
              if (!target) continue
              if (op.position.type === 'after') target.insertAfter(newNode)
              else target.insertBefore(newNode)
            }
          } else if (op.op === 'replace') {
            if (!op.node?.type) continue
            const target = $findBlockByBlockId(op.blockId)
            if (!target) continue
            target.replace($parseSerializedNode(op.node))
          } else if (op.op === 'delete') {
            const target = $findBlockByBlockId(op.blockId)
            if (!target) continue
            target.remove()
          }
        }
      })
    }

    function handleRejectBatch(batchId: string) {
      store.getState().rejectReviewBatch(batchId)
    }

    expose({ focus: () => editorInstance?.focus() })

    return () => (
      <SplitPanel
        collapsed={collapsed.value}
        defaultRatio={0.6}
        minLeft={400}
        minRight={320}
        storageKey="editor-agent-split"
        onUpdate:collapsed={(val: boolean) => { collapsed.value = val }}
      >
        {{
          left: () => <div class="h-full w-full" ref={editorContainerRef} />,
          right: () => (
            <AgentChatPanel
              store={store}
              providerGroups={props.providerGroups}
              selectedModel={props.selectedModel}
              onSend={handleSend}
              onAbort={abort}
              onSelectModel={(m: SelectedModel) => props.onSelectModel?.(m)}
              onAcceptBatch={handleAcceptBatch}
              onRejectBatch={handleRejectBatch}
              onRetry={handleRetry}
            />
          ),
        }}
      </SplitPanel>
    )
  },
})
```

- [ ] **Step 2: Update RichEditor.tsx to use RichEditorWithAgent**

In `src/components/editor/rich/RichEditor.tsx`, replace the `agentEnabled` branch: when `props.agentEnabled` is true, render `RichEditorWithAgent` directly as a Vue component (no React bridge needed for the chat part).

The key change in `RichEditor.tsx` `setup()`:

Replace the `renderReact` function's `if (props.agentEnabled)` branch. Instead of creating a React root for the whole thing, conditionally return the Vue `RichEditorWithAgent` component.

Change the `return` render function:

```tsx
return () => {
  if (props.agentEnabled) {
    return (
      <RichEditorWithAgent
        ref={vueEditorRef}
        initialValue={props.initialValue}
        theme={props.theme}
        placeholder={props.placeholder}
        variant={props.variant}
        autoFocus={props.autoFocus}
        className={props.className}
        contentClassName={props.contentClassName}
        debounceMs={props.debounceMs}
        selfHostnames={props.selfHostnames}
        extraNodes={props.extraNodes}
        editorStyle={props.editorStyle}
        imageUpload={props.imageUpload}
        agentVisible={props.agentVisible}
        providerGroups={props.providerGroups}
        selectedModel={props.selectedModel}
        onSelectModel={props.onSelectModel}
        initialBubbles={props.initialBubbles}
        refId={props.refId}
        refType={props.refType}
        onChange={(v: SerializedEditorState) => emit('change', v)}
        onTextChange={(t: string) => emit('textChange', t)}
        onSubmit={() => emit('submit')}
        onEditorReady={(e: LexicalEditor | null) => {
          editorInstance = e
          emit('editorReady', e)
        }}
      />
    )
  }

  // Non-agent mode: keep existing React bridge
  return <div class="h-full w-full" ref={containerRef} />
}
```

This keeps the non-agent path unchanged and routes the agent path through the new Vue component.

- [ ] **Step 3: Remove `@haklex/rich-agent-chat/style.css` import from RichEditor.tsx**

The Vue chat components use UnoCSS, no longer need the React CSS import. Keep other CSS imports.

- [ ] **Step 4: Lint modified files**

```bash
npx eslint src/components/editor/rich/RichEditorWithAgent.tsx src/components/editor/rich/RichEditor.tsx --fix
```

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/rich/RichEditorWithAgent.tsx
git add src/components/editor/rich/RichEditor.tsx
git commit -m "feat: integrate SplitPanel + Vue AgentChatPanel into editor"
```

---

### Task 11: Cleanup

**Files:**
- Delete: `src/components/editor/rich/RichAgentEditor.tsx` (after confirming the new path works)
- Delete: `src/components/editor/rich/useConversationSync.ts` (replaced by Vue composable)

- [ ] **Step 1: Verify the app builds and agent chat renders**

```bash
pnpm dev
```

Open the editor page with agent enabled. Verify:
- SplitPanel renders with draggable divider
- Chat panel shows on the right
- Can send messages
- Can collapse/expand the chat panel
- Model selector works

- [ ] **Step 2: Delete old files**

```bash
git rm src/components/editor/rich/RichAgentEditor.tsx
git rm src/components/editor/rich/useConversationSync.ts
```

- [ ] **Step 3: Remove unused import of `@haklex/rich-agent-chat` from package.json if no longer used anywhere**

Check if `@haklex/rich-agent-chat` is still imported anywhere:

```bash
rg '@haklex/rich-agent-chat' src/ --files-with-matches
```

If no results, the dependency can be removed from `package.json`. However, type imports (`ProviderGroup`, `SelectedModel`) from the caller side may still reference it — check before removing.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove React agent chat bridge, use native Vue components"
```

---

## Parallelization Guide

Tasks that can run in parallel (no code dependencies between them):

**Wave 1:** Task 1, Task 2
**Wave 2:** Task 3, Task 4, Task 5, Task 8, Task 9
**Wave 3:** Task 6 (needs bubble components from Task 3)
**Wave 4:** Task 7 (needs Task 2, 4, 5, 6)
**Wave 5:** Task 10 (needs everything)
**Wave 6:** Task 11 (cleanup after verification)
