# Agent Chat Re-Apply Interaction

**Date**: 2026-04-05
**Scope**: admin-vue3 repo only
**Stack**: Vue 3 TSX (defineComponent + JSX), `@haklex/rich-agent-core`, Lexical editor integration in `RichEditorWithAgent.tsx`

## Overview

Add an in-place `re-apply` interaction to the agent chat so the user can re-run previously completed edit actions without creating a new chat flow.

The feature must support three replay targets:

1. **Single tool call** — replay one completed `ToolCallGroupItem`
2. **Whole tool-call group** — replay all completed items in a `tool_call_group`
3. **Diff batch** — re-apply one previously generated `ReviewBatch`

The user-selected interaction model is **Option A: direct in-place replay**:

- `Re-apply` appears directly on the existing bubble UI
- replay runs from the current chat surface, not a tray and not a new bubble type
- replay operates against the **current editor state**
- when replay cannot safely target the current document, the UI shows **conflict** or **error** inline rather than silently falling back to a fresh agent run

## Goals

- Make replay feel like a local action on an existing result, not a new agent session
- Keep the current chat layout and bubble model intact
- Reuse existing editor-apply logic where possible, especially the current batch-accept flow
- Surface replay progress and failure inline at the exact action origin
- Allow partial success for group and batch replay

## Non-Goals

- No replay queue / tray
- No new chat bubble type such as "Replay request"
- No silent fallback to "ask the agent again"
- No attempt to preserve the original document snapshot and fully reproduce historical output
- No unrelated refactor of the agent loop architecture

## Interaction Model

### Single Tool Call

**File**: `src/components/editor/rich/agent-chat/bubbles/ToolCall.tsx`

Behavior:

- Add a hover-visible `Re-apply` action next to the existing copy affordance
- Only show the action for replayable completed items
- Clicking starts replay immediately
- While replay is running:
  - disable the action
  - show spinner / running state inline
- On success:
  - show a transient `Re-applied` success state inline
- On compatibility failure:
  - show `Conflict` inline
  - expanding the item may show the reason text if needed
- On execution failure:
  - show `Failed` inline with error details available in the expanded area

### Tool Call Group

**File**: `src/components/editor/rich/agent-chat/bubbles/ToolCallGroup.tsx`

Behavior:

- Add a group-level `Re-apply all` action in the group header
- Keep per-item `Re-apply` actions available inside the expanded list
- Group replay executes items in original order
- Group completion is aggregated and displayed in the header:
  - `18/18 reapplied`
  - `12/18 reapplied, 6 conflicted`
  - `9/18 reapplied, 3 conflicted, 6 failed`
- One conflicted item must not block all later items from attempting replay

### Diff Batch

**File**: `src/components/editor/rich/agent-chat/bubbles/DiffReviewBubble.tsx`

Behavior:

- Add a batch-level `Re-apply` action in the existing header action area
- Keep `Accept` / `Reject` as the primary actions; `Re-apply` is visually weaker
- Replay here means **apply this batch's entries to the current editor state again**
- Batch replay returns aggregate result similar to group replay:
  - full success
  - partial success with conflicts
  - failed
- If the current document drift makes some entries unsafe, show a warning / conflict state inline in the batch header

## Replay Semantics

Replay always targets the **current editor state**, not the historical snapshot from the original run.

### Why

- The user explicitly chose a hybrid/current-state-first model
- The chat UI should help continue editing the current document, not restore history
- Historical full reproduction would require storing and restoring older editor snapshots, which is outside this feature's scope

### Allowed Outcomes

Each replay target resolves to one of:

- `success` — operation applied cleanly to current state
- `conflict` — target anchor no longer matches current state, so replay was intentionally skipped
- `error` — replay attempted but failed due to runtime or parse/apply error

For groups and batches, the final result is aggregated from per-entry outcomes.

### No Silent Fallback

If replay cannot safely operate on the current document, the system must **not** silently:

- ask the model to regenerate the result
- create a fresh agent run
- mutate the original bubble history

Instead it should surface the conflict inline and preserve the original record as history.

## Compatibility Check

Compatibility check runs before each individual replay operation.

### Replace / Delete

- Use the original `blockId`
- If the block is still present, replay may proceed
- If the block is missing, mark the item as `conflict`

### Insert

- Re-resolve the insertion anchor from the original position metadata
- Root-position insertions remain replayable by clamping the original index into the current root child range
- Relative insertions (`before` / `after`) require the referenced block to still exist
- Missing anchor becomes `conflict`

### Idempotency

Replay is intentionally a **re-execution** of the original operation, not an idempotent deduped apply.

Implications:

- replaying an `insert` may insert another block if its anchor still exists
- replaying a previously accepted batch is allowed, but it may produce a different result than the first apply because the document has already changed
- the system should report what happened; it should not silently suppress a valid second insertion just because a similar edit happened before

### Batch Entries

- Evaluate each batch entry independently
- Some entries may succeed while others conflict
- The batch-level result is only `success` when every entry succeeds

## Architecture and Boundaries

### Rendering Layer

**Files**:

- `src/components/editor/rich/agent-chat/ChatMessageList.tsx`
- `src/components/editor/rich/agent-chat/bubbles/ToolCall.tsx`
- `src/components/editor/rich/agent-chat/bubbles/ToolCallGroup.tsx`
- `src/components/editor/rich/agent-chat/bubbles/DiffReviewBubble.tsx`

Responsibilities:

- Render replay actions
- Render inline replay state: idle / running / success / conflict / error
- Emit replay intents upward

