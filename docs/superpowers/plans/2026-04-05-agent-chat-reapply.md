# Agent Chat Re-Apply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add in-place re-apply interaction to agent chat so users can replay completed edits against the current editor state, with inline progress and conflict reporting.

**Architecture:** A new composable `use-agent-reapply.ts` owns replay state and orchestration logic (compatibility checks, editor mutations, result aggregation). `RichEditorWithAgent.tsx` wires it up by passing the `editorInstance` and exposes handler callbacks. The three bubble components (`ToolCall`, `ToolCallGroup`, `DiffReviewBubble`) receive replay state + handler props and render inline UI.

**Tech Stack:** Vue 3 TSX (defineComponent + JSX), Lexical editor API, `@haklex/rich-agent-core` types, `lucide-vue-next` icons.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts` | **Create** | Replay state map, compatibility checks, single/group/batch replay orchestration, editor mutations |
| `src/components/editor/rich/RichEditorWithAgent.tsx` | **Modify** | Wire `useReapply` composable, pass handlers + state down through `AgentChatPanel` |
| `src/components/editor/rich/agent-chat/AgentChatPanel.tsx` | **Modify** | Thread replay state + handler props to bubble list |
| `src/components/editor/rich/agent-chat/ChatMessageList.tsx` | **Modify** | Pass replay state + handlers to `ToolCallGroup` and `DiffReviewBubble` |
| `src/components/editor/rich/agent-chat/bubbles/ToolCall.tsx` | **Modify** | Add hover-visible Re-apply button, inline replay status |
| `src/components/editor/rich/agent-chat/bubbles/ToolCallGroup.tsx` | **Modify** | Add group-level Re-apply all button, aggregate status display |
| `src/components/editor/rich/agent-chat/bubbles/DiffReviewBubble.tsx` | **Modify** | Add batch-level Re-apply button, aggregate status display |

---

### Task 1: Create the replay composable — types and state

**Files:**
- Create: `src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts`

- [ ] **Step 1: Create the file with types and state management**

```tsx
import { reactive } from 'vue'
import type {
  AgentOperation,
  ReviewBatch,
  ToolCallGroupItem,
} from '@haklex/rich-agent-core'
import type { LexicalEditor } from 'lexical'

export type ReplayStatus = 'idle' | 'running' | 'success' | 'conflict' | 'error'

export interface ReplayStateEntry {
  status: ReplayStatus
  message?: string
  finishedAt?: number
  summary?: {
    succeeded: number
    conflicted: number
    failed: number
    total: number
  }
}

export type ReplayStateMap = Record<string, ReplayStateEntry | undefined>

export function itemReplayKey(itemId: string): string {
  return `tool:${itemId}`
}

export function groupReplayKey(groupId: string): string {
  return `group:${groupId}`
}

export function batchReplayKey(batchId: string): string {
  return `batch:${batchId}`
}

const SUCCESS_CLEAR_MS = 3000

export interface UseReapplyOptions {
  getEditor: () => LexicalEditor | null
  getReviewBatch: (batchId: string) => ReviewBatch | undefined
}

