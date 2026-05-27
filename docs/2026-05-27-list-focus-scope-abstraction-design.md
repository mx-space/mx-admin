# List Focus Scope Abstraction & Master-Detail Migration

**Date:** 2026-05-27
**Status:** Draft v2 (incorporates codex review)
**Scope:** `apps/admin/src/ui/list-actions/`, `apps/admin/src/ui/focus-scope/`, `features/drafts`, `features/comments`, `features/topics`

## Revision Notes

v2 addresses the codex review of v1. Substantive changes:

- §5 adds explicit accessibility contract (`role`, `aria-selected`, `aria-current`, keyboard activation), `dataId` validation, full context-menu data-attribute list, shortcut precedence ordering, and a `resetOn` selection-reset hook.
- §6 redesigns the comments selection model: `selectAllMode` is auto-cleared by any per-row selection mutation; this is enforced inside `useListKeyboard` rather than in the view.
- §6 adds a "detail recovery" subsection per feature covering post-delete focus, off-page detailId, and detail-close focus restoration.
- §10 splits the work into three independently mergeable PRs.

## 1. Background

The posts and notes lists support a rich keyboard/mouse interaction model:

- `j` / `k` / `↑` / `↓` / `Home` / `End` for focus navigation, gated by an active focus scope
- `Enter` to open, `⌘+Enter` to open externally, `Backspace` to delete, `⌘+A` to select all, `Escape` to clear focus
- Right-click context menus per row, sharing the same action registry as the shortcut dispatcher
- Single / `⌘`-toggle / `Shift`-range mouse selection with anchor tracking
- Selected / focused / popup-open visual states wired through `data-*` attributes

This is implemented today by a set of composable primitives in `ui/focus-scope/` and `ui/list-actions/`:

- `FocusScope` — DOM marker; tracks active scope via pointerdown/focusin
- `useScopeArrowNav` — binds `j/k/↑/↓/Home/End`, gated on active scope
- `useListSelection` — selection state with anchor support for shift-range
- `useListShortcuts` — keyboard dispatcher for a `ListAction[]` registry
- `buildMenuItemsFromActions` — maps `ListAction[]` to context-menu items
- `ContentEntryListItem` — opinionated two-line row used by posts and notes

Posts/notes wire these together by hand and additionally clear selection on every list-shape mutation (page / filter / search / sort change) via a manual `useEffect`. Master-detail lists (`drafts`, `comments`, `topics`) do not use any of this and rebuild each row's DOM contract from scratch, with inconsistent (or absent) keyboard support.

## 2. Goals

1. Extract a **business-agnostic row primitive** (`ListRow`) that owns the row's DOM/event/data-attribute/context-menu contract but leaves visual content to consumers.
2. Extract a **composite hook** (`useListKeyboard`) that bundles selection + shortcuts + arrow-nav behind a single scope id, single configuration surface, and explicit selection-reset semantics.
3. Migrate **drafts, comments, topics** to the new abstractions, giving each `j/k` navigation, context menu, `Enter` / `Backspace` shortcuts, and in-page checkbox multi-select — without regressing accessibility or master-detail behavior.
4. Refactor `ContentEntryListItem` to sit on top of `ListRow`, preserving posts/notes behavior verbatim.

## 3. Non-Goals

- C-class list pages (`files`, `friends`, `cron`, `webhooks`, `readers`, `says`, `snippets`, `recently`, `subscribe`). Deferred.
- Cross-page "select all" mode itself (the `selectAllMode` flag in comments). It stays a feature-local boolean; this spec only defines when the new selection abstraction must clear it.
- Toolbar / pagination / filter chips redesign.
- New keyboard shortcuts beyond what posts already has, with one minor optional addition flagged in §6.3.

## 4. Architecture

### 4.1 Module layout

