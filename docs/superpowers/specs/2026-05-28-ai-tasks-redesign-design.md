# /ai/tasks Layout Redesign — Design Spec

**Date:** 2026-05-28
**Surface:** `apps/admin/src/views/(system)/ai/tasks/page.tsx` → `apps/admin/src/features/ai/components/AiTasksSurface.tsx`
**Sibling reference:** `apps/admin/src/features/ai/components/article-grouped/*` (recently redesigned `/ai/{summary,translation,insights,translation-entries}`)

## Why

`/ai/tasks` is the only view under the `/ai/*` umbrella that was not refactored during the article-grouped master-detail redesign (commits `1c23798e`, `eebfd694`). It still uses the original layout with:

- A cluttered list-pane header (title + count + 2 buttons crammed in one row)
- A filter strip on a second row (status select + type select + reset button)
- A row pattern that mirrors the article-grouped style despite tasks not being article-grouped
- A flat detail body that lists eight unrelated blocks (error / progress / tokens / sub-task stats / 8-field grid / payload JSON / result JSON / logs) with no visual hierarchy
- A footer action bar duplicating context already present in the header
- No keyboard navigation, while sibling AI pages have full `useListKeyboard` wiring

Tasks are fundamentally different from the sibling AI surfaces. Tasks are runtime/transient records — they have a lifecycle (queued → started → running → completed/failed), a worker, retry attempts, and a log stream. The redesign treats tasks as **runtime objects**, not content objects, and reorganizes both list and detail panes around the timeline / runtime axis.

## Goals

1. **Higher information density in the list pane** — a runtime console feels closer to `tail -f` than to a CMS list. Aim for ~46px rows so 20+ tasks fit on a laptop screen.
2. **Timeline-first detail pane** — lifecycle and logs are the primary signal; payload/result/sub-task stats are secondary and collapsible.
3. **Reduce chrome** — actions belong at the page level (refresh, clear) and the detail header (retry, cancel, delete). The list pane keeps only filters and the row stream.
4. **Keyboard parity with sibling AI pages** — j/k/↑/↓ to traverse, Enter to focus, all wired via `useListKeyboard` (Case A).
5. **Preserve all current functionality** — filters, polling (5s `refetchInterval`), pagination, URL-sync of `id` / `page` / `status` / `type`, batch task affordances, sub-task stats display.

## Non-goals

- No new task types, no new task fields, no API changes.
- No bulk-select / bulk-delete (current "Clear Completed" is enough).
- No log search / log filtering (logs render as-is in reverse-chronological order).
- No real-time WebSocket — polling stays.

## Architecture

### Component tree (changed nodes marked `*`)

```
AiRouteViewContent
├─ PageHeader
│  ├─ actions: TabsRow + ContextualActions *      (new: actions slot per surface)
│  │            └─ when surface = tasks: <RefreshButton/> <ClearCompletedButton/>
│  └─ title + description
└─ {surface}Surface
    └─ AiTasksSurface *
        ├─ MasterDetailLayout
        │   ├─ list:    <TaskListPane/> *         (new file)
        │   └─ detail:  <TaskDetailPane/> *       (rewritten TaskDetail.tsx)
        └─ <TaskListMutations/> (logical, not a component)
```

### New components

| File | Role |
| --- | --- |
| `features/ai/components/TaskListPane.tsx` | List pane shell — owns filter chips strip + scroll + pagination |
| `features/ai/components/TaskFilterChips.tsx` | Status chip row + type select + active-filter clear chip |
| `features/ai/components/TaskRow.tsx` (rewritten) | Two-line compact row (~46px) |
| `features/ai/components/TaskDetailPane.tsx` (renamed from `TaskDetail.tsx`) | Timeline-first detail shell |
| `features/ai/components/TaskTimeline.tsx` | Vertical lifecycle timeline (Created → Started → Running/Completed) |
| `features/ai/components/TaskLogsBlock.tsx` | Log stream block — extracted from current detail body |
| `features/ai/components/TaskCollapsibleSection.tsx` | Disclosure wrapper for payload / result / metadata / sub-tasks |