export function useReapply(options: UseReapplyOptions) {
  const replayState: ReplayStateMap = reactive({})

  function setEntry(key: string, entry: ReplayStateEntry) {
    replayState[key] = { ...entry }
    if (entry.status === 'success') {
      setTimeout(() => {
        if (replayState[key]?.status === 'success') {
          replayState[key] = undefined
        }
      }, SUCCESS_CLEAR_MS)
    }
  }

  function getEntry(key: string): ReplayStateEntry | undefined {
    return replayState[key]
  }

  return {
    replayState,
    setEntry,
    getEntry,
  }
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors related to `use-agent-reapply.ts`

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts
git commit -m "feat(reapply): add replay state types and composable skeleton"
```

---

### Task 2: Add compatibility check and single-item apply logic

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts`

- [ ] **Step 1: Add compatibility check and apply helpers**

Append to `use-agent-reapply.ts`, inside the `useReapply` function body (before `return`):

```tsx
  function isReplayableItem(item: ToolCallGroupItem): boolean {
    if (item.status !== 'completed') return false
    if (!item.result) return false
    try {
      const parsed = JSON.parse(item.result)
      if (!parsed?.op || !parsed?.op?.op) return false
      return ['insert', 'replace', 'delete'].includes(parsed.op.op)
    } catch {
      return false
    }
  }

  function extractOperation(item: ToolCallGroupItem): AgentOperation | null {
    if (!item.result) return null
    try {
      const parsed = JSON.parse(item.result)
      return parsed?.op ?? null
    } catch {
      return null
    }
  }

  function applyReplayItem(itemId: string, item: ToolCallGroupItem): void {
    const key = itemReplayKey(itemId)
    const editor = options.getEditor()
    if (!editor) {
      setEntry(key, { status: 'error', message: 'Editor not available' })
      return
    }

    const op = extractOperation(item)
    if (!op) {
      setEntry(key, { status: 'error', message: 'No valid operation payload' })
      return
    }

    setEntry(key, { status: 'running' })

    try {
      editor.update(
        () => {
          const result = applyOperation(op)
          setEntry(key, result)
        },
        { tag: 'reapply' },
      )
    } catch (err) {
      setEntry(key, {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
```

- [ ] **Step 2: Add the core `applyOperation` function**

Add this function above the `useReapply` export, as a module-level helper that runs inside a Lexical `editor.update()` callback:

```tsx
import { $getRoot, $parseSerializedNode } from 'lexical'

function $findBlockByBlockId(blockId: string): import('lexical').LexicalNode | null {
  const { $getState } = require('lexical')
  const { blockIdState } = require('@haklex/rich-editor')
  const root = $getRoot()
  for (const child of root.getChildren()) {
    if ($getState(child, blockIdState) === blockId) return child
  }
  return null
}

function stripBlockIdFromSerialized<
  T extends { $?: Record<string, unknown>; children?: unknown[] },
>(node: T): T {
  if (!node || typeof node !== 'object') return node
  const next = { ...node } as T & { $?: Record<string, unknown>; children?: unknown[] }
  if (next.$ && typeof next.$ === 'object') {
    const rest = { ...next.$ }
    delete rest.blockId
    if (Object.keys(rest).length === 0) delete next.$
    else next.$ = rest
  }
  if (Array.isArray(next.children)) {
    next.children = next.children.map((c) => stripBlockIdFromSerialized(c as any))
  }
  return next
}

function applyOperation(op: AgentOperation): ReplayStateEntry {
  const root = $getRoot()

  if (op.op === 'delete') {
    const target = $findBlockByBlockId(op.blockId)
    if (!target) return { status: 'conflict', message: 'Target block not found' }
    target.remove()
    return { status: 'success', finishedAt: Date.now() }
  }

  if (op.op === 'replace') {
    if (!op.node?.type) return { status: 'error', message: 'Missing node data' }
    const target = $findBlockByBlockId(op.blockId)
    if (!target) return { status: 'conflict', message: 'Target block not found' }
    target.replace($parseSerializedNode(stripBlockIdFromSerialized(op.node)))
    return { status: 'success', finishedAt: Date.now() }
  }

  if (op.op === 'insert') {
    if (!op.node?.type) return { status: 'error', message: 'Missing node data' }
    const newNode = $parseSerializedNode(stripBlockIdFromSerialized(op.node))

    if (op.position.type === 'root') {
      const idx = op.position.index ?? root.getChildrenSize()
      const children = root.getChildren()
      const clampedIdx = Math.min(idx, children.length)
      if (clampedIdx >= children.length) root.append(newNode)
      else children[clampedIdx].insertBefore(newNode)
      return { status: 'success', finishedAt: Date.now() }
    }

    const anchor = $findBlockByBlockId(op.position.blockId)
    if (!anchor) return { status: 'conflict', message: 'Insert anchor not found' }
    if (op.position.type === 'after') anchor.insertAfter(newNode)
    else anchor.insertBefore(newNode)
    return { status: 'success', finishedAt: Date.now() }
  }

  return { status: 'error', message: `Unknown op type: ${(op as any).op}` }
}
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors related to `use-agent-reapply.ts`

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts
git commit -m "feat(reapply): add compatibility check and single-item apply logic"
```

---

### Task 3: Add group and batch replay orchestration

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts`

- [ ] **Step 1: Add group replay method**

Add inside the `useReapply` function body (after `applyReplayItem`, before `return`):

```tsx
  function applyReplayGroup(groupId: string, items: ToolCallGroupItem[]): void {
    const key = groupReplayKey(groupId)
    const editor = options.getEditor()
    if (!editor) {
      setEntry(key, { status: 'error', message: 'Editor not available' })
      return
    }

    const replayableItems = items.filter(isReplayableItem)
    if (replayableItems.length === 0) {
      setEntry(key, { status: 'error', message: 'No replayable items' })
      return
    }

    setEntry(key, { status: 'running' })

    const summary = { succeeded: 0, conflicted: 0, failed: 0, total: replayableItems.length }

    try {
      editor.update(
        () => {
          for (const item of replayableItems) {
            const op = extractOperation(item)
            const itemKey = itemReplayKey(item.id)
            if (!op) {
              setEntry(itemKey, { status: 'error', message: 'No valid operation payload' })
              summary.failed++
              continue
            }

            const result = applyOperation(op)
            setEntry(itemKey, result)

            if (result.status === 'success') summary.succeeded++
            else if (result.status === 'conflict') summary.conflicted++
            else summary.failed++
          }
        },
        { tag: 'reapply' },
      )
    } catch (err) {
      summary.failed = summary.total - summary.succeeded - summary.conflicted
      setEntry(key, {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
        summary,
      })
      return
    }

    const groupStatus: ReplayStatus =
      summary.failed > 0 ? 'error' :
      summary.conflicted > 0 ? 'conflict' :
      'success'

    setEntry(key, {
      status: groupStatus,
      finishedAt: Date.now(),
      summary,
    })
  }
```

- [ ] **Step 2: Add batch replay method**

Add inside the `useReapply` function body (after `applyReplayGroup`, before `return`):

```tsx
  function applyReplayBatch(batchId: string): void {
    const key = batchReplayKey(batchId)
    const editor = options.getEditor()
    if (!editor) {
      setEntry(key, { status: 'error', message: 'Editor not available' })
      return
    }

    const batch = options.getReviewBatch(batchId)
    if (!batch || !batch.entries.length) {
      setEntry(key, { status: 'error', message: 'Batch not found or empty' })
      return
    }

    setEntry(key, { status: 'running' })

    const summary = { succeeded: 0, conflicted: 0, failed: 0, total: batch.entries.length }

    try {
      editor.update(
        () => {
          for (const entry of batch.entries) {
            const result = applyOperation(entry.op)

            if (result.status === 'success') summary.succeeded++
            else if (result.status === 'conflict') summary.conflicted++
            else summary.failed++
          }
        },
        { tag: 'reapply' },
      )
    } catch (err) {
      summary.failed = summary.total - summary.succeeded - summary.conflicted
      setEntry(key, {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
        summary,
      })
      return
    }

    const batchStatus: ReplayStatus =
      summary.failed > 0 ? 'error' :
      summary.conflicted > 0 ? 'conflict' :
      'success'

    setEntry(key, {
      status: batchStatus,
      finishedAt: Date.now(),
      summary,
    })
  }
```

- [ ] **Step 3: Update the return object**

Replace the `return` at the end of `useReapply` with:

```tsx
  return {
    replayState,
    getEntry,
    isReplayableItem,
    applyReplayItem,
    applyReplayGroup,
    applyReplayBatch,
  }
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors related to `use-agent-reapply.ts`

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts
git commit -m "feat(reapply): add group and batch replay orchestration"
```

---

### Task 4: Wire replay composable into RichEditorWithAgent

**Files:**
- Modify: `src/components/editor/rich/RichEditorWithAgent.tsx:264-487`

- [ ] **Step 1: Import and instantiate the composable**

In `RichEditorWithAgent.tsx`, add the import at the top (after existing agent-chat imports around line 58-59):

```tsx
import {
  useReapply,
  type ReplayStateMap,
} from './agent-chat/composables/use-agent-reapply'
```

Then inside the `setup` function (after `provideAgentStore(store)` around line 276), add:

```tsx
    const reapply = useReapply({
      getEditor: () => editorInstance,
      getReviewBatch: (batchId: string) => {
        const reviewState = store.getState().reviewState
        return reviewState?.batches.find(
          (b: { id: string }) => b.id === batchId,
        )
      },
    })
```

- [ ] **Step 2: Pass replay props to AgentChatPanel in the Teleport**

In the render function (around line 468-483), update the `AgentChatPanel` JSX to include the new props:

```tsx
            <AgentChatPanel
              providerGroups={props.providerGroups ?? []}
              selectedModel={props.selectedModel ?? null}
              replayState={reapply.replayState}
              isReplayableItem={reapply.isReplayableItem}
              onSend={handleSend}
              onAbort={handleAbort}
              onRetry={handleRetry}
              onAcceptBatch={handleAcceptBatch}
              onRejectBatch={handleRejectBatch}
              onReapplyItem={(itemId: string, item: any) =>
                reapply.applyReplayItem(itemId, item)
              }
              onReapplyGroup={(groupId: string, items: any[]) =>
                reapply.applyReplayGroup(groupId, items)
              }
              onReapplyBatch={(batchId: string) =>
                reapply.applyReplayBatch(batchId)
              }
              onSelectModel={(model: SelectedModel) =>
                props.onSelectModel?.(model)
              }
            />
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors (AgentChatPanel props will be added in the next task)

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/rich/RichEditorWithAgent.tsx
git commit -m "feat(reapply): wire replay composable into RichEditorWithAgent"
```

---

### Task 5: Thread replay props through AgentChatPanel and ChatMessageList

**Files:**
- Modify: `src/components/editor/rich/agent-chat/AgentChatPanel.tsx`
- Modify: `src/components/editor/rich/agent-chat/ChatMessageList.tsx`

- [ ] **Step 1: Add replay props and emits to AgentChatPanel**

In `AgentChatPanel.tsx`, add these imports at the top:

```tsx
import type { ReplayStateMap } from './composables/use-agent-reapply'
```

Add these to the `props` object:

```tsx
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
    isReplayableItem: {
      type: Function as PropType<(item: ToolCallGroupItem) => boolean>,
      default: undefined,
    },
```

Add `ToolCallGroupItem` to the existing `@haklex/rich-agent-core` import.

Add these to the `emits` array:

```tsx
    'reapplyItem',
    'reapplyGroup',
    'reapplyBatch',
```

Update the render return to pass new props to `ChatMessageList`:

```tsx
        <ChatMessageList
          bubbles={bubbles.value}
          getBatch={getBatch}
          replayState={props.replayState}
          isReplayableItem={props.isReplayableItem}
          onAcceptBatch={(id: string) => emit('acceptBatch', id)}
          onRejectBatch={(id: string) => emit('rejectBatch', id)}
          onReapplyItem={(itemId: string, item: ToolCallGroupItem) =>
            emit('reapplyItem', itemId, item)
          }
          onReapplyGroup={(groupId: string, items: ToolCallGroupItem[]) =>
            emit('reapplyGroup', groupId, items)
          }
          onReapplyBatch={(batchId: string) => emit('reapplyBatch', batchId)}
          onRetry={() => emit('retry')}
        />
```

- [ ] **Step 2: Add replay props and emits to ChatMessageList**

In `ChatMessageList.tsx`, add the import:

```tsx
import type { ReplayStateMap } from './composables/use-agent-reapply'
```

Add these to `props`:

```tsx
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
    isReplayableItem: {
      type: Function as PropType<(item: ToolCallGroupItem) => boolean>,
      default: undefined,
    },
```

Add these to `emits`:

```tsx
    'reapplyItem',
    'reapplyGroup',
    'reapplyBatch',
```

Update the `tool_call_group_view` case in the render to pass replay props:

```tsx
              case 'tool_call_group_view':
                return (
                  <ToolCallGroup
                    key={i}
                    id={item.id}
                    items={item.items}
                    replayState={props.replayState}
                    isReplayableItem={props.isReplayableItem}
                    onReapplyItem={(itemId: string, item: ToolCallGroupItem) =>
                      emit('reapplyItem', itemId, item)
                    }
                    onReapplyGroup={(groupId: string, items: ToolCallGroupItem[]) =>
                      emit('reapplyGroup', groupId, items)
                    }
                  />
                )
```

Update the `diff_review` case to pass replay props:

```tsx
              case 'diff_review': {
                const batch = props.getBatch?.(item.batchId)
                if (!batch) return null
                return (
                  <DiffReviewBubble
                    key={i}
                    batch={batch}
                    replayState={props.replayState}
                    onAccept={(id: string) => emit('acceptBatch', id)}
                    onReject={(id: string) => emit('rejectBatch', id)}
                    onReapplyBatch={(id: string) => emit('reapplyBatch', id)}
                  />
                )
              }
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/rich/agent-chat/AgentChatPanel.tsx src/components/editor/rich/agent-chat/ChatMessageList.tsx
git commit -m "feat(reapply): thread replay props through AgentChatPanel and ChatMessageList"
```

---

### Task 6: Add Re-apply UI to ToolCall component

**Files:**
- Modify: `src/components/editor/rich/agent-chat/bubbles/ToolCall.tsx`

- [ ] **Step 1: Add imports and props**

Add to the existing imports:

```tsx
import { RotateCw } from 'lucide-vue-next'
import type { ReplayStateMap } from '../composables/use-agent-reapply'
import { itemReplayKey } from '../composables/use-agent-reapply'
```

Update the component props:

```tsx
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
```

- [ ] **Step 2: Add the inline replay status and button**

Inside the `setup` return function, after the existing `duration` computation and before the `return (` JSX block, add:

```tsx
      const rKey = itemReplayKey(item.id)
      const rState = props.replayState?.[rKey]
      const isReplayRunning = rState?.status === 'running'
```

Then, in the JSX button row (the `<button>` that is the main clickable row), insert the re-apply action and status **between** the copy button and the chevron. Find the `<span role="button" ... title="复制此 tool call JSON">` section and add this block **after** it and **before** the `{hasContent && (<ChevronRight .../>)}`:

```tsx
            {props.isReplayable && (
              <>
                {rState?.status === 'success' && (
                  <span class="flex-shrink-0 text-xs text-green-600">
                    Re-applied
                  </span>
                )}
                {rState?.status === 'conflict' && (
                  <span class="flex-shrink-0 text-xs text-amber-600" title={rState.message}>
                    Conflict
                  </span>
                )}
                {rState?.status === 'error' && (
                  <span class="flex-shrink-0 text-xs text-red-600" title={rState.message}>
                    Failed
                  </span>
                )}
                {(!rState || rState.status === 'idle') && (
                  <span
                    role="button"
                    tabindex={0}
                    title="Re-apply this tool call"
                    class="flex h-5 flex-shrink-0 cursor-pointer items-center gap-1 rounded px-1 text-xs text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 group-hover/toolcall:opacity-60 hover:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
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
```

- [ ] **Step 3: Show conflict/error detail in expanded area**

After the existing expanded content sections (`params`, `result`, `error`), add a replay-specific detail section:

```tsx
              {rState && (rState.status === 'conflict' || rState.status === 'error') && rState.message && (
                <Section
                  label="replay"
                  text={rState.message}
                  tone={rState.status === 'error' ? 'error' : undefined}
                />
              )}
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/rich/agent-chat/bubbles/ToolCall.tsx
git commit -m "feat(reapply): add Re-apply UI to ToolCall component"
```

---

### Task 7: Add Re-apply all UI to ToolCallGroup component

**Files:**
- Modify: `src/components/editor/rich/agent-chat/bubbles/ToolCallGroup.tsx`

- [ ] **Step 1: Add imports and props**

Add to imports:

```tsx
import { Loader2 as GroupLoader, RotateCw } from 'lucide-vue-next'
import type { ReplayStateMap } from '../composables/use-agent-reapply'
import { groupReplayKey } from '../composables/use-agent-reapply'
```

Update the component definition:

```tsx
  props: {
    id: { type: String, required: true },
    items: { type: Array as PropType<ToolCallGroupItem[]>, required: true },
    defaultExpanded: { type: Boolean, default: true },
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
    isReplayableItem: {
      type: Function as PropType<(item: ToolCallGroupItem) => boolean>,
      default: undefined,
    },
  },
  emits: ['reapplyItem', 'reapplyGroup'],
```

- [ ] **Step 2: Add group-level replay button and status in the header**

Inside the `setup` function, add computed values:

```tsx
    const hasReplayable = computed(
      () => props.isReplayableItem && props.items.some(props.isReplayableItem),
    )
    const groupRKey = computed(() => groupReplayKey(props.id))
    const groupRState = computed(() => props.replayState?.[groupRKey.value])
```

In the group header JSX (the `<button>` row), insert between the copy button and the `<ChevronRight>`:

```tsx
            {hasReplayable.value && (
              <>
                {groupRState.value?.summary && (
                  <span class="flex-shrink-0 text-xs text-neutral-400">
                    {formatGroupSummary(groupRState.value.summary)}
                  </span>
                )}
                {groupRState.value?.status === 'running' && (
                  <span class="flex flex-shrink-0 items-center">
                    <GroupLoader size={12} class="animate-spin text-neutral-400" />
                  </span>
                )}
                {(!groupRState.value || groupRState.value.status === 'idle') && (
                  <span
                    role="button"
                    tabindex={0}
                    title="Re-apply all tool calls"
                    class="flex h-5 flex-shrink-0 cursor-pointer items-center gap-1 rounded px-1 text-xs text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-60 hover:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation()
                      emit('reapplyGroup', props.id, props.items)
                    }}
                  >
                    <RotateCw size={11} />
                    Re-apply all
                  </span>
                )}
              </>
            )}
```

- [ ] **Step 3: Add the summary formatter**

Add as a module-level function:

```tsx
function formatGroupSummary(summary: { succeeded: number; conflicted: number; failed: number; total: number }): string {
  const parts: string[] = [`${summary.succeeded}/${summary.total} reapplied`]
  if (summary.conflicted > 0) parts.push(`${summary.conflicted} conflicted`)
  if (summary.failed > 0) parts.push(`${summary.failed} failed`)
  return parts.join(', ')
}
```

- [ ] **Step 4: Pass replay props to each ToolCall in the expanded list**

Update the expanded list rendering to pass props:

```tsx
          {expanded.value && (
            <div class="min-w-0 max-w-full pl-4 pt-0.5">
              {props.items.map((item) => (
                <ToolCall
                  item={item}
                  key={item.id}
                  replayState={props.replayState}
                  isReplayable={!!props.isReplayableItem?.(item)}
                  onReapply={() => emit('reapplyItem', item.id, item)}
                />
              ))}
            </div>
          )}
```

- [ ] **Step 5: Handle single-item delegation for groups of 1**

Update the single-item case to pass replay props:

```tsx
      if (props.items.length === 1) {
        const item = props.items[0]
        return (
          <ToolCall
            item={item}
            replayState={props.replayState}
            isReplayable={!!props.isReplayableItem?.(item)}
            onReapply={() => emit('reapplyItem', item.id, item)}
          />
        )
      }
```

- [ ] **Step 6: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/components/editor/rich/agent-chat/bubbles/ToolCallGroup.tsx
git commit -m "feat(reapply): add Re-apply all UI to ToolCallGroup"
```

---

### Task 8: Add Re-apply UI to DiffReviewBubble

**Files:**
- Modify: `src/components/editor/rich/agent-chat/bubbles/DiffReviewBubble.tsx`

- [ ] **Step 1: Add imports and props**

Add imports:

```tsx
import { Loader2, RotateCw } from 'lucide-vue-next'
import type { ReplayStateMap } from '../composables/use-agent-reapply'
import { batchReplayKey } from '../composables/use-agent-reapply'
```

Add to props:

```tsx
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
```

Add to emits (alongside existing `'accept'` and `'reject'`):

```tsx
  emits: ['accept', 'reject', 'reapplyBatch'],
```

- [ ] **Step 2: Add replay state computation and the Re-apply button**

Inside the `setup` return function, before the JSX, add:

```tsx
      const rKey = batchReplayKey(batch.id)
      const rState = props.replayState?.[rKey]
```

In the header action area, after the `Reject` button (inside the `isActionable` conditional) but also as a standalone when not actionable, add the Re-apply button. Replace the entire header actions area with:

```tsx
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
                  {rState.summary.succeeded}/{rState.summary.total} reapplied, {rState.summary.conflicted} conflicted
                </span>
              )}
              {rState?.status === 'error' && (
                <span class="text-xs text-red-600" title={rState.message}>
                  Failed{rState.summary ? ` (${rState.summary.succeeded}/${rState.summary.total})` : ''}
                </span>
              )}
              {(!rState || rState.status === 'idle' || rState.status === 'success' || rState.status === 'conflict' || rState.status === 'error') && rState?.status !== 'running' && (
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
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/rich/agent-chat/bubbles/DiffReviewBubble.tsx
git commit -m "feat(reapply): add Re-apply UI to DiffReviewBubble"
```

---

### Task 9: Refine import structure and fix module-level helpers

**Files:**
- Modify: `src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts`

The `$findBlockByBlockId` and `stripBlockIdFromSerialized` helpers in `use-agent-reapply.ts` use `require()` calls which won't work in ESM. These must use static imports instead.

- [ ] **Step 1: Fix imports to use ESM static imports**

Replace the `require()`-based `$findBlockByBlockId` with proper static imports at the top of the file:

```tsx
import { $getRoot, $getState, $parseSerializedNode } from 'lexical'
import { blockIdState } from '@haklex/rich-editor'
```

And the `$findBlockByBlockId` function becomes:

```tsx
function $findBlockByBlockId(blockId: string): import('lexical').LexicalNode | null {
  const root = $getRoot()
  for (const child of root.getChildren()) {
    if ($getState(child, blockIdState) === blockId) return child
  }
  return null
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts
git commit -m "fix(reapply): use ESM static imports in replay composable"
```

---

### Task 10: Manual verification and final cleanup

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: PASS (zero errors)

- [ ] **Step 2: Run linter**

Run: `pnpm lint:fix`
Expected: No new lint errors

- [ ] **Step 3: Manual verification — single tool call Re-apply**

1. Open a post/note in the editor with the agent panel visible
2. Run an agent conversation that produces tool calls
3. Hover a completed tool call — confirm `Re-apply` button appears next to the copy button
4. Click `Re-apply` — confirm inline spinner, then `Re-applied` success state
5. Confirm the edit was applied to the editor
6. Confirm no new chat bubble was created

- [ ] **Step 4: Manual verification — group Re-apply all**

1. Find a tool call group with multiple completed items
2. Confirm `Re-apply all` appears in the group header on hover
3. Click `Re-apply all` — confirm inline progress, then aggregate summary (`N/N reapplied`)
4. Delete a block the group references, then try `Re-apply all` again
5. Confirm partial result: `X/N reapplied, Y conflicted`

- [ ] **Step 5: Manual verification — diff batch Re-apply**

1. Find a diff review bubble
2. Confirm `Re-apply` button appears (visually lighter than Accept/Reject)
3. Click `Re-apply` — confirm inline progress and success state
4. Accept the batch first, then click `Re-apply` — confirm it still works (re-execution, not idempotent)

- [ ] **Step 6: Manual verification — conflict and error states**

1. Delete a block referenced by a completed tool call
2. Click `Re-apply` — confirm `Conflict` state appears inline
3. Expand the tool call — confirm `Target block not found` in the replay section
4. Confirm conflict state persists (does not auto-clear)

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(reapply): complete agent chat re-apply interaction"
```
