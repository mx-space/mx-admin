# ContentListToolbar Layout Rebalance — Design

**Status:** Draft
**Date:** 2026-05-27
**Scope:** `apps/admin/src/features/_shared/components/content-list-toolbar.tsx`
**Consumers:** `PostsRouteViewContent.tsx`, `NotesRouteViewContent.tsx`
**Author:** Innei

## Problem

The current `ContentListToolbar` packs search, filter, sort, refresh, and selection controls onto a single 40px row. Two specific imbalances make the row feel uncoordinated:

1. **Search bar dominates the left.** It is `max-w-80` (320px) wide and ends with a heavy `border-r` separator, visually pinning it as a "compartment" that does not belong with the action chips that follow.
2. **Right-side cluster has uneven weight.** When no rows are selected, the right edge holds a tiny grey checkbox plus the text "选择当前页". The moment any row is selected, that area becomes a black-on-white inverted chip (`bg-neutral-950 text-white`) that bundles checkbox + count + bulk-action button. The visual weight swings sharply between the two states, and neither state matches the lightweight filter/sort chips next to it.

The goal is to rebalance positioning so the search bar reads as a peer to the action chips, and to harmonise the selection control with the rest of the toolbar regardless of state. The component API stays the same; both consumers must continue to render without changes.

## Goals

- Search bar reads as a peer to filter/sort chips, not a separate compartment.
- All non-search controls form a single right-aligned cluster with visible grouping.
- Selection control has the same visual weight whether empty or populated.
- No changes to `ContentListToolbarProps` or to either route view file.

## Non-Goals

- No structural rework (no floating bulk-action bar, no mode-switching toolbar).
- No mobile-specific collapse strategy beyond what already exists.
- No changes to `ContentListHeader`, `SortMenu`, or the underlying `Checkbox` primitive.
- No additional props on the selection slot.

## Design

### Toolbar layout

Left to right:

1. **Search form** — `flex-1 max-w-60` (240px ceiling, shrinks below). Removes `border-r border-neutral-200 pr-3`. No separator after.
2. **Spacer** — `min-w-0 flex-1` pushes the rest to the right.
3. **Filters slot** — unchanged (currently a `SelectField` styled as a chip).
4. **Sort menu** — unchanged.
5. **Vertical separator** — `span.w-px.h-3.5.bg-neutral-200.dark:bg-neutral-800`, separating sort+filter from utility actions.
6. **Extra actions slot** — refresh button etc.
7. **Selection slot** — see below.

Container metrics (`h-10`, `gap-1.5`, padding `px-4`, border-bottom) stay the same.

### Selection control

Replaces the current "empty → tiny checkbox+text" / "selected → inverted black chip" pair with two consistent states sharing the same visual register as filter/sort chips.

**Empty state.** A bare `Checkbox` (no text label) wrapped in a label element. `aria-label` is taken from `selection.selectAllLabel` so screen readers still announce "选择当前页". The sm-and-up text is removed.

**Selected state.** Two side-by-side chips in place of the single inverted pill:

- **Count chip** (`h-7`, neutral surface):
  - `inline-flex items-center gap-1.5 h-7 px-2 rounded text-xs tabular-nums`
  - `bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200`
  - Contents: checkbox + `selection.selectedLabel`.
- **Bulk action chip** (`h-7`, danger tone — both current consumers use it for batch delete, so the styling encodes destructive intent at the component level):
  - `inline-flex items-center gap-1.5 h-7 px-2 rounded text-xs`
  - `border border-red-200 bg-red-50/60 text-red-700 hover:bg-red-100`
  - `dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50`
  - `focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)]`
  - `disabled:pointer-events-none disabled:opacity-50`
  - Contents: `selection.bulkActionIcon` + `selection.bulkActionLabel`.

Bulk action chip remains a `<button>`. Count chip stays a `<label>` wrapping the checkbox so clicking the count still toggles select-all.

### What changes in the file

`apps/admin/src/features/_shared/components/content-list-toolbar.tsx` only.

| Section | Change |
|---|---|
| Search `<form>` | Drop `max-w-80 border-r border-neutral-200 pr-3 dark:border-neutral-800`. Set `flex-1 max-w-60`. |
| Toolbar body | Move spacer (`min-w-0 flex-1`) from its current position (between `extraActions` and `selection`) to sit immediately after the search form, so search anchors the left and all other controls pack right. Insert a `w-px h-3.5` vertical separator between `sortMenu` and `extraActions`. |
| `ContentListToolbarSelectionControls` (empty branch) | Replace the `inline-flex h-7 ... gap-3 text-xs` block with a label that contains only `<Checkbox>` (no `<span>`). Keep `aria-label`. |
| `ContentListToolbarSelectionControls` (selected branch) | Replace the single black `inline-flex h-7 ... bg-neutral-950 text-white` chip with two adjacent chips per the spec above. |

### What stays the same

- `ContentListToolbarProps` and `ContentListToolbarSelection` interfaces.
- All callers in `PostsRouteViewContent.tsx` and `NotesRouteViewContent.tsx`.
- `ContentListHeader`, `SortMenu`, `SortOrderButton` exports.
- Keyboard focus order (search → filter → sort → refresh → select-all → bulk-action).
- Behaviour for `hasVisibleItems === false` (right side renders an empty container).

## Risks

- **Hardcoding danger tone for the bulk action.** Today both consumers pass "批量删除". A future non-destructive bulk action would look wrong in red. Mitigation: add a `bulkActionTone?: 'default' | 'danger'` prop only when that need actually appears. YAGNI for now.
- **Empty-state checkbox without visible label.** Discoverability drops slightly. Mitigation: `aria-label` and `title` carry the meaning; the count chip appears the moment one row is selected.

## Validation

- Visual: open `/posts` and `/notes` at desktop and `tablet:` breakpoints, verify spacing and that selection states transition without layout shift.
- Lint: `pnpm -C apps/admin exec oxlint apps/admin/src/features/_shared/components/content-list-toolbar.tsx`.
- Typecheck: `pnpm -C apps/admin exec tsc --noEmit --pretty false`.
- Manual: select rows on both views, exercise bulk-delete confirmation, exercise clear-search, refresh, sort menu, filter dropdown.
