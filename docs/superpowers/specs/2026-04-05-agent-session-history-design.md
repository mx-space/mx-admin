# Agent Session History — Design Spec

## Problem

The AI Agent chat panel in the rich editor loses all conversation state on page refresh. The backend (mx-core) already persists conversations, but the frontend never hydrates them back. There is also no UI for browsing, switching, or managing multiple agent sessions per article.

## Requirements

1. One article can have **multiple independent** agent conversation sessions.
2. Any historical session can be **continued** (not read-only).
3. Session switch performs **full restore** — messages, `reviewState`, pending accept/reject diffs.
4. UI entry: **header bar** at top of the Agent chat panel with a dropdown session switcher.
5. Open editor → **restore most recent session**; manual "+" to create new.
6. **AI-generated session titles**, user can manually edit.
7. Sessions can be **deleted**.

## Architecture

### Backend Changes (mx-core)

#### Schema — `AIAgentConversationModel`

Add two optional fields:

```typescript
@prop({ type: () => mongoose.Schema.Types.Mixed })
reviewState?: Record<string, unknown>

@prop({ type: () => mongoose.Schema.Types.Mixed })
diffState?: Record<string, unknown>
```

Existing fields unchanged: `refId`, `refType`, `title?`, `messages` (Mixed[]), `model`, `providerId`, `created`, `updated`.

#### New Endpoint

| Method | Path | Body | Purpose |
|--------|------|------|---------|
| `PATCH` | `/ai/agent/conversations/:id` | `{ title?, reviewState?, diffState? }` | Partial update of conversation metadata/state |

Existing endpoints unchanged: `POST` create, `GET` list, `GET` detail, `PATCH .../messages` append, `DELETE`.

#### Zod Schema Addition

```typescript
export const UpdateConversationSchema = z.object({
  title: z.string().optional(),
  reviewState: z.record(z.string(), z.unknown()).nullable().optional(),
  diffState: z.record(z.string(), z.unknown()).nullable().optional(),
})
```

#### Service Addition — `updateById`

```typescript
async updateById(id: string, data: { title?: string; reviewState?: Record<string, unknown> | null; diffState?: Record<string, unknown> | null }) {
  const $set: Record<string, unknown> = { updated: new Date() }
  if (data.title !== undefined) $set.title = data.title
  if (data.reviewState !== undefined) $set.reviewState = data.reviewState
  if (data.diffState !== undefined) $set.diffState = data.diffState

  const result = await this.conversationModel.findByIdAndUpdate(
    id,
    { $set },
    { returnDocument: 'after', projection: { messages: 0 }, lean: true },
  )
  if (!result) throw new BizException(ErrorCodeEnum.ContentNotFoundCantProcess, 'Conversation not found')
  return result
}
```

#### Title Generation

Triggered in `appendMessages` when `title` is null and new messages contain an assistant-type bubble:

1. Extract the first user message + first assistant response from the conversation.
2. Use the conversation's own `model` and `providerId` fields to resolve the LLM provider (same provider the user chose for the agent session).
3. Call with system prompt: "用 10 字以内概括这段对话的主题，只返回标题文字".
4. Write generated title to the document asynchronously (fire-and-forget, does not block the append response).
5. Manual title edits via `PATCH /:id` bypass generation; once `title` is non-null, generation is never re-triggered.

### Frontend Changes (admin-vue3)

#### API Client — `src/api/ai-agent.ts`

Add `updateConversation` method:

```typescript
updateConversation: (id: string, data: {
  title?: string
  reviewState?: Record<string, unknown> | null
  diffState?: Record<string, unknown> | null
}) => request.patch<AgentConversation>(`/ai/agent/conversations/${id}`, { data }),
```

Update `AgentConversation` interface to include `reviewState?` and `diffState?` fields.

#### New Composable — `use-session-manager.ts`

Replaces `use-conversation-sync.ts`. Location: `src/components/editor/rich/agent-chat/composables/use-session-manager.ts`.

**Reactive State:**

| Name | Type | Description |
|------|------|-------------|
| `sessions` | `Ref<SessionMeta[]>` | All sessions for current refId (id, title, updated, messageCount) |
| `activeSessionId` | `Ref<string \| null>` | Currently active session |
| `isHydrating` | `Ref<boolean>` | True during store hydration |
| `isLoading` | `Ref<boolean>` | True during session list loading |

**Methods:**

| Method | Behavior |
|--------|----------|
| `loadSessions()` | `GET /conversations?refId&refType`, populate `sessions` |
| `switchSession(id)` | Abort agent loop → `store.reset()` → fetch detail → hydrate bubbles + reviewState + diffState → set `lastSyncedLength` |
| `createSession()` | Mark local "pending creation" state; actual `POST` on first user message (lazy) |
| `deleteSession(id)` | `DELETE /conversations/:id`; if active, switch to next; if list empty, reset to empty store |
| `renameSession(id, title)` | `PATCH /conversations/:id { title }` |

**Hydration Flow (inside `switchSession`):**

1. `abort()` — terminate in-flight SSE.
2. `isHydrating = true`.
3. `store.reset()` — clear all state.
4. `GET /conversations/:id` — fetch full detail including messages, reviewState, diffState.
5. Validate and filter `messages` to legal `ChatBubble[]`; normalize `streaming`/`isStreaming` to `false`; drop unknown types.
6. `store.setState({ bubbles: validatedBubbles, status: 'idle' })`.
7. If `reviewState` exists → `store.getState().setReviewState(reviewState)` (passes through sanitization in `use-agent-loop.ts`).
8. If `diffState` exists → `store.getState().setDiffState(diffState)` (passes through sanitization + function reconstruction via `sanitizeDiffState`).
9. `lastSyncedLength = validatedBubbles.length`.
10. `isHydrating = false` — subscription resumes.