```
apps/admin/src/ui/
├── focus-scope/                     # unchanged
│   ├── FocusScope.tsx
│   ├── use-scope-arrow-nav.ts
│   ├── hooks.ts
│   ├── store/
│   └── index.ts
└── list-actions/
    ├── ListRow.tsx                  # NEW
    ├── useListKeyboard.ts           # NEW
    ├── useListSelection.ts          # unchanged
    ├── useListShortcuts.ts          # unchanged
    ├── buildMenuItemsFromActions.ts # unchanged
    ├── types.ts                     # unchanged
    └── index.ts                     # adds ListRow + useListKeyboard exports
```

`features/_shared/components/content-list-item.tsx` (`ContentEntryListItem`) is updated to delegate row plumbing to `ListRow`, keeping its public props identical.

### 4.2 Layering

```
                  ┌───────────────────────────────────────────┐
                  │ Feature view (e.g. DraftsRouteViewContent) │
                  │ - owns list query, filters, mutations      │
                  │ - calls useListKeyboard                    │
                  │ - renders <FocusScope> + rows              │
                  └───────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
        ┌──────────┐         ┌─────────────┐       ┌────────────┐
        │ ListRow  │         │useListKeyb. │       │ ListAction │
        │ (DOM)    │         │(composite)  │       │ (registry) │
        └──────────┘         └─────────────┘       └────────────┘
                                    │
                ┌───────────────────┼────────────────────┐
                ▼                   ▼                    ▼
        ┌──────────────┐   ┌──────────────────┐  ┌────────────────┐
        │useListSelect.│   │useListShortcuts  │  │useScopeArrowNav│
        └──────────────┘   └──────────────────┘  └────────────────┘
```

`ListRow` and `useListKeyboard` are the public surface. The three underlying hooks remain exported for the rare case a consumer needs finer control (e.g. an alternate selection model), but new feature code should not reach for them directly.

## 5. Component & Hook Contracts

### 5.1 `ListRow`

**Purpose:** Render a single keyboard-navigable, selectable, context-menu-enabled list row. Owns all behavior DOM contract; leaves visual content to children.

**Props:**

```ts
export interface ListRowProps {
  /** Stable, non-empty id. Emitted as data-id; used by selection + arrow-nav. */
  dataId: string

  /** Selection state. Drives `data-selected` and `aria-selected`. */
  selected?: boolean

  /**
   * Click on the row body (away from interactive descendants).
   * `mode` is derived from modifier keys: `range` (Shift), `toggle` (⌘/Ctrl),
   * else `single`.
   */
  onSelect?: (mode: 'single' | 'toggle' | 'range') => void

  /** Context-menu items. May be lazy via callback. Omit to disable context menu. */
  menuItems?: ContextMenuItem[] | (() => ContextMenuItem[])

  /** Optional leading slot (typically a checkbox). Renders as the first grid cell. */
  leading?: ReactNode

  /** Tag name for the row element. Defaults to `article`. */
  as?: 'article' | 'div' | 'li'

  /**
   * Accessibility role. Defaults to `'listitem'` when `as='li'`,
   * otherwise no explicit role (rows ride the host element's semantics).
   * Pass `'option'` if hosted inside an explicit `role="listbox"`.
   */
  role?: 'option' | 'row' | 'listitem'

  /**
   * When `true`, the row reports `aria-current="true"` in addition to
   * `aria-selected`. Use in master-detail lists where there's a single
   * "currently-shown-in-the-detail-pane" row separate from multi-selection.
   */
  ariaCurrent?: boolean

  /** Extra class names to compose with the base row classes. */
  className?: string

  children: ReactNode
}
```

**Validation:**

- `dataId` must be a non-empty string. If empty/whitespace, `ListRow` throws in development (silently skips emitting `data-id` in production). This prevents arrow-nav from selecting an empty key.
- `dataId` uniqueness across visible rows is the caller's responsibility; `ListRow` does not deduplicate. Duplicates collapse to whichever row is matched first by the arrow-nav DOM walk.

**DOM contract (on the row element):**

