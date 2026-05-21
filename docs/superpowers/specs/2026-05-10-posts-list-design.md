# Posts List View Design (Linear-style)

**Date**: 2026-05-10
**Owner**: this file
**Phase**: P3 batch 3a (first list-read view)
**Depends on**: 2026-05-10-keymap-architecture-design.md (keyboard runtime), spec 03 (UI primitives — Button, Input, Popover, Modal, Drawer, Switch, Checkbox, Tag, Pagination, Avatar), spec 05 (`createResourceTable` already in repo), spec 07 (FullLayout / TwoColLayout), spec 08 (form primitives)
**Feeds**: P3 batch 3a sibling views — `notes/view`, `pages/list`, `says`, `recently`

This spec replaces the source repo's vue3 NDataTable-driven posts list with a Linear-inbox-style two-pane view. It is the trailblazer for batch 3a — `notes/view`, `pages/list`, etc. inherit its layout shell, row composition rules, filter/display popovers, bulk-action bar, and keyboard handling. View-specific deltas (different fields per row, different filters) are documented in their own files but the chrome stays.

---

## Scope

- **In**: layout (2-col), list-pane chrome, row composition (single density), funnel filter popover, display-options popover, search affordance, right pane (preview + quickedit), floating bulk action bar, selection model, keyboard chords, mobile fallback strategy, data wiring against existing `createResourceTable`-style API, list of new components to ship.
- **Out**: `/posts/edit` write view (P4), category management view (separate, P3 batch 3c-ish), per-row inline category cell editing (replaced by quickedit panel), agent / draft workflow (P4), realtime socket bridge wiring details (already shipped via spec 05; this view consumes existing events).

---

## Goals

1. 1:1 functional parity with the vue3 list (search · category filter · sort · multi-select bulk delete · pin · publish toggle · jump to edit · external view link · per-row delete) — no functional regression even though presentation changes.
2. Linear inbox aesthetic: dark canvas, minimal table chrome, single-row compact rows with two metadata lines.
3. Keyboard-first navigation using the keymap runtime defined in `2026-05-10-keymap-architecture-design.md`.
4. Right-pane preview + quickedit so 80 % of administrative edits never require leaving the list.
5. Floating bulk-action bar so multi-select is fluent without claiming header space.

## Non-goals

- **No saved-view / view-tab system.** `For me / Created` style tabs are explicitly cut. Every filter is set via the funnel popover or URL state. Keeps the chrome minimal.
- **No `?` help / discovery panel.** Per keymap-architecture spec, no rendered help UI.
- **No virtualization** in the v1 of this view. Posts pagination is server-side at 20/page; one viewport easily fits a page.
- **No multi-select on mobile.** Card list on mobile preserves vue3 behaviour; bulk operations are desktop-only.

---

## Layout

```
┌─────────────────────────┬─────────────────────────────────────┐
│  list pane (≥360px,     │  right pane (flex 1, ≥420px)        │
│  resizable; default     │                                     │
│  flex 0 0 420)          │  preview + quickedit                │
│                         │                                     │
│  ┌─ pane-header ────┐   │  ┌─ right-header ───────────────┐   │
│  │ 文章 142  🔍⏷≡＋ │   │  │ 📌 title …  ⎘ ↗ 🗑 [编辑⌘↵] │   │
│  └──────────────────┘   │  └──────────────────────────────┘   │
│  ┌─ filter-bar (cond)─┐ │  ┌─ quickedit ──────────────────┐   │
│  │ 分类: 前端 × …      │ │  │ 分类  [前端ʼ▾]                │  │
│  └────────────────────┘ │  │ 标签  [react×][hooks×][+]     │  │
│  ┌─ search-bar (cond)─┐ │  │ 状态  [● 已发布 ▾]            │  │
│  │ 🔍 搜标题…    Esc  │ │  │ 封面  [上传]                  │  │
│  └────────────────────┘ │  └──────────────────────────────┘   │
│  ┌─ list ─────────────┐ │  ┌─ preview ────────────────────┐   │
│  │ ●row              │  │  │  摘要 …                       │  │
│  │ ●row (active)     │  │  │  正文前 N 段；下端 fade       │  │
│  │ ●row              │  │  │                              │   │
│  │ …                 │  │  └──────────────────────────────┘   │
│  └────────────────────┘ │  ┌─ right-footer ───────────────┐   │
│  ┌─ pagination ──────┐  │  │ 创建 … · 修改 … 评论 历史      │  │
│  │ 1/8  ‹ 1 2 3 … ›  │  │  └──────────────────────────────┘   │
│  └────────────────────┘ │                                     │
└─────────────────────────┴─────────────────────────────────────┘
                ↑ floating bulk action bar (when ≥1 selected)
```

