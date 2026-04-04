# Vue Agent Chat UI + Split Panel Layout

**Date**: 2026-04-04
**Scope**: admin-vue3 repo only
**Stack**: Vue 3 TSX (defineComponent + JSX), UnoCSS, Naive UI theme tokens, @haklex/rich-agent-core (Zustand vanilla API)

## Overview

Replace the React-bridge-based `RichAgentEditor.tsx` with native Vue components. Two deliverables:

1. **SplitPanel** — generic draggable split layout component
2. **AgentChatPanel** — full-featured agent chat UI, feature-parity with `@haklex/rich-agent-chat` React version

## 1. SplitPanel

**File**: `src/components/ui/SplitPanel.tsx`

### Props

```typescript
{
  defaultRatio?: number       // initial left-side ratio, default 0.6
  minLeft?: number            // left min width px, default 300
  minRight?: number           // right min width px, default 280
  collapsed?: boolean         // v-model, right panel collapsed
  collapseThreshold?: number  // auto-collapse below this width, default 100
  storageKey?: string         // localStorage persistence key (optional)
}
```

### Slots

- `left` — left pane content
- `right` — right pane content

### Behavior

- Drag via `pointerdown` → `pointermove` → `pointerup`, throttled with `requestAnimationFrame`
- Dragging right pane below `collapseThreshold` auto-collapses, emits `update:collapsed`
- When collapsed: left pane fills width, divider remains visible (narrow), click or drag to expand
- When `storageKey` provided: ratio persisted to localStorage
- Divider shows resize cursor on hover, subtle highlight on drag

### Styling

UnoCSS utilities + minimal scoped CSS for divider hover/active states and cursor.

## 2. useAgentStore Composable

**File**: `src/components/editor/rich/agent-chat/composables/use-agent-store.ts`

### API

```typescript
// Provide/inject the raw Zustand store
function provideAgentStore(store: AgentStore): void
function useAgentStore(): AgentStore

// Reactive selector — subscribes to Zustand store, returns Vue shallowRef
function useAgentStoreSelector<T>(selector: (state: AgentStoreSlice) => T): ShallowRef<T>
```

### Implementation

- `provideAgentStore` / `useAgentStore`: Vue `provide` / `inject` passing raw Zustand store reference
- `useAgentStoreSelector`: `store.subscribe()` + selector, compare with `Object.is`, update `shallowRef` on change. Unsubscribe in `onUnmounted`
- `shallowRef` (not `ref`) to avoid deep reactive proxy overhead on bubbles array

### What it does NOT do

- No action wrappers — components call `store.getState().addBubble()` etc. directly
- No Pinia involvement

## 3. Agent Chat Components

**Directory**: `src/components/editor/rich/agent-chat/`

### File Structure

```
agent-chat/
├── composables/
│   └── use-agent-store.ts
├── AgentChatPanel.tsx          # root, provides store, composes list + input
├── ChatMessageList.tsx         # renders bubble list by type
├── ChatInput.tsx               # textarea + status + abort button
├── ModelSelector.tsx           # model picker dropdown
└── bubbles/
    ├── UserBubble.tsx
    ├── StreamdownBubble.tsx
    ├── ThinkingChain.tsx
    ├── ToolCallGroup.tsx
    ├── ToolCall.tsx
    ├── DiffReviewBubble.tsx
    ├── DiffSummaryBubble.tsx
    └── ErrorBubble.tsx
```

### AgentChatPanel.tsx

Props (matching React ChatPanel):
- `store: AgentStore`
- `onSend: (message: string) => void`
- `onAbort: () => void`
- `onSelectModel: (selected: SelectedModel) => void`
- `providerGroups: ProviderGroup[]`
- `selectedModel: SelectedModel | null`
- `onAcceptBatch?: (batchId: string) => void`
- `onRejectBatch?: (batchId: string) => void`
- `onRetry?: () => void`

Internally calls `provideAgentStore(store)` so all children access store via inject.

### ChatMessageList.tsx

- Reads `useAgentStoreSelector(s => s.bubbles)`
- Switches on `bubble.type` to render corresponding bubble component
- Auto-scrolls to bottom on new messages; pauses when user scrolls up

### ChatInput.tsx

- Auto-resizing `<textarea>`
- Enter to send, Shift+Enter for newline
- Status indicator: idle → placeholder; running/thinking/writing → text + animation
- Abort button when running

### ModelSelector.tsx

- Naive UI `NPopselect` or `NDropdown`, grouped by `providerGroups`
- Shows current `selectedModel`, emits on selection

### Bubble Components

| Component | Description |
|---|---|
| UserBubble | Plain text, right-aligned |
| StreamdownBubble | Markdown rendering (reuse admin's existing markdown renderer), cursor animation while streaming |
| ThinkingChain | Collapsible, default collapsed. Steps list, last step animates while streaming |
| ToolCallGroup | Collapsible container with ToolCall list, completion count badge |
| ToolCall | Tool name + status icon (spinner/check/error) + expandable params/result |
| DiffReviewBubble | Diff entries with Accept/Reject buttons, calls parent callbacks |
| DiffSummaryBubble | Accepted/rejected/pending count summary |
| ErrorBubble | Red alert + retry button |

### Styling

All UnoCSS utilities. Use Naive UI theme tokens (`var(--n-text-color)`, `var(--n-border-color)`, etc.) for consistency.

## 4. Editor Page Integration

### RichEditorWithAgent.tsx

**File**: `src/components/editor/rich/RichEditorWithAgent.tsx`

Replaces `RichAgentEditor.tsx` as the main editor+agent view.

```
SplitPanel (v-model:collapsed, storageKey="editor-agent-split")
├── #left: RichEditorBridge (existing React bridge, unchanged)
└── #right: AgentChatPanel (new Vue component)
```

### Agent Logic Migration

Current `RichAgentEditor.tsx` calls `createAgentStore`, `createProvider`, `createAgentExecutor` via React bridge. These move to a Vue composable:

**File**: `src/components/editor/rich/agent-chat/composables/use-agent-executor.ts`

- Calls agent-core vanilla API directly (no React dependency)
- Manages store lifecycle, provider creation, executor invocation

### Deprecation

- `RichAgentEditor.tsx` (React bridge for agent chat) — removed
- React bridge for editor itself (`RichEditorBridge` / `RichEditor.tsx`) — kept as-is

### Toggle Button

Editor toolbar or page header gets a toggle button controlling `agentCollapsed`:
- Icon: `lucide-vue-next` `MessageSquare` or `PanelRightClose`
- Reflects collapsed state visually