### Removed / merged

- `TaskStates.tsx` — keep, but `TaskDetailEmpty` moves to `MasterDetailLayout`'s `empty` slot (per `admin-page-layout` skill, this is what the layout already supports).
- `TaskDetail.tsx` — replaced by `TaskDetailPane.tsx` (rename + rewrite).
- The old `Field`/`DetailBlock`/`JsonBlock`/`SmallBadge`/`Code` primitives in `AiPrimitives.tsx` stay; the new detail still uses them inside collapsible sections.

## §1 Page-level shell

`AiRouteViewContent` extends `PageHeader.actions` so each surface can contribute extra actions besides the tabs.

```tsx
<PageHeader
  title={t('ai.page.title')}
  description={t('ai.page.description')}
  actions={
    <div className="flex flex-wrap items-center gap-2">
      <SurfaceTabs surface={surface} onSelect={navigate} />
      {surface === 'tasks' ? <TasksSurfaceActions /> : null}
    </div>
  }
/>
```

`TasksSurfaceActions` renders the `Refresh` and `Clear Completed` buttons. They subscribe to the same React Query cache key (`aiTasksQueryKey`) the surface uses, so they remain in sync without prop drilling:

```tsx
function TasksSurfaceActions() {
  const queryClient = useQueryClient()
  const tasksState = useTasksQueryState() // a tiny hook returning isFetching + clearMutation
  return (
    <>
      <IconButton
        aria-label={t('ai.action.refresh')}
        icon={<RefreshCw className={cn('size-4', tasksState.isFetching && 'animate-spin')} />}
        onClick={tasksState.refetch}
      />
      <IconButton
        aria-label={t('ai.action.clearCompleted')}
        icon={<Trash2 className="size-4" />}
        onClick={tasksState.confirmClearCompleted}
      />
    </>
  )
}
```

**Phone:** icon-only buttons (no label).
**Desktop:** icon + label.

The mutations themselves stay defined in `AiTasksSurface` and are exposed via a small context (`TasksSurfaceContext`) so `TasksSurfaceActions` can read them. This keeps the surface as the single source of truth for the task lifecycle without forcing the page-level actions to live inside the list pane.

## §2 List pane

### Header strip (single row, app-shell-height)

```
┌─────────────────────────────────────────────────────────┐
│ AI Tasks · 247                                          │
└─────────────────────────────────────────────────────────┘
```

Only the title and the running count. No buttons. Height matches `APP_SHELL_HEADER_HEIGHT_CLASS` for visual alignment with the rest of the admin.

### Filter strip (single row, ~44px)

```
┌─────────────────────────────────────────────────────────┐
│ [All 247] [Pending 3] [Running 12] [Failed 5] [✓ 227]   │
│                                       [Type: All ▾]     │
└─────────────────────────────────────────────────────────┘
```