| Attribute | Source | Notes |
|---|---|---|
| `data-scope-item="row"` | `ListRow` | arrow-nav lookup target |
| `data-id={dataId}` | `ListRow` | selection key |
| `data-selected=""` | `ListRow` when `selected` | drives selected background variant |
| `aria-selected={selected}` | `ListRow` | a11y mirror of `data-selected` |
| `aria-current={ariaCurrent && 'true'}` | `ListRow` | master-detail indicator |
| `tabIndex={-1}` | `ListRow` | focus-managed; only `j/k/click` move focus |
| `data-contextmenu-trigger={id}` | `ContextMenuTrigger` when `menuItems` | global pointer tracking key |
| `aria-expanded={open}` | `ContextMenuTrigger` when menu open | a11y mirror |
| `data-popup-open=""` | `ContextMenuTrigger` when menu open | popup-open background variant |
| `data-state="open"` | `ContextMenuTrigger` when menu open | tailwind variant target |

The four `ContextMenuTrigger` attributes are merged onto the row element by `cloneElement` and **must not be overridden** by `ListRow`'s own attribute set. Spec is satisfied as long as `ListRow` wraps in `<ContextMenuTrigger>` when `menuItems` is provided.

**Keyboard activation:**

- `Enter` on a focused row fires `onSelect('single')`. This is implemented inside `ListRow` (not the registry) so the row is a self-contained primitive.
- `Space` is **not** bound by `ListRow`. Activation lives with `Enter` per existing posts/notes convention.
- Modifier keys at the moment of `Enter` are honored: `Shift+Enter` → `range`, `⌘/Ctrl+Enter` → `toggle`. This matches mouse-click semantics. Caller registries that bind `⌘+Enter` to a different action (e.g. open-external) will fire **after** the row click, and the action registry's `Enter`/`⌘+Enter` shortcut takes precedence — see "Shortcut precedence" in §5.2.

**Click handler:**

- Classifies the event into `single` / `toggle` / `range` using `event.shiftKey` / `event.metaKey || event.ctrlKey` and calls `onSelect`.
- Clicks on interactive descendants are ignored. The interactive selector is the existing constant exposed as `ListRow.INTERACTIVE_SELECTOR`:
  ```
  a[href], button, input, textarea, select,
  [role="menuitem"], [role="checkbox"], [role="button"], [role="link"],
  [contenteditable=""], [contenteditable="true"]
  ```
  v2 broadens the v1 selector (which omitted `textarea`/`select`/`contenteditable`/`role=button`/`role=link`). This is a deliberate behavioral expansion — see §6.4 for the regression check.

**Out of scope (intentional):**

- No title, status, meta, action button slots. Visual concerns stay in feature-level rows.
- No checkbox component. Consumers render their own checkbox into `leading`.
- No virtualization integration. The arrow-nav DOM query already only finds visible rows; virtualized lists are out of scope.

### 5.2 `useListKeyboard`

**Purpose:** Provide selection state, keyboard shortcuts, and arrow-nav for one focus scope, in a single hook call. Make selection-reset explicit.

**Signature:**

```ts
export interface UseListKeyboardOptions<T> {
  scopeId: string
  items: T[]
  getId: (item: T) => string

  /** Action registry; bound to keyboard via `useListShortcuts`. */
  actions: ReadonlyArray<ListAction<T>>

  /** Extra keybindings outside the registry (e.g. `m` for mark). */
  extra?: KeybindingsMap

  /**
   * Whether the default `$mod+a` (select all) / `Escape` (clear + deactivate)
   * extras are installed. Defaults to `true`.
   */
  defaultExtras?: boolean

  /** Disable all keyboard bindings. */
  enabled?: boolean

  /**
   * Custom selection model. Defaults to anchored multi-select via
   * `useListSelection`. Pass a feature-specific implementation when needed.
   */
  selection?: ListSelectionAPI<T>

  /**
   * Dependency array; when any element changes (referential equality), the
   * selection is cleared. Use to wire page/filter/search/sort/mutation resets
   * that posts/notes currently maintain by hand.
   */
  resetOn?: ReadonlyArray<unknown>

  /**
   * Called immediately *before* selection resets (whether via `resetOn`,
   * `Escape`, or any per-row selection mutation). Use for feature-local
   * state that must stay in sync with selection (e.g. comments'
   * `selectAllMode`).
   */
  onBeforeSelectionReset?: () => void

  /**
   * Called by `useScopeArrowNav` after focus moves to a new item. Default:
   * `selection.selectOne(id)`. Override to customize (e.g. drop the
   * implicit `selectOne` when the keyboard cursor should not write to
   * selection).
   */
  onItemFocus?: (id: string) => void
}

export interface UseListKeyboardAPI<T> {
  selection: ListSelectionAPI<T>
  scopeId: string
}

export function useListKeyboard<T>(
  options: UseListKeyboardOptions<T>,
): UseListKeyboardAPI<T>
```