**Sync Guards:**

- Subscription: `if (isHydrating) return` prevents re-appending restored bubbles to server.
- `sessionEpoch` counter: incremented on every `switchSession`; stale async responses check epoch and discard if mismatched.
- reviewState/diffState sync: `debounce(2000)` on PATCH to avoid high-frequency updates.
- Uses `aiAgentApi` (typed client) instead of raw fetch.

**refId Watch:**

New articles start without `refId`. Watch for `refId` becoming available (after first autosave creates a draft), then trigger initial `loadSessions()`.

#### New Component — `SessionHeader.tsx`

Location: `src/components/editor/rich/agent-chat/SessionHeader.tsx`.

**Layout (36px header bar):**

```
┌─────────────────────────────────────────┐
│  ● Session Title ▼          [+] [🗑]   │
└─────────────────────────────────────────┘
```

- **Left:** Current session title (clickable, triggers dropdown) + chevron icon.
  - Double-click to inline-edit title → `renameSession()` on blur/Enter.
- **Right:** "+" icon button (new session) + trash icon button (delete current, with popconfirm).

**Dropdown Session List (NPopover or custom):**

- Each item: title (or "未命名对话"), relative timestamp, message count.
- Active session highlighted.
- Sorted by `updated` desc.
- Empty state: "暂无历史对话".
- Click item → `switchSession(id)`, close dropdown.

**Style:**

- `border-b border-neutral-200 dark:border-neutral-700` bottom border.
- Title: `text-xs` font-weight 600.
- Icons: consistent with existing editor toggle buttons.
- Dark mode support via existing neutral palette.

#### Integration — `AgentChatPanel.tsx`

Insert `SessionHeader` before `ChatMessageList`:

```tsx
<div class="flex h-full min-h-0 flex-col overflow-hidden text-sm">
  <SessionHeader
    sessions={props.sessions}
    activeSessionId={props.activeSessionId}
    isLoading={props.isLoading}
    onSwitchSession={...}
    onCreateSession={...}
    onDeleteSession={...}
    onRenameSession={...}
  />
  <ChatMessageList ... />
  <ChatInput ... />
</div>
```

#### Integration — `RichEditorWithAgent.tsx`

- Replace `useConversationSync()` with `useSessionManager()`.
- Pass session-related state and methods down to `AgentChatPanel` as props.
- During `isHydrating`, show loading state in the chat area (skeleton or centered spinner).

### Session Lifecycle

#### Startup (opening article editor)

1. `RichEditorWithAgent` mounts → `useSessionManager` initializes.
2. If `refId` exists → `loadSessions()`.
3. List non-empty → `switchSession(list[0].id)` (most recent).
4. List empty → empty store, await first user message for lazy creation.
5. `refId` absent (new article) → skip; watch for refId to appear.

#### Lazy Session Creation

1. User sends first message → `addBubble({ type: 'user', ... })`.
2. Subscription detects `activeSessionId === null`.
3. `POST /conversations` with `{ refId, refType, model, providerId, messages: [firstBubble] }`.
4. Response `id` becomes `activeSessionId`; `sessions` list updated.

#### Session Switching

1. User selects session from dropdown → `switchSession(id)`.
2. Full hydration flow (see above).
3. Lexical editor content is **not** touched — article content is independent of agent sessions.
4. DiffReviewOverlay clears on `store.reset()`, reappears if new session has pending reviews.

#### Session Deletion

- Deleting active session → switch to next in list; if list empties → empty store.
- Deleting non-active session → remove from list, no other effect.
- Popconfirm required for deletion.

#### Error Handling

- Network failure on sync → silent failure, does not block local editing.
- Session list load failure → "加载失败，点击重试" in SessionHeader.
- Hydration failure → fall back to empty store, toast notification.

### Files Changed

#### mx-core (backend)

| File | Change |
|------|--------|
| `apps/core/src/modules/ai/ai-agent/ai-agent-conversation.model.ts` | Add `reviewState`, `diffState` fields |
| `apps/core/src/modules/ai/ai-agent/ai-agent-conversation.service.ts` | Add `updateById` method |
| `apps/core/src/modules/ai/ai-agent/ai-agent.controller.ts` | Add `PATCH /conversations/:id` endpoint |
| `apps/core/src/modules/ai/ai-agent/ai-agent.schema.ts` | Add `UpdateConversationSchema` + DTO |
| `apps/core/src/modules/ai/ai-agent/ai-agent-conversation.service.ts` | Add title generation logic in `appendMessages` |

#### admin-vue3 (frontend)

| File | Change |
|------|--------|
| `src/api/ai-agent.ts` | Add `updateConversation`, update types |
| `src/components/editor/rich/agent-chat/composables/use-session-manager.ts` | **New file** — replaces `use-conversation-sync.ts` |
| `src/components/editor/rich/agent-chat/composables/use-conversation-sync.ts` | **Delete** (replaced by session manager) |
| `src/components/editor/rich/agent-chat/SessionHeader.tsx` | **New file** — session switcher UI |
| `src/components/editor/rich/agent-chat/AgentChatPanel.tsx` | Add SessionHeader, accept session props |
| `src/components/editor/rich/RichEditorWithAgent.tsx` | Replace `useConversationSync` with `useSessionManager`, pass session state to panel |
| `src/views/manage-posts/write.tsx` | No change (session managed inside RichEditorWithAgent) |
| `src/views/manage-notes/write.tsx` | No change |