- Built on the existing `<TwoColLayout>` primitive (spec 07) **on desktop only** (≥ 768px). Left fills first; right is sized by `flex: 1` with a `min-width` to avoid sub-readable previews.
- The list pane is a `<Scroll>`-wrapped column following the spec 03 mandate; the right pane is independently scrollable.
- The page-level component picks one path: `<TwoColLayout>` on desktop, `<MobileCardList>` on mobile. **`<TwoColLayout>` is not used at all on mobile** — its built-in mobile drawer behaviour is bypassed because the redesign explicitly chose a card-list fallback rather than a drawer-detail fallback. The breakpoint check is a single `useMediaQuery('(min-width: 768px)')` at page top.
- Default focus on mount: list-pane cursor on the first row; right pane fetches and shows that row's preview.

### Mobile

Below `768px` viewport, the entire view replaces the desktop layout with **vue3-equivalent CardList**:

- single-column card list, no two-pane layout
- per-card actions preserved from vue3: external view link (↗), edit (✏ → `/posts/edit?id=`), delete (with confirm) — see [Vue source `manage-posts/list.tsx:120`](../../../../admin-vue3/apps/admin/src/views/manage-posts/list.tsx)
- card body shows the same row metadata as desktop (pin · title · category chip · tags head · counts · status)
- pagination preserved (same `<Pagination>` primitive)
- no quickedit, no bulk select, no chord set, no funnel/display popovers
- search bar is rendered as a persistent input above the cards (the slim-bar pattern doesn't fit on touch)

This is a deliberate copy of vue3 behaviour to avoid double-track design work — formatters are shared with the desktop row component. A future spec (post-P3) will revisit mobile to add a list+drawer detail pattern; not in scope here.

---

## List pane

### Pane header (44 px)

| Element | Behaviour |
|---|---|
| `文章 N` title | Static label, count from `data.totalCount` |
| `🔍` search button | Click opens slim search bar overlay (see Search) — keyboard ⌘F same |
| `⏷` filter button | Click opens funnel popover (see Filter) — keyboard `F` |
| `≡` display button | Click opens display-options popover (see Display) |
| `＋` primary button | Click navigates to `/posts/edit` (no popover, no quick-create) — keyboard `mod+n` |

Icon buttons reuse the existing icon-only `<Button>` variant. The primary `＋` uses `variant="primary"` (lavender accent).

### Filter bar (conditional, 32 px)

Renders only when at least one filter is active. Shows applied filters as removable chips plus a `N / total` ratio aligned right.

```
分类: 前端 ×    状态: 已发布 ×    创建: 2026-04 后 ×            5 / 142
```

Click `×` removes that filter; clicking the chip body re-opens the funnel popover scrolled to that section. URL state syncs (URL-sync handled by upstream `useDataTable` work — out of this spec's scope).

### Search bar (conditional, 36 px)

Hidden by default. Shown when:
- User clicks 🔍 in the pane header, OR
- `mod+f` chord fires in the `posts.list` page scope (i.e., the page is mounted and no overlay is open). The chord is registered via `useShortcut('mod+f', ...)`; per the keymap arch's resolution, an open Modal/Popover/Drawer/kbar overlay shadows it (its overlay scope wins or no scope binds → noop), so the page's `mod+f` only fires when the user is genuinely looking at the list. The chord captures `mod+f` from the list pane regardless of which sub-element holds focus, *as long as no overlay is open*.

Focuses immediately on show. Debounced 300 ms (matches vue3). `Escape` closes and clears the keyword. Letter-class chords (j, k, x, p, c, /) do not fire while the search input has focus — the keymap manager's editable suppression handles this; the page does not need extra plumbing.

While search is active and non-empty, the underlying request switches from `postsApi.getList` to `searchApi.searchPosts` exactly as vue3 does. Pagination behaviour matches.

### Group header (deferred / conditional)

Default grouping is **none** — flat list. The display-options popover offers `按状态 / 按月 / 无` grouping. When grouping is active, group headers render as 24 px rows with `▾ 群名 · count`. Collapsed state is page-local (Jotai), not persisted across sessions.

### Row (57 px, Linear inbox aligned)

```
[📌] [title text…]                  [● status]
     [category · tags head · 📖N · 👍N · time]
```

Concrete spec — typography numbers come from `02-design-tokens.md` v2 calibrated (do not redeclare here):

| Slot | Source field | Notes |
|---|---|---|
| pin column | `row.pinAt` | `iconSize.sm` (12) wide; lavender pin icon when set; empty when not |
| title | `row.title` | `typography.listTitle` (13 / 500 / normal / `ink`); ellipsis on overflow |
| status dot | `row.isPublished` | 7 px dot — `semanticSuccess` published, `inkTertiary` draft. The status dot renders **inline at the end of body-row 1**, not as its own column |
| category | `row.category.name` | `typography.listMeta` size, `inkMuted` color (slightly brighter than other meta items so it acts as the row's secondary anchor) |
| tags head | `row.tags?.slice(0, 3).join(' · ')` + `…` | `typography.listMeta`; drops to none when empty |
| read count | `row.readCount` | `<BookOpen size={iconSize.sm}/> 1.2k` formatter — lucide icons not emoji (emoji ignore font-size). Hidden when `0` |
| like count | `row.likeCount` | `<ThumbsUp size={iconSize.sm}/> N` formatter. Hidden when `0` |
| relative time | `row.modifiedAt ?? row.createdAt` | `typography.listMeta` size, `inkTertiary` color (dimmer than other meta to recede). Compact unit format: `1mo` / `3d` / `4h`. Right-aligned within row 2 |

Row metrics: `min-height: 57px`, `padding: 10px 16px`, `gap: 4px` between title line and meta line. Inherits from the **compact-list density rule** in `02-design-tokens.md` — do not invent per-view row sizes.

States:
- `default` — neutral row
- `hover` — `surface1` background
- `active` (right pane is showing this row) — `surface3` background
- `selected` (in selection set) — translucent lavender background `rgba(94,106,210,0.10)` + 2 px lavender left border (replaces row padding-left from 16 → 14)
- `active + selected` — lavender left border + slightly stronger background (`rgba(94,106,210,0.18)`)

Density is **fixed at 57 px** for v1. The display-options popover does not include a density toggle; cut to keep scope.

### Display-properties chips

The display-options popover offers a chip list for **which metadata items render in body-row 2**. Defaults: `[category, tags, readCount, likeCount, time]` on. User can toggle off `readCount` / `likeCount` / `tags`. Title and status are not toggleable. Setting persists in Jotai → localStorage under `posts.list.display`.

### Pagination

Existing `<Pagination>` primitive at the bottom of list pane. Server-side, 20/page (matches vue3). Display-options popover does not change page size.

### List states

| State | Trigger | Render |
|---|---|---|
| `idle / loaded` | normal | rows |
| `loading` (initial) | first fetch, no prior data | `<Skeleton>` rows × 8; pagination disabled; right pane empty state |
| `loading` (subsequent) | `useTableQuery` `isFetching` && `data` exists | rows shown stale; thin progress bar at top of list pane (`motion` height 2px lavender); pagination keeps prior shape |
| `error` | request failed | rows replaced by centered error block: title `加载失败`, error message muted line, `重试` button; pagination disabled |
| `empty (no posts at all)` | `data.totalCount === 0` && no filters / search | `<Empty>` primitive: illustration + `还没有文章` + `创建第一篇` link → `/posts/edit` |
| `empty (filtered)` | `data.totalCount === 0` && filters present | `<Empty>` variant: `没有匹配的文章` + `清除筛选` button (resets filter atom) |
| `empty (searched)` | search-mode active && response empty | `<Empty>` variant: `「<keyword>」没有结果` + `清除` button |
| `category-load failure` (in funnel popover) | `useCategoryList` errored | Funnel popover's `分类` section shows muted `分类加载失败 · 重试`; rest of funnel still works |

---

## Funnel filter popover

Triggered by `⏷` icon or `F` key. Base UI `<Popover>`. Width 240 px, anchored under the icon.

Sections (vertical menu):
1. `分类` → opens nested popover with multi-select category list (sourced from existing `categoryStore`)
2. `标签` → free-text multi-add (typeahead from server)
3. `状态` → radio: `全部 / 已发布 / 草稿 / 仅置顶`
4. `创建日期` → date range picker (DatePicker primitive — currently deferred, see Risks)
5. `修改日期` → date range picker
6. `正文 / 标题` → opens search bar (same as ⌘F)

Each filter selection commits immediately on choice (no apply button). Selections sync into the filter-bar chips above.

The filter state is owned by `useDataTable`-style atom (existing infrastructure, already shipped via spec 05). The popover is purely a UI surface that reads/writes that atom.

---

## Display-options popover

Triggered by `≡` icon. Base UI `<Popover>`. Width 260 px.

Sections:
1. `分组` — `Select`: `无 / 按状态 / 按月`
2. `排序` — `Select`: `修改时间 ↓ / 创建时间 ↓ / 阅读 ↓ / 点赞 ↓ / 标题 A→Z`
3. `显示草稿` — `Switch` (default on)
4. `显示属性` — toggle chips: `分类 · 标签 · 阅读 · 点赞 · 时间 · 封面 · slug`

State persists per-route in `localStorage` via Jotai atom family keyed `posts.list.display`. Default values are baked in code; localStorage hydrates over them at boot.

---

## Right pane

### Header (vertical compact)

| Element | Behaviour |
|---|---|
| `📌` toggle | Click invokes `postsApi.patch(id, { pin: !pin })`. Optimistic. Lavender when pinned, muted otherwise |
| Title | 18 px / 600 weight. **Not editable here**. Click does nothing; rename happens in `/edit` |
| Status line | Status dot · status word · slug as link · external `↗` |
| `⎘` copy slug | Copies `/posts/<category-slug>/<slug>` to clipboard, toasts |
| `↗` external | Opens `${WEB_URL}/posts/<category-slug>/<slug>` in new tab |
| `🗑` delete | Opens confirm popover (Base UI Popover with Cancel/Delete) |
| `编辑 ⌘↵` primary | Navigates to `/posts/edit?id=<id>` |

The `📌` and `🗑` are inline icon buttons (28 × 28). The `编辑` button is a primary button with the chord hint inline.

### Quickedit grid

Fixed 80 px label column + flex value column. Rows:

| Field | Editor | Mutation |
|---|---|---|
| 分类 | Pill that opens a `<Select>` with category options | `postsApi.patch(id, { categoryId })` |
| 标签 | Tag pills with `×` per existing tag + dashed `+ 添加` pill that opens an inline input with typeahead | `postsApi.patch(id, { tags })` |
| 状态 | Pill that opens a `<Select>` with `已发布 / 草稿` | `postsApi.patch(id, { isPublished })` |
| 封面 | If absent: `未设置` text + dashed `上传` pill. If present: thumbnail + `更换 / 移除`. Upload via existing upload component | `postsApi.patch(id, { meta.cover })` |

Every mutation is optimistic via TanStack Query; failure rolls back and toasts the error message.

### Preview

The list query uses a narrow `select` (matching vue3) and **does not include `text`**. The right pane therefore issues its own detail fetch:

```ts
const { data: post } = useQuery({
  queryKey: queryKeys.posts.detail(activeId),
  queryFn: () => postsApi.get(activeId),
  enabled: !!activeId,
  staleTime: 30_000,
})
```

Reuses the existing markdown renderer (spec 10 markdown component, already in repo as `~/components/markdown`). Renders `post.text` **truncated to the first ~600 chars** with a CSS bottom-fade gradient implying "more in /edit".

States:
- detail fetch loading → `<Skeleton>` rows in place of body
- detail empty (rare for published posts; common for drafts) → muted placeholder `暂无正文`
- detail error → muted error line + retry link

### Footer (32 px)

Left: `创建 <relative> · 修改 <relative>`. Right: `评论 N` link (jumps to `/comments?postId=<id>`) and `历史` link (a no-op stub if revision UI is not implemented; render disabled if no history endpoint exists).

### Empty state

If no row is selected (e.g., right after a filter clears the list), the right pane shows a centered illustration + helper text ("选一篇文章以预览") matching the Linear-inbox empty state aesthetic.

---

## Floating bulk action bar

Renders when **selection count ≥ 1**. Positioned `position: fixed` (relative to the list pane viewport), bottom 16 px, horizontally centered. `motion` slide-up entrance.

```
[3] 已选  | 📂 改分类  🏷 加标签  📌 置顶  ● 切换状态 | 🗑 删除 [⌘⌫] | ✕ 清选 [Esc]
```

| Action | Behaviour |
|---|---|
| 改分类 | Opens a `<Select>` overlay; on commit, runs `Promise.allSettled` of `postsApi.patch(id, { categoryId })` |
| 加标签 | Same, with tag input |
| 置顶 | Toggles pin on all (`Promise.allSettled` of patches) |
| 切换状态 | Toggles `isPublished` on all |
| 删除 | Confirm popover, then `Promise.allSettled(ids.map(postsApi.delete))` |
| 清选 | Clears selection set |

Bar uses `surface2` with shadow `0 12px 32px rgba(0,0,0,0.5)`. The `[⌘⌫]` and `[Esc]` markers are styled `<kbd>`-equivalents inside the bar — visual hint, not a help panel.

### Bulk failure handling

All bulk operations use `Promise.allSettled` (matches vue3) so partial failures don't abort the batch. After settle:

1. Compute `succeeded = ids.filter(id => result[i].status === 'fulfilled')` and `failed = ids \ succeeded`.
2. Invalidate `tableStateAtomFamily('posts.list')` query (one shot — refetches the page; no per-row optimistic updates to roll back since bulk ops are not optimistic).
3. **Selection cleanup**: remove the **succeeded** ids from `postsListSelectionAtom`. Failed ids stay selected so the user can retry.
4. **Toast aggregation**: one toast per outcome bucket, not per row.
   - All succeeded: `已删除 N 篇` (or category/tag/pin/status equivalent).
   - Mixed: `success: M ｜ failed: N · <first error message>`. Failed ids stay selected; clicking the toast cursors to the first failed id.
   - All failed: `操作失败 · <first error message>` (toast type = error).
5. The bulk operation does **not** trigger an optimistic UI update before the request returns — the action bar shows a small inline spinner replacing the action label until settle. This trades latency for failure-state simplicity.

---

## Selection model

Three independent pieces of state, all in Jotai under `src/atoms/posts.ts`:

| Atom | Type | Lifetime |
|---|---|---|
| `postsListCursorAtom` | `string \| null` | The "active" row — its preview shows in the right pane. Updated by `j` / `k`, click, or `shift+click` |
| `postsListSelectionAtom` | `Set<string>` | The "selected" rows — operated on by bulk actions |
| `postsListAnchorAtom` | `string \| null` | The shift-click range anchor; reset whenever a non-shift selection happens |

All three reset on logout (registered with `clearAllTableStates`-equivalent) and on route navigation away.

### Cursor vs. selection

The cursor (active row) and the selection set are **decoupled**. The right pane shows whatever the cursor points at. A selection of zero rows is the normal state — bulk actions are gated by `selection.size >= 1`.

### Mouse + keyboard interactions

| Interaction | Cursor | Selection | Anchor |
|---|---|---|---|
| Plain click row | Set to clicked id | If selection size ≥ 2: cleared. If selection size ≤ 1: set to `{id}` (replace) | Set to clicked id |
| `mod+click` | Set to clicked id | Toggle clicked id in selection | Set to clicked id |
| `shift+click` | Set to clicked id | Range from anchor to clicked id (replace) | Unchanged |
| `j` / `arrowdown` | Move cursor down by one visible row (`allowRepeat: true`); **right pane refetches** | Unchanged | Unchanged |
| `k` / `arrowup` | Move cursor up by one visible row (`allowRepeat: true`); right pane refetches | Unchanged | Unchanged |
| `x` | Unchanged | Toggle cursor row in selection | Set to cursor id |
| `mod+a` | Unchanged | Add all rows on the **current page** to selection | Anchor = first row of page |
| `mouseenter` row | **Unchanged** — hover only paints the hover style; never moves the cursor | Unchanged | Unchanged |
| Click on overlay row not in current page (impossible — selection is page-scoped here) | n/a | n/a | n/a |
| `escape` | If right-pane focused: blur back to list. Else if selection size ≥ 1: clear selection. Else if search bar open: close search. | Cleared per left | Cleared if selection cleared |

### Selection across pagination

Selection is **page-scoped**: changing page (via Pagination control) clears the selection set and the anchor. The cursor is **also reset** to the first row of the new page (j/k always operates on visible rows). This trades a feature (cross-page bulk delete) for predictability and matches vue3 — vue3's `checkedRowKeys` was likewise wiped by `setPage` in NDataTable.

A future iteration may add a "select all matching filter" affordance with explicit cross-page intent; out of scope for v1.

### Cursor fallback after deletion / filter / page change

When the current cursor row disappears (deleted, filtered out, or page changed), the cursor is reassigned in this order:
1. The **next** visible row at the same index (i.e., what slid into the cursor's position).
2. If the cursor was the last row, the **previous** visible row.
3. If the page is now empty, `null` — right pane shows empty state.

### Right-pane "active row" reactivity

When `cursor` changes, the right pane:
1. Cancels any in-flight `usePostDetail` fetch for the prior id (TanStack Query handles this automatically when the queryKey changes).
2. Renders skeletons during the fetch.
3. Optimistic updates from the prior row's quickedit are not rolled back — they persist via the list-level cache, but the *right pane's* viewport is now the new row's data.

---

## Keyboard chords (registered in `posts.list` page scope)

| Chord | Description | Class | Notes |
|---|---|---|---|
| `j` / `arrowdown` | Move cursor down; right pane refetches detail | letter / named | `allowRepeat: true`. Arrow form: handler returns early if `event.target` is a native scrollable / editable / `role="listbox"` etc. |
| `k` / `arrowup` | Move cursor up | letter / named | same |
| `mod+enter` | Navigate to `/posts/edit?id=<cursor>` | mod | |
| `x` | Toggle selection on cursor row | letter | |
| `mod+a` | Select all rows on current page | mod | `preventDefault: true` overrides browser select-all |
| `mod+backspace` | Delete selected (or cursor if no selection); confirm popover | mod | **Replaces former `shift+d`** — `shift+letter` is letter-class so it would not fire while user types in search; `mod+backspace` works in either context |
| `p` | Toggle pin on cursor row | letter | `allowRepeat: false` to avoid pin-flicker from a held key |
| `c` | Focus the category select in the right pane's quickedit | letter | |
| `escape` | Cascade — see Selection model § escape | named | |
| `/` | Open search bar | symbol | letter-class, suppressed in editables |
| `mod+f` | Open search bar (alias for desktop convention) | mod | Only fires when keymap manager's resolution chain places it in `posts.list` scope — i.e., when the page is mounted and no overlay is open. The browser's own Find-in-page is replaced for this page only. |
| `mod+n` | New post → `/posts/edit` | mod | |

### What this view does NOT register

- `mod+k` — owned by global kbar (passthrough). Page must not shadow.
- `tab` — reserved at parser level; native focus traversal must work.
- `?` — no help panel per keymap spec.

### Where chords are registered

```tsx
function PostsListPage() {
  return (
    <ShortcutScope id="posts.list" kind="page">
      <PostsListBody />
    </ShortcutScope>
  )
}
```

Per the keymap arch, letter-class chords are auto-suppressed inside `<input>` / `<textarea>` / `[contenteditable]`. The page does not need to defend `j` / `k` / `x` / `p` / `c` / `/` from search-bar typing.

---

## Data wiring

### Required ports (NOT yet in repo)

The current `src/api/` only contains `system.ts` and `user.ts`. The current `src/stores/` has `auth`, `layout`, `ui`. **All three of the following must be ported as part of this work, before the view itself can compile:**

- `src/api/posts.ts` — port from vue3 `~/api/posts` (`getList`, `get`, `patch`, `delete`, plus any `pin` / `restore` helpers used by quickedit). Use the existing `request.ts` and the typed `@mx-space/api-client` shapes.
- `src/api/search.ts` — port from vue3 `~/api/search` (`searchPosts`).
- `src/api/category.ts` — port from vue3 `~/api/category` (`getAll` plus any patch/create needed for inline category edit).
- `src/stores/category.ts` — port the zustand `categoryStore` (currently a `defineStore` in vue3). Should re-fetch on mount (used by funnel filter and quickedit's category select). Persist nothing; treat as derived/cached server state — alternatively, drop the store and use a simple `useCategoryList` query hook. Recommendation: **use a `useCategoryList()` query hook instead of a store**, since spec 05 forbids view-side `create()` and category data is purely server-derived. Mark the legacy "store" idea as deprecated.

These ports are blockers; the view spec assumes they exist.

### Server-side query keys

`src/hooks/queries/keys.ts` currently does not contain post-related keys (resource-specific keys are intentionally not centralized — see `keys.ts:1`). Posts list adds keys via `tableStateAtomFamily` (which already exists in `src/atoms/table.ts:6`) and `useTableQuery` (existing at `src/hooks/queries/useTableQuery.ts:35`). The detail fetch uses an explicit ad-hoc key:

```ts
['posts', 'detail', id]
```

defined inline at the call site (matches the existing convention).

### Hooks to add

```
src/hooks/queries/usePosts.ts
  usePostsList(params)                   // composes useTableQuery + tableStateAtomFamily('posts.list') + postsApi.getList (narrow select)
  usePostsSearch(params)                 // search-mode branch (active when keyword non-empty)
  usePostDetail(id)                      // full fetch for right pane (text + meta + tags); enabled: !!id
  usePostPatch()                         // useMutation; optimistic; rolls back on error and toasts
  usePostDelete()
  usePostsBulkDelete()                   // Promise.allSettled wrapper; see Bulk failure handling

src/hooks/queries/useCategoryList.ts
  useCategoryList()                      // server-derived; replaces the vue3 categoryStore concept
```

Note: prior drafts of this spec referenced "useDataTable infra" generically. The actually-shipped names are `tableStateAtomFamily` (in `src/atoms/table.ts`) and `useTableQuery` (in `src/hooks/queries/useTableQuery.ts`). Hooks above must use those.

### Atoms to add

```
src/atoms/posts.ts
  postsListSelectionAtom         // Set<string>
  postsListCursorAtom            // string | null  (active row id)
  postsListAnchorAtom            // string | null  (shift-click anchor)
  postsListSearchOpenAtom        // boolean
  postsListSearchKeywordAtom     // string (debounced upstream — 300ms, mirrors vue3)
  postsListDisplayAtom           // { grouping, showDrafts, displayProps[] }  ← see note
```

**Sorting state lives only in `tableStateAtomFamily('posts.list')`**, not in `postsListDisplayAtom`. The display atom owns view-only toggles (grouping, showDrafts, displayProps); sort goes through the table state so it round-trips with pagination and so the request signature is single-sourced. The display-options popover's "排序" select reads/writes `tableStateAtomFamily('posts.list').sort`, while "分组" / "显示草稿" / "显示属性" read/write `postsListDisplayAtom`.

The display atom is persisted to `localStorage` (key: `posts.list.display.v1`); the rest are session-only.

---

## New components

| Component | Path | Notes |
|---|---|---|
| `<PostListPage>` | `src/pages/posts/view/index.tsx` | Page-level component; mounts page scope |
| `<ListPaneHeader>` | `src/pages/posts/view/list/Header.tsx` | The 4-icon-button row |
| `<ListFilterBar>` | `src/pages/posts/view/list/FilterBar.tsx` | Applied-filter chips |
| `<ListSearchBar>` | `src/pages/posts/view/list/SearchBar.tsx` | Slim search overlay |
| `<PostRow>` | `src/pages/posts/view/list/Row.tsx` | The 57 px row |
| `<FilterPopover>` | `src/pages/posts/view/list/FilterPopover.tsx` | Funnel popover |
| `<DisplayPopover>` | `src/pages/posts/view/list/DisplayPopover.tsx` | Sliders popover |
| `<BulkActionBar>` | `src/pages/posts/view/list/BulkActionBar.tsx` | Floating bar |
| `<RightPane>` | `src/pages/posts/view/right/index.tsx` | Container for header/quickedit/preview/footer |
| `<RightHeader>` | `src/pages/posts/view/right/Header.tsx` | |
| `<Quickedit>` | `src/pages/posts/view/right/Quickedit.tsx` | The 4-row grid |
| `<Preview>` | `src/pages/posts/view/right/Preview.tsx` | Markdown render with fade |
| `<RightFooter>` | `src/pages/posts/view/right/Footer.tsx` | |
| `<MobileCardList>` | `src/pages/posts/view/mobile/CardList.tsx` | Mobile fallback |

Co-locating each piece under `src/pages/posts/view/` keeps the unit count manageable. Files stay under the 300-line cap.

A handful of reusable bits factor up to `src/components/list/`:
- `<FilterBar>` — generic chip-bar (notes/pages/etc. will reuse)
- `<BulkActionBar>` — generic with action slot prop
- `<SlimSearchBar>` — generic

These extractions happen during the first migration of a sibling view (e.g., `notes/view`), not pre-emptively.

---

## State allocation

| State | Bucket |
|---|---|
| Posts list data + count | TanStack Query via `usePostsList` |
| Post detail (right-pane preview) | TanStack Query via `usePostDetail` |
| Category list | TanStack Query via `useCategoryList` (replaces the legacy vue3 zustand store idea) |
| Filter / sort / page | `tableStateAtomFamily('posts.list')` (existing infra) |
| Cursor, selection set, anchor, search-open / keyword | Jotai (`src/atoms/posts.ts`) |
| Grouping, showDrafts, displayProps[] | Jotai (`postsListDisplayAtom`, persisted to localStorage) |
| Toast outputs | sonner |
| Page scope | keymap runtime |

No view-side `create()` of zustand stores. No view-side direct `request` calls — all data goes through `~/hooks/queries/*`.

---

## Accessibility

The list is keyboard-driven by design, which raises the bar — not lowers it — for screen-reader and keyboard-only users.

### Roles & semantics

- The list pane's row container uses `role="listbox"` with `aria-multiselectable="true"`. The header is `role="banner"` (or omitted; default `<header>` semantics suffice).
- Each `<PostRow>` is `role="option"` with:
  - `aria-selected={selection.has(id)}` — driven by the selection set, not the cursor.
  - `aria-current="true"` when this row is the cursor.
  - `aria-label="<title> · <category> · <status>"` so a SR announcement is meaningful even when meta is rendered iconically.
- The status dot has `aria-label="已发布"` / `"草稿"`; `📌` icon when shown has `aria-label="已置顶 · <pinAt>"`.
- The selection-count chip in the floating bulk bar is `aria-live="polite"`; selection size changes are announced once.
- Icon-only buttons (`🔍`, `⏷`, `≡`, `＋`, `📌`, `⎘`, `↗`, `🗑`) all carry an `aria-label`. Lucide icons render as SVG without `<title>` by default; Button primitive must be passed `aria-label`.

### Focus order

- Tab order: pane-header buttons → list (single tab stop on the listbox, then arrow-key navigation within) → pagination → right-pane header buttons → quickedit pills → preview link area → footer links.
- Inside the listbox, native arrow-key navigation is replaced by our `j` / `k` / `arrowup` / `arrowdown` chord handlers. The handlers must call `event.preventDefault()` for the arrow forms, but only when focus is in the listbox (not in any descendant input or popover content).
- When a row is the cursor, focus stays on the listbox container (`role="listbox"`); the cursor row is the `aria-activedescendant` target. This avoids per-row focus jitter while still announcing the active option to SRs.

### Reduced motion

- Floating bar slide-up entrance (`motion`) respects `prefers-reduced-motion`. Skeleton shimmer also respects.

### Color contrast

Status dots, selection borders, hover states, and pinned-row tints all have to clear WCAG AA on the dark canvas. Token v1 lavender (`#5e6ad2`) at 0.10 opacity over `surface1` is the riskiest case — verify against the actual surface during impl, adjust opacity up if needed.

### Mobile parity

Card list items are `role="link"` (single-action card → navigation). Per-card icon buttons (external / edit / delete) carry their own `aria-label`s.

---

## Risks / open dependencies

1. **DatePicker primitive is deferred** (per STATUS.md). The funnel popover's `创建日期` and `修改日期` sections render disabled with a "尚未支持" placeholder until DatePicker ships. Implementation acceptance does not require date filters working end-to-end.
2. **Cover upload** — the existing upload primitive is functional but the `meta.cover` field's persistence model needs a quick check against backend; if missing, mark "封面" row disabled in v1.
3. **History link** — if no revision API exists, render the "历史" footer link as a tooltip-disabled state.
4. **Realtime invalidation** — the SocketBridge already routes `POST_*` events to `queryClient.invalidateQueries`. This view consumes that for free; no extra wiring.
5. **TwoColLayout sizing on narrow desktops** — at viewport widths between 768 (mobile fallback boundary) and ~1100 px, the right pane may feel cramped. Acceptable for v1; revisit if user feedback shows pain.

---

## Acceptance

1. `/posts/view` renders the 2-pane layout matching the mockup on desktop (≥768px), with rows at the 57 px Linear-aligned density (per `02-design-tokens.md` v2 calibrated).
2. Pagination, sort, category filter, search (300ms debounced, matches vue3), pin, status toggle, bulk delete, single delete, jump-to-edit, external view link — all functional with no regression vs. vue3.
3. Funnel popover and display-options popover open, write to atoms / table state correctly, and persist `postsListDisplayAtom` to localStorage.
4. Multi-select works: click / ⌘+click / shift+click / `x` / `mod+a` / `escape` behaviours match the table in **Selection model**. Page change clears selection.
5. Floating bulk action bar appears when selection ≥ 1 and disappears at 0; all six actions fire `Promise.allSettled` with the failure-handling rules in **Bulk failure handling**.
6. Cursor (active row) is decoupled from selection; right pane re-fetches `usePostDetail` when cursor changes; mouse hover does not move cursor.
7. List states are all reachable: loading initial / loading subsequent / error / empty (no posts) / empty (filtered) / empty (searched) / category-load failure inside funnel popover.
8. Keyboard chord table fully registered in `posts.list` page scope; opening any Modal/Popover/Drawer/kbar suppresses underlying chords (verified by mounting each primitive in turn). Letter-class chords are auto-suppressed when search bar has focus — verified by typing `j` and `Shift+D` into the search input.
9. CJK input via IME does not fire any chord (verified by triggering `compositionstart` / `compositionend` in test or by manual smoke).
10. `mod+backspace` and `p` are repeat-suppressed; `j` / `k` / arrow forms are repeat-allowed.
11. Mobile fallback (`<768px`) renders `<MobileCardList>` with feature parity to vue3 cards (external link / edit / delete actions, search bar, pagination). `<TwoColLayout>` is not in the render tree on mobile.
12. ARIA: row container is `role="listbox"`, rows are `role="option"` with correct `aria-selected` / `aria-current`, all icon-only buttons have `aria-label`, selection-count chip is `aria-live="polite"`. Verified manually with VoiceOver / NVDA.
13. typecheck + oxlint clean on changed files; vitest cases for `BulkActionBar`, `Row`, `RightHeader`, `Quickedit`, the `usePostsList` hook, and the cursor/selection atom interactions all green (estimate 16–22 cases).

## Out-of-scope follow-ups

- DatePicker primitive (separate spec)
- Saved views / "保存当前筛选为视图" (defer to a future iteration if user research shows demand)
- Density toggle
- URL-sync deep links into `selectedPostIds` (not in v1; selections are session-only)
- Right-pane drag-resize handle
- Right-pane "panel pinning" (always-open vs hover-to-show — currently always-open)