**Behavior:**

1. Builds (or uses caller-provided) `selection` via `useListSelection({ items, getId })`.
2. Calls `useListShortcuts(actions, { scopeId, getTargets: selection.getSelectedTargets, extra: combined })`.
3. Calls `useScopeArrowNav({ scopeId, itemSelector: '[data-scope-item="row"]', onItemFocus: wrapper })`, where `wrapper(el)` reads `el.dataset.id`, returns early if missing/empty, calls `onBeforeSelectionReset?` if the selection-set is about to change, and then either invokes the caller's `onItemFocus(id)` or defaults to `selection.selectOne(id)`.
4. `useEffect` watches `resetOn` deps; on change calls `onBeforeSelectionReset?()` then `selection.clear()`.
5. Patches `selection` (returned to caller) so any mutation method (`selectOne`, `toggle`, `toggleWithAnchor`, `selectRange`, `selectAll`, `clear`) calls `onBeforeSelectionReset?()` first. This is what gives the comments view its `selectAllMode` auto-clear without each call site remembering.

**Shortcut precedence (final, deterministic):**

Final keybindings map is built in this order, with later entries **overriding** earlier ones for the same key:

1. Action registry shortcuts (e.g. `Enter`, `Backspace`, `$mod+Enter`)
2. `defaultExtras` (when enabled): `$mod+a`, `Escape`
3. Caller-supplied `extra`

This means caller `extra` keys can override both `defaultExtras` and the action registry. In development, when a caller `extra` collides with an action registry key, `useListKeyboard` logs `console.warn` with both bindings' identities; the override still applies. This matches `useListShortcuts`' existing precedence (extras iterated last in the binding map build).

**Default extras** (installed when `defaultExtras !== false`):

```ts
{
  '$mod+a': (event) => { event.preventDefault(); selection.selectAll() },
  'Escape': () => { selection.clear(); setActiveScope(null) },
}
```

`Escape`'s `selection.clear()` triggers `onBeforeSelectionReset` per the patched-selection rule above.

### 5.3 `ContentEntryListItem` refactor

`ContentEntryListItem`'s current responsibilities split as follows:

- **DOM contract** (data-attrs, click dispatch, context-menu trigger wrapping, focus ring, `data-scope-item`, `tabIndex`) → moves into `ListRow`.
- **Visual content** (checkbox column + title link + status badge + meta + edit/external/more action buttons) → stays in `ContentEntryListItem`.

**Public prop surface stays identical.** Internal JSX becomes:

```tsx
<ListRow
  as="article"
  className="grid gap-x-3 gap-y-1.5 px-4 py-3 ..."
  dataId={props.dataId}
  leading={selectable ? <Checkbox ... /> : null}
  menuItems={props.menuItems}
  onSelect={props.onSelect}
  selected={props.selected}
>
  <div className="min-w-0">{/* visual leading + title row + meta */}</div>
  <div className="row-start-1 ...">{/* action buttons */}</div>
</ListRow>
```

**Naming clarification** (codex review §G): `ContentEntryListItem.leading` is a **visual** slot rendered inline with the title (a leading icon, pin marker, badge); it differs from `ListRow.leading`, which is the row's **selection/control column** rendered as the first grid cell. The two coexist:

- `ContentEntryListItem.leading` → keeps its current call sites (e.g. posts' pin icon).
- `ListRow.leading` → receives the checkbox.

This naming overlap is intentional: callers of `ContentEntryListItem` continue to pass visual leading and never see the `ListRow.leading` slot, which is internal.

## 6. Migration Plan (Feature-by-Feature)

### 6.1 `drafts`

**Row changes** (`features/drafts/components/DraftRow.tsx`):

- Replace the outer `<button>` with `<ListRow as="article" role="row" ariaCurrent={isDetailTarget}>`.
- Add a checkbox in `leading` (controlled by new `checked` + `onCheck` props).
- Keep the existing badge + title + version + meta layout, now rendered as `ListRow` children.
- Selected visual stays via `data-selected` (from `ListRow`); remove the hand-rolled `bg-neutral-100 dark:bg-neutral-900` toggle.
- New props: `dataId`, `selected` (focus cursor), `isDetailTarget` (drives `aria-current`), `checked` (multi-selection), `onCheck`, `onSelect` (mode-aware variant).

**Accessibility note:** the row was a `<button>`; the new `ListRow` is an `<article role="row">`. To preserve "click anywhere in the row to activate the master-detail open":

- `ListRow` binds `Enter` to fire `onSelect('single')` — the same callback that the click handler fires. Enter therefore opens the detail pane.
- The row still focuses on `j/k`. `:focus-visible` outline is provided by base classes shared with posts/notes.
- `aria-selected` and `aria-current` cover screen-reader state.

This trades native `<button>` semantics for keyboard-driven listitem semantics, which is the same trade posts/notes already accept. The trade is explicit and documented.

**View changes** (`DraftsRouteViewContent.tsx`):

- Wrap the list `<section>` in `<FocusScope id="drafts-list">`.
- Call `useListKeyboard({ scopeId: 'drafts-list', items: drafts, getId, actions, resetOn: [filterType], onBeforeSelectionReset: undefined })`.
- Define `actions` via a new `buildDraftActions.ts`: `Enter` → open detail (single only), `Backspace` → delete (multi-capable).
- Add bulk-delete toolbar; reuse `ContentListToolbar`'s `selection` props (matches posts/notes pattern).
- Replace `handleSelect` with two writers: `onSelect('single')` (or `Enter`) → both `selection.selectOne(id)` and `setDetailId(id)` and `setShowDetailOnMobile(true)`.

**State coupling:**

- `selection` and `detailId` are independent. Keyboard `j/k` only writes selection.
- `selection.size === 1` is the keyboard cursor; `detailId` is what the right pane shows.

**Detail recovery (new in v2):**

- After successful delete: clear `selection` (already happens), clear `detailId`, do NOT auto-advance focus to the next row. The user has already chosen to delete the focused item; auto-advancing is surprising.
- When the list re-fetches and the previous `detailId` is no longer present, render `<DraftDetailEmpty />` (current behavior via `selectedDraft` memo returning `null`). Spec preserves this.
- When the user closes detail (mobile back / Esc + click out): restore focus to the row whose `dataId === detailId` if still present; otherwise to the first visible row; otherwise no focus.

### 6.2 `topics`

Mirrors drafts:

- Row (`TopicRow.tsx`): currently a minimal `<button>`. New: `<ListRow as="article" role="row" ariaCurrent>` + checkbox + meta.
- Actions registry: `Enter` → open detail, `Backspace` → delete (with confirmDialog).
- `resetOn: [page]`.
- Form dialog (`TopicFormDialog`) unaffected.

**Detail recovery:** the existing `useEffect` that clears `selectedId` when the id leaves the visible page (`TopicsRouteViewContent.tsx:65`) is preserved. After delete: clear `detailId`; selection's existing `clear()` runs.

### 6.3 `comments`

**Context menu is new behavior.** `CommentListItem` does not currently have a `ContextMenuTrigger`. This spec adds one. The view-level toolbar buttons (mark-read, mark-junk, batch-delete) remain.

**Selection model:**

- Use the default selection from `useListKeyboard`, plus the existing `selectAllMode: boolean` view-local state for cross-page mode.
- Hook up `onBeforeSelectionReset: () => setSelectAllMode(false)`. This fires automatically on:
  - `Escape`
  - Arrow-nav `selectOne`
  - Any per-row checkbox/click selection mutation
  - `resetOn` deps change (`[state, page]`)
- The cross-page "Select all N items" link explicitly calls `setSelectAllMode(true)` outside the selection API, so it does not trigger `onBeforeSelectionReset`.

This makes `selectAllMode` and `selection` cohabit safely: any user gesture that touches per-row selection invalidates cross-page mode, while toggling cross-page mode does not touch per-row state.

**Batch mutations:**

- `batchStateMutation`: when `selectAllMode` is true, hit `batchUpdateCommentState({ all: true, currentState: state, state: nextState })`. Else hit `batchUpdateCommentState({ ids: selection.getSelectedTargets().map(c => c.id), state: nextState })`.
- `batchDeleteMutation`: same branching with `batchDeleteComments`.

`checkedIds: string[]` and `toggleChecked`/`toggleVisible` are removed; the view derives everything from `selection.selectedIds` + `selectAllMode`. `allVisibleChecked` becomes `comments.length > 0 && comments.every(c => selection.isSelected(c.id))`.

**Actions registry** (new `buildCommentActions.ts`):

- `Enter` → open detail (`multi: false`)
- `Backspace` → confirm-then-delete (`multi: true`)
- Mark-read / mark-junk: **menu-only** (no shortcut by default). An optional follow-up may bind `r` / `m`; not required for this spec.

**Row changes** (`CommentListItem.tsx`):

- Replace `<article>` with `<ListRow as="article" role="row" ariaCurrent={isDetailTarget}>`.
- Lift checkbox into `leading`, wired to `selection.toggleWithAnchor`.
- Remove the manual `props.selected` background; `data-selected` handles it.
- Add `menuItems` for the new context menu.

**Detail recovery:**

- After per-row delete: clear `detailId`, run `selection.clear()` (which auto-clears `selectAllMode`). No auto-advance focus.
- After batch delete: keep behavior identical to today's `batchDeleteMutation.onSuccess` (`setSelectedId(null)`, snapshot cleared, mobile back, invalidate). The new piece: `selection` is already cleared by `useListKeyboard`'s patched API.
- `selectedComment` fallback to snapshot (current `CommentsRouteViewContent.tsx:69-72`) is preserved.

### 6.4 `posts` / `notes`

Behavioral changes are minimized but **not** zero:

- The three hook calls collapse into one (`useListKeyboard`). No surface change to actions / extras.
- `resetOn` deps replace the manual `useEffect(() => selection.clear(), [page, filter, ...])` at `PostsRouteViewContent.tsx:142` and the equivalent in `NotesRouteViewContent.tsx`. Concretely:
  ```ts
  useListKeyboard({
    scopeId: FOCUS_SCOPE_ID,
    items: posts,
    getId: (p) => p.id,
    actions,
    extra: { '$mod+a': (e) => { e.preventDefault(); selection.selectAll() }, Escape: () => { selection.clear(); setActiveScope(null) } },
    defaultExtras: false, // existing posts code provides its own, identical extras
    resetOn: [categoryId, keyword, page, sortKey, sortOrder],
  })
  ```
  (Or `defaultExtras: true` and drop the manual `extra` — identical net result; this spec recommends the latter.)
- The `INTERACTIVE_SELECTOR` broadens (see §5.1). Posts/notes rows do not currently embed `textarea`/`select`/`contenteditable`/`role=button`/`role=link` inside the row body, so the broader selector is a no-op for their existing UI. Verified by code grep at migration time.
- `ContentEntryListItem`'s click classification, title `<Link>`, `ActionLink`/`ActionButton` `stopPropagation`, `Checkbox` `onCheckedChange`, and `data-*` state stack are preserved by routing them through `ListRow` without semantic change.

**Acceptance:** post-migration manual smoke must show identical behavior to pre-migration on every interaction documented in `2026-05-26-posts-notes-row-redesign-design.md`, plus:

- Selection resets on page / filter / search / sort change (now via `resetOn`).
- Selection resets on post-mutation invalidation: handled by `batchDeleteMutation.onSuccess`'s existing `selection.clear()`, which still works because the same `selection` reference is exposed by `useListKeyboard`.

## 7. Data Flow Examples

### 7.1 User presses `j` in drafts

```
keydown 'j'
  → useScopeArrowNav (gated on active scope 'drafts-list')
  → move(1) finds next visible [data-scope-item="row"]
  → element.focus()
  → useListKeyboard's onItemFocus wrapper:
      id = element.dataset.id
      if (!id) return
      // selection set is about to change to {id}:
      onBeforeSelectionReset?.()   // no-op for drafts; in comments clears selectAllMode
      selection.selectOne(id)
  → (detailId stays where it is — Enter or click required to open detail)
```

### 7.2 User right-clicks a comment row

```
contextmenu on ListRow
  → ContextMenuTrigger:
      event.preventDefault()
      resolve menuItems → showContextMenu(items)
      cloneElement sets data-contextmenu-trigger / aria-expanded / data-popup-open / data-state on the row
  → row's data-[popup-open]:bg-neutral-100 variant fires
  → user clicks "Mark as junk" → action.run([comment]) → updateCommentState
```

### 7.3 User shift-clicks the 5th row after clicking the 1st

```
click row 5 (shiftKey: true)
  → ListRow.onClick classifies as 'range'
  → onSelect('range')
  → view calls selection.selectRange(id5)
  → selection picks ids [1..5] from anchor (set by the original single-click on row 1)
  → all five rows get data-selected="" + aria-selected="true"
```

### 7.4 User changes the comments filter while two comments are checked

```
setState(CommentState.Junk) (from filter SelectField)
  → useListKeyboard's resetOn deps `[state, page]` change
  → onBeforeSelectionReset() → setSelectAllMode(false)
  → selection.clear()
  → comments query refetches with new state
```

## 8. Error Handling

No new error paths. Existing failure surfaces:

- Deletion mutations: existing `toast.error(getErrorMessage(...))`.
- Empty list: existing `*Empty` components stay. `useListKeyboard`'s arrow-nav short-circuits when no `[data-scope-item="row"]` element matches; shortcut bindings remain registered but have no targets and no-op via `getTargets().length === 0` guards in `useListShortcuts`.

## 9. Testing Plan

Manual smoke (no automated UI tests in the project today).

**For each migrated page (drafts, comments, topics, plus posts/notes regression):**

1. Click into the list, press `j`/`k` — focus moves, selection follows.
2. `Home`/`End` jumps to first/last visible row.
3. Right-click a row — context menu shows expected items; row gets `data-popup-open` background.
4. `Enter` on a focused row opens detail (also fires action registry's Enter shortcut where defined).
5. `Backspace` on a focused row prompts confirm, then deletes.
6. `⌘+A` selects all visible.
7. `Escape` clears selection and deactivates scope (focus ring goes away).
8. Click row 1, shift-click row 5 — rows 1..5 are selected.
9. Click row 1, ⌘-click row 3 — rows {1, 3} are selected.
10. Hover, popup-open, selected backgrounds layer correctly.
11. Screen reader announces `aria-selected` and (where applicable) `aria-current`.

**Posts/notes regression-specific:**

- Pagination / sort / category filter / search clear selection (was manual; now via `resetOn`).
- Bulk delete confirm + toast paths unchanged.
- Pin / publish / category change row menus unchanged.

**Comments-specific:**

- Cross-page "Select all N items" still works.
- Any per-row checkbox click after cross-page mode is on → cross-page mode clears.
- Arrow-nav after cross-page mode is on → cross-page mode clears.
- Filter change clears both `selectAllMode` and per-row selection.
- `Esc` while cross-page mode is on → both cleared (Escape's default-extras `selection.clear()` triggers `onBeforeSelectionReset`).

## 10. Rollout

Split into **three independently mergeable PRs** to limit blast radius:

**PR A — primitives + posts/notes plumbing rewire**
- Add `ListRow` + `useListKeyboard`, export from `~/ui/list-actions`.
- Refactor `ContentEntryListItem` to delegate to `ListRow`.
- Wire posts/notes to `useListKeyboard` (`resetOn` replaces manual `useEffect`). No visible behavior change.
- **Acceptance:** posts/notes smoke matrix passes verbatim.

**PR B — drafts + topics migration**
- Add `buildDraftActions` / `buildTopicActions`.
- Rewrite `DraftRow` / `TopicRow` on top of `ListRow` + checkbox + context menu.
- Wire `DraftsRouteViewContent` / `TopicsRouteViewContent` to `useListKeyboard`.
- Add bulk-delete toolbar.
- **Acceptance:** drafts/topics smoke matrix passes; posts/notes still pass.

**PR C — comments migration**
- Add `buildCommentActions` (context menu only; no new shortcuts).
- Rewrite `CommentListItem` on top of `ListRow`.
- Wire `CommentsRouteViewContent` to `useListKeyboard` with `onBeforeSelectionReset` → `setSelectAllMode(false)`.
- Drop `checkedIds`/`toggleChecked`/`toggleVisible` in favor of `selection.*`.
- **Acceptance:** comments smoke matrix passes including cross-page mode + filter / arrow-nav interactions.

PRs are sequenced; B and C depend on A. B and C are independent of each other and can land in either order.

## 11. Risks & Open Questions

**Risks:**

- `INTERACTIVE_SELECTOR` broadening could change which descendants suppress row click in feature views that haven't been audited. Mitigation: code-grep at migration time for any of the newly-included roles inside list rows; the spec assumes none exist in posts/notes/drafts/topics/comments.
- `ListRow` choosing `<article role="row">` instead of `<button>` for drafts/topics changes the accessibility surface. Spec explicitly accepts this trade and provides `aria-selected` / `aria-current` / `Enter` activation as compensation. Risk: assistive-tech users who relied on the button role will see different behavior; spec considers this acceptable given posts/notes already moved to this model and there's no recorded a11y complaint.
- `onBeforeSelectionReset` is a global hook on the selection API. Misuse (e.g. throwing inside it) could brick the list. Mitigation: wrap the call in a try/catch in `useListKeyboard` and `console.error` on throw.
- Comments cross-page `selectAllMode` continues to live in `CommentsRouteViewContent`; spec's coupling rule (selection mutation → selectAllMode clears) is enforced by `useListKeyboard` patching the API. If a future consumer reaches into the underlying `useListSelection` directly, the coupling is bypassed. Mitigation: doc this in `useListKeyboard`'s JSDoc and lint-discourage it.

**Open questions for the implementation plan:**

- Whether to bind `r` (mark-read) and `m` (mark-junk) keyboard shortcuts in comments. Spec keeps them menu-only by default.
- Whether `ListRow` should expose an `onRowKeyDown` escape hatch for feature-specific row keys. Not in v2 contract.
- Whether `ListRow` validation throws or silently skips invalid `dataId` in production. v2 specifies dev-throw + prod-silent-skip; a console warn in prod could be added if it surfaces real issues.

## 12. Approval Checklist

- [ ] Scope matches user intent (drafts + comments + topics, posts/notes regression)
- [ ] `ListRow` props surface accepted, including `dataId` validation rule, `role`/`aria-selected`/`aria-current`, Enter activation, broadened INTERACTIVE_SELECTOR
- [ ] `useListKeyboard` signature accepted, including `resetOn`, `onBeforeSelectionReset`, `onItemFocus`, deterministic shortcut precedence with dev-warn on collision
- [ ] `ContentEntryListItem` leading-vs-ListRow.leading naming clarification accepted
- [ ] Comments `selectAllMode` coupling rule accepted (auto-clear on any per-row selection mutation)
- [ ] Detail recovery rules (post-delete, off-page, detail-close focus) accepted per feature
- [ ] Three-PR sequencing accepted
- [ ] Manual smoke matrix sufficient