- **Status chips** — horizontal row, scrollable on phone (`overflow-x-auto`). Each chip shows the status label and the count for that status (counts come from a small aggregate query — see §6). Active chip uses the same active style as the existing surface tabs (`border-neutral-950 bg-neutral-950 text-white` / dark inverse).
- **Type select** — stays a `SelectField` (4–6 options doesn't fit chips), aligned right.
- **Reset** — implicit: when any chip is active and that chip is not `All`, an `×` appears inside the active chip. Clicking the chip again, or the `×`, resets that filter. No standalone Reset button.

### Row (~46px, two lines)

```
┌─────────────────────────────────────────────────────────┐
│ ◐ Summary    [running]                            2m    │
│   Post "React 19 升级笔记" · 67%                        │
└─────────────────────────────────────────────────────────┘
```

| Element | Position | Notes |
| --- | --- | --- |
| status icon | left, fixed 16px | uses existing `statusIcon[status]` + `statusIconClassName(status)`; running animates |
| type label | first line, after icon | bold, `text-sm`, `tabular-nums` for "Translate" etc. |
| status pill | first line, after type | smaller variant of `StatusBadge` (no padding, no border, status-color dot + label) |
| relative time | first line, right edge | `text-xs tabular-nums text-neutral-400` |
| summary | second line, left-aligned | `text-xs text-neutral-500`, truncated to 1 line |
| progress / counts inline | second line, after summary | only when running batch — e.g. `8/12 · 67%` |
| batch marker `[批]` | first line, after type | reuses existing `Layers` icon (3px → keep current) |
| retry-count badge | first line, after status pill | only when `retryCount > 0` |

Selected row uses `bg-neutral-100` / `dark:bg-neutral-900` (unchanged). Hover unchanged. Border-bottom unchanged.

### Scroll + pagination

Unchanged: `Scroll` flex-1, pagination only renders when `pageCount > 1`. Pagination row layout unchanged.

## §3 Detail pane

### Header (replaces both old header and old footer)

```
┌─────────────────────────────────────────────────────────────┐
│ ← ◐ Summary · Batch    [running] [retry 2] [批]             │
│   Post "React 19 升级笔记" · 8/12                            │
│                                    [⟲ Retry] [⊘ Cancel] [🗑] │
└─────────────────────────────────────────────────────────────┘
```

- Left cluster (unchanged from current): back button on mobile, status icon, type label, summary.
- Right cluster line 1: `StatusBadge`, optional `retry` small badge, optional `批` small badge (unchanged).
- Right cluster line 2 (new): action buttons. Each renders conditionally:
  - `Retry` — when `task.status ∈ {Failed, PartialFailed, Cancelled}`
  - `Cancel` — when `effectiveStatus ∈ {Pending, Running}`
  - `Delete` — when `task.status ∈ {Completed, Failed, PartialFailed, Cancelled}`. Destructive style (red border / text) preserved.

Actions use `IconButton` with hover-revealed labels on desktop, icon-only on phone. This collapses the old separate footer row.

### Body (scroll region) — timeline-first

```
┌─────────────────────────────────────────────────────────┐
│  [error block — if task.error]                          │
│                                                         │
│  Timeline                                               │
│  ● Created    14:23:01      —  2m ago                   │
│  ● Started    14:23:04      —  +3s                      │
│  ◐ Running    14:25:17      —  +2m13s                   │
│  ○ Completed  —                                         │
│                                                         │
│  Progress                                               │
│  生成中 · 8/12 articles                          67%    │
│  ████████████████░░░░░░░░                               │
│  + tokens generated chip — if > 0                       │
│                                                         │
│  Logs                                       [auto ⟳]    │
│  ┌───────────────────────────────────────────────┐      │
│  │ 14:25:17 INFO  worker-3: chunk 8 finished     │      │
│  │ 14:24:55 INFO  generating chunk 8/12 …        │      │
│  │ 14:24:32 INFO  worker-3: chunk 7 finished     │      │
│  │ 14:23:04 INFO  task picked by worker-3        │      │
│  │ 14:23:01 INFO  task queued                    │      │
│  └───────────────────────────────────────────────┘      │
│                                                         │
│  ▸ Sub-tasks  (8/12)              — only if batch       │
│  ▸ Payload                                              │
│  ▸ Result    (—)                  — collapsed if empty  │
│  ▸ Metadata  (id · worker · counts)                     │
└─────────────────────────────────────────────────────────┘
```

#### Timeline (`TaskTimeline.tsx`)

A vertical 4-row list. Each row:
- A circle marker (filled for done, animated for in-progress, hollow for pending)
- Stage name
- Absolute timestamp (or `—` if not reached)
- Relative duration since previous stage

Stages: `Created` (from `task.createdAt`), `Started` (from `task.startedAt`), `Running` (from `task.startedAt` while not finished; rendered only when running), `Completed` (from `task.completedAt`).

For batch tasks, the `Running` row collapses to show `n/total` next to the duration.

#### Progress block

Same UX as today (progress message + percentage + bar), but now sits right under the Timeline so the lifecycle reads top-down. The `tokensGenerated` chip merges in below the bar when present (instead of being its own block).

#### Logs block (`TaskLogsBlock.tsx`)

- Header row: `Logs` label + a small `auto ⟳` indicator that pulses while polling is active.
- Body: a max-height (~360px) scrollable region containing the existing `TaskLogRow` rows. Newest-first ordering.
- When no logs: a placeholder line "No logs yet — task may not have started" (replaces current `t('ai.empty.logs')`).
- Logs are the **primary** block — they get the largest vertical real estate above the fold.

#### Collapsible secondary sections (`TaskCollapsibleSection.tsx`)

A simple disclosure built on Base UI `Collapsible`. Each section header shows:
- A chevron (`▸` collapsed, `▾` expanded)
- The section title
- A trailing hint in parentheses for quick scanning (`8/12`, `—`, `id · worker · counts`)

Default state:
- `Sub-tasks` — expanded if `task.subTaskStats` exists AND the task is running, collapsed otherwise
- `Payload` — collapsed
- `Result` — collapsed; hidden entirely when `task.result === undefined`
- `Metadata` — collapsed

Metadata replaces the current eight-field grid. It contains the same fields (`id`, `type`, `createdAt`, `startedAt`, `completedAt`, `workerId`, `totalItems`, `completedItems`) but grouped:
- **Identity:** id (with copy button), type, worker
- **Timestamps:** created, started, completed (absolute)
- **Counts:** total items, completed items

This three-group grouping replaces the current flat 8-field grid.

## §4 Keyboard wiring (Case A from `master-detail-list-keyboard`)

The list pane uses `useListKeyboard<AITask>` with Case A semantics — j/k drives the detail target, which is the URL-synced `selectedTaskId`.

```tsx
useListKeyboard<AITask>({
  scopeId: 'ai-tasks',
  items: tasks,
  getId: (t) => t.id,
  resetOn: [statusFilter, typeFilter, page],
  onItemFocus: (id) => {
    setSelectedTaskId(id)
    setShowDetailOnMobile(true)
  },
  actions: [
    {
      key: 'open',
      label: 'Open',
      shortcut: 'Enter',
      run: (targets) => {
        const t = targets[0]
        if (t) {
          setSelectedTaskId(t.id)
          setShowDetailOnMobile(true)
        }
      },
    },
  ],
})
```

The row component:

```tsx
<TaskRow
  task={task}
  selected={task.id === selectedTaskId}
  onSelect={() => {
    setSelectedTaskId(task.id)
    setShowDetailOnMobile(true)
  }}
/>
```

The list pane is wrapped in `<FocusScope id="ai-tasks">`.

`resetOn` includes filter / page so j/k doesn't land on a stale id after the list reshapes.

## §5 Mobile / responsive

`MasterDetailLayout` already collapses on phone via `useMasterDetailLayout().isMobile`. No new mobile-only components.

Phone-specific adjustments:
- Page-level `[Refresh] [Clear]` buttons are icon-only (no label).
- Status chips become horizontally scrollable.
- Detail header action cluster wraps to a second row (already a flex-wrap container).
- Back button in detail header remains.

## §6 Per-status counts query

The status chips in §2 show per-status counts. The current `getAiTasks` returns `{ data, total }` where `total` only reflects the currently-filtered query. We need totals per status independent of the current filter.

**Decision:** Add a separate light query `getAiTasksStatusCounts()` that returns `{ pending, running, completed, failed, partialFailed, cancelled, total }`. It uses the same polling interval (5s) as the list query.

If the backend does not expose this aggregate, the fallback is to issue one count-only query per status (size=1, page=1) and read `total`. To avoid five concurrent requests on every refetch, the fallback fires once, then refetches at 15s instead of 5s. Implementation chooses the aggregate endpoint when available.

The query key: `[...aiTasksQueryKey, 'status-counts', { type: typeFilter || undefined }]` — counts respect the active type filter (so "Translate · Failed" shows the count of Translate tasks that are Failed), but not the active status filter (since the chip itself swaps the status).

## §7 URL state

Unchanged from current behavior. Surface still owns:
- `?id=<taskId>` — selected task
- `?page=<n>` — pagination
- `?status=<status>` — active status chip
- `?type=<type>` — active type select

The chip / select / row interactions push these to the URL via the same `setSearchParams(next, { replace: true })` debounced effect.

## §8 i18n

All new strings go through `useI18n().t(key)`. New keys to add (English + Chinese):

| Key | English | Chinese |
| --- | --- | --- |
| `ai.tasks.timeline.title` | Timeline | 时间线 |
| `ai.tasks.timeline.created` | Created | 已创建 |
| `ai.tasks.timeline.started` | Started | 已开始 |
| `ai.tasks.timeline.running` | Running | 运行中 |
| `ai.tasks.timeline.completed` | Completed | 已完成 |
| `ai.tasks.timeline.notReached` | — | — |
| `ai.tasks.logs.title` | Logs | 日志 |
| `ai.tasks.logs.auto` | auto | 自动 |
| `ai.tasks.logs.emptyDetail` | No logs yet — task may not have started | 暂无日志 — 任务可能尚未开始 |
| `ai.tasks.sections.subTasks` | Sub-tasks | 子任务 |
| `ai.tasks.sections.payload` | Payload | 载荷 |
| `ai.tasks.sections.result` | Result | 结果 |
| `ai.tasks.sections.metadata` | Metadata | 元数据 |
| `ai.tasks.metadata.identity` | Identity | 标识 |
| `ai.tasks.metadata.timestamps` | Timestamps | 时间戳 |
| `ai.tasks.metadata.counts` | Counts | 计数 |
| `ai.tasks.filter.all` | All | 全部 |
| `ai.tasks.filter.statusChipAria` | Filter by status: {status} | 按状态筛选: {status} |

Existing keys (`ai.tasks.title`, `ai.tasks.countSuffix`, etc.) stay.

## §9 Migration steps (will be expanded by writing-plans)

1. Add per-status counts query helper + i18n keys.
2. Build `TaskListPane`, `TaskRow` (new two-line row), `TaskFilterChips`.
3. Build `TaskTimeline`, `TaskLogsBlock`, `TaskCollapsibleSection`.
4. Rewrite `TaskDetail.tsx` → `TaskDetailPane.tsx` consuming the new blocks.
5. Hoist refresh + clear buttons to `AiRouteViewContent`'s tabs row via a `TasksSurfaceContext`.
6. Wire `useListKeyboard` + `FocusScope` (Case A).
7. Drop the old footer action bar and the old 8-field grid.
8. Verify URL-sync, polling, mobile back, batch task stats, sub-task expansion still work.
9. Run focused typecheck + lint on changed files only.

## §10 Risks / open questions

- **Status counts endpoint:** if the backend already exposes a per-status count, we use it; otherwise we use the 5-query fallback at 15s polling. The fallback is acceptable but worth one mx-core check before implementation.
- **Timeline ambiguity for batch tasks:** the "Running" row shows `n/total · elapsed` which can be misleading once `completedItems` plateaus due to retries. Mitigation: show `started + last log timestamp` as the "Running since" label, not `now - startedAt`, when `effectiveStatus === Running` and a log within the last 60s exists.
- **Polling vs visible interaction:** when the detail pane is open and `id` matches the running task, the existing 5s `refetchInterval` already updates the timeline. No explicit subscription needed.
- **Sub-task stats placement:** today it's eagerly rendered when `task.subTaskStats` exists. The new design defaults it to expanded only while running. This is a behavioral change; if users rely on always-expanded stats post-completion, we can flip the default after data review.

## §11 Out of scope (deliberate)

- Log search and log filtering.
- Real-time WebSocket replacement for polling.
- Bulk task selection.
- Customizable column / field visibility.
- Cross-task comparison view.
- Surfacing tasks elsewhere in the admin (e.g. dashboard widgets).