The rendering layer must **not**:

- touch the Lexical editor directly
- mutate agent store history
- implement replay logic itself

### Orchestration Layer

**File**: `src/components/editor/rich/RichEditorWithAgent.tsx`

Responsibilities:

- own the unified replay entry points:
  - `handleReapplyItem(itemId | item)`
  - `handleReapplyGroup(groupId | items)`
  - `handleReapplyBatch(batchId)`
- run compatibility checks
- apply editor mutations
- aggregate group and batch results
- update replay UI state

Why this layer:

- it already owns editor access
- it already applies accepted review batches
- replay is an editor-side reapplication concern, not a model execution concern

### Agent Loop Composable

**File not targeted**: `src/components/editor/rich/agent-chat/composables/use-agent-loop.ts`

Do **not** move replay into the agent loop composable in this phase.

Reason:

- replay is not a fresh model inference flow
- the existing `retry()` behavior already represents "send the last user message again"
- mixing local replay and remote agent rerun inside the same abstraction would blur semantics

## State Model

Add a lightweight replay state map owned by `RichEditorWithAgent.tsx`.

Suggested shape:

```typescript
type ReplayStatus = 'idle' | 'running' | 'success' | 'conflict' | 'error'

interface ReplayStateEntry {
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

type ReplayStateMap = Record<string, ReplayStateEntry | undefined>
```

Stable keys:

- `tool:<item.id>`
- `group:<group.id>`
- `batch:<batch.id>`

Rules:

- UI state is separate from bubble history
- success may be transient and auto-clear after a short timeout
- conflict and error should remain visible until replay is attempted again or the panel is rerendered
- group and batch entries may store aggregate `summary`

## Replayability Rules

Only replay actions that are deterministic editor applications should expose `Re-apply`.

### Tool Calls

Replayable:

- completed edit-like tool calls that still map to a known operation payload

Not replayable:

- running items
- errored items without valid operation payload
- items that are display-only or lack sufficient data to reconstruct the operation

If some legacy tool-call items do not contain enough structured data to replay safely, hide `Re-apply` for those items.

### Groups

- `Re-apply all` should appear only if the group contains at least one replayable item
- non-replayable items are skipped and counted separately only if needed in the final summary text

### Batches

- a batch is replayable when its `entries` are still available
- replay works regardless of whether the batch was previously accepted or still pending

## Execution Flow

### Single Item Replay

1. User clicks `Re-apply`
2. UI key `tool:<id>` becomes `running`
3. Resolve the underlying operation payload
4. Run compatibility check against current editor state
5. If compatible, apply to Lexical editor
6. Update entry to:
  - `success`, or
  - `conflict`, or
  - `error`

### Group Replay

1. User clicks `Re-apply all`
2. UI key `group:<id>` becomes `running`
3. Iterate items in original order
4. Replay each item independently
5. Record per-item states and aggregate group summary
6. Update group-level state when all items finish

### Batch Replay

1. User clicks batch `Re-apply`
2. UI key `batch:<id>` becomes `running`
3. Iterate batch entries in order
4. Run compatibility check per entry
5. Apply compatible entries
6. Aggregate final summary and expose inline result

## Error Handling

### Conflict

Conflict is a first-class outcome, not a generic error.

Typical causes:

- referenced block no longer exists
- insert anchor disappeared
- current document order changed enough that the original anchor no longer makes sense

UI treatment:

- inline `Conflict` state near the replay control
- optional short message such as `Target block not found`
- for group / batch: aggregate counts in header plus per-item local state when visible

### Error

Error means replay should have been possible but failed during execution.

Examples:

- node parse error
- unexpected malformed operation payload
- editor update error

UI treatment:

- inline `Failed` state
- error details available in expanded content or local message

## Minimal File Changes

Expected touched files:

- `src/components/editor/rich/agent-chat/ChatMessageList.tsx`
- `src/components/editor/rich/agent-chat/bubbles/ToolCall.tsx`
- `src/components/editor/rich/agent-chat/bubbles/ToolCallGroup.tsx`
- `src/components/editor/rich/agent-chat/bubbles/DiffReviewBubble.tsx`
- `src/components/editor/rich/RichEditorWithAgent.tsx`

Optional helper extraction if implementation becomes too dense:

- `src/components/editor/rich/agent-chat/composables/use-agent-reapply.ts`

This helper is allowed only if it keeps `RichEditorWithAgent.tsx` smaller without moving replay semantics into the generic agent loop.

## Testing Strategy

Add focused tests around replay behavior instead of broad visual snapshot coverage.

Minimum automated coverage:

1. single-item replay succeeds when target block still exists
2. single-item replay returns conflict when target block is missing
3. group replay reports partial success when some items conflict
4. batch replay applies compatible entries and reports incompatible ones

Manual verification:

1. hover a completed tool call and trigger `Re-apply`
2. trigger `Re-apply all` on a group
3. trigger `Re-apply` on a diff batch
4. confirm inline running / success / conflict / failed states render at the original action location
5. confirm no new chat bubble is created

## Implementation Notes

- Reuse the current editor-apply logic from the existing batch accept path where possible
- Prefer shared helper functions for:
  - locating blocks
  - compatibility checking
  - applying insert / replace / delete
  - aggregating summaries
- Keep comments minimal and only where replay edge cases are not obvious

## Final Decision Summary

The chosen design is:

- **direct, in-place replay UI**
- **current-state-first replay semantics**
- **inline conflict/error reporting**
- **no tray**
- **no new replay bubble type**
- **no silent fallback to a fresh agent run**

