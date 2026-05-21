# DataTable Design

**Date**: 2026-05-10
**Owner spec**: [12-table-effort.md](./2026-05-06-react-migration/12-table-effort.md)
**Phase**: P2 (advance from "parallel from end of P2" to "ships during P2")
**Supersedes**: spec 12 §"Public API" / §"Sub-components" / §"Mobile strategy" / §"Filter" / §"Bulk-action TableBulkBar"

This document is the architectural design for the DataTable component. The migration's roadmap originally placed Table on a parallel track ending in P5; this design pulls a one-shot MVP into P2 because every list view in P3 depends on it. It refines spec 12: the headless library choice (TanStack Table v8) is preserved; the surface area, state ownership, and "what's in the box" are redesigned to match what the source repo actually does at the consumer side.

---

## Goals

1. One `<DataTable>` for ~17 P3 list views to render against without duplicated boilerplate.
2. Idiomatic for the 80% CRUD case; escape hatch for the异型 (analyze view, etc.).
3. Aligned with the project's state allocation rule: server data → TanStack Query, page-local table state → Jotai atomFamily.
4. Reuses existing `~/components/ui` primitives wherever possible; no parallel UI re-implementation.
5. MVP ships one-shot — desktop rows + sort + selection + paging + loading + empty. No filter UI, no mobile mode, no bulk bar inside the box; those are view-side concerns.

## Non-goals (explicitly out of box)

- **Per-column filter UI**. View renders its own `<FilterBar>` above the table and writes to `state.filters`.
- **Mobile card rendering**. View switches at the breakpoint to a hand-rolled `<MobileCardList>`, passing the same data + selection atom; the table component renders only desktop rows.
- **Bulk-action floating bar**. Bulk actions live in the layout header (`<HeaderActions>`); they read `selectedRowKeys` from the same atomFamily.
- **URL sync**. Deferred. A later opt-in `useUrlSyncedTableState` may wrap the same atomFamily.
- **Virtualization**. Deferred. Will land later for `/files/orphans`-class views via opt-in `virtualized` prop.
- **Column resize / column visibility menu**. Deferred until a P3 view demands. (Sticky columns shipped in v1 — see §"Sticky columns".)
- **Tree / nested rows**. Out of scope; mx-admin's only tree-shaped surface (categories) uses a separate tree view.

## Decisions snapshot

| # | Decision | Rationale |
|---|---|---|
| 1 | Headless lib: **TanStack Table v8** | Aligns with TanStack Query + Form already adopted; community + types mature. |
| 2 | Phasing: **MVP one-shot in P2** | Every P3 list view needs it; placeholder-then-real is wasteful when the real surface is small. |
| 3 | Architecture: **C-then-B** — compound parts + slim wrapper | 80% case writes one line; 20%异型 imports parts. |
| 4 | State: **Jotai atomFamily** (`tableStateAtomFamily(key)`) | Page-local fan-out (header reads `selectedRowKeys`); persists within session for back-nav memory. |
| 5 | Server data: **TanStack Query** with `keepPreviousData` | Already canonical. |
| 6 | Sugar: **`useTableQuery({ key, queryFn })`** | One-line for CRUD; low-level `useDataTableState` + `useQuery` still public. |
| 7 | Visual: **dark canvas, three densities, hover + selected row tint** | See §"Visual contract"; mockup at `.superpowers/brainstorm/272-1778412358/content/visual-direction.html`. |
| 8 | Reuse existing primitives | `<Checkbox> <Radio> <Skeleton> <Empty> <Pagination> <Tag> <Tooltip> <Ellipsis> <Scroll> <Select> <Popover> <Button>` |
| 9 | Sticky-column **shipped in v1** | `meta.fixed: 'left' \| 'right'` — derived into TanStack `state.columnPinning`; selection column auto-pins left. Edge cells get a soft scroll-shadow. |
| 10 | Loading **split** at the prop boundary | `loading` (initial — show skeletons) and `refetching` (background — keep rows). Single `loading: boolean` is too coarse. |

---

## Architecture · five layers

### ① Atom — page-local fan-out

`src/atoms/table.ts`:

```ts
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

export interface TableState {
  page: number
  pageSize: number
  sortBy: string | null
  sortOrder: 'asc' | 'desc' | null
  filters: Record<string, unknown>
  selectedRowKeys: string[]
  density: 'compact' | 'comfortable' | 'roomy'
}

const defaultState: TableState = {
  page: 1, pageSize: 20, sortBy: null, sortOrder: null,
  filters: {}, selectedRowKeys: [], density: 'comfortable',
}

export const tableStateAtomFamily = atomFamily((_key: string) =>
  atom<TableState>({ ...defaultState }),
)

export const resetTablePagingAtom = atomFamily((key: string) =>
  atom(null, (get, set) => {
    const s = get(tableStateAtomFamily(key))
    set(tableStateAtomFamily(key), { ...s, page: 1, selectedRowKeys: [] })
  }),
)
```

`atomFamily` caches by key; back-navigation to the same list returns to the same page/sort/density.

**Key namespace contract**. Keys must be globally unique per app (the family is one bucket for the whole session). Convention: `'<route-id>:<table-id>'` — e.g. `'posts:list'`, `'analyze:guests'`. Plain `'posts'` is acceptable when only one table exists in that route.

**Lifecycle**. atomFamily entries do **not** auto-evict on component unmount — that's intentional (back-nav memory) but means stale entries accumulate. Cleared at two points:
- **Logout** (`useLogout` from spec 06): calls `tableStateAtomFamily.setShouldRemove(() => true)` once, then resets it back via `setShouldRemove(null)`. This evicts every entry. Wiring this into `useLogout` is part of this implementation's change-set — current `useLogout` does not yet do it.
- Manual reset for a specific table (e.g. on filter change): use `useSetAtom(resetTablePagingAtom(key))()`.

### ② Low-level public hook — TanStack Table bridge

`src/components/table/hooks/useDataTable.ts` returns a `Table<T>` instance with bidirectional state sync. View-supplied `state` flows in; user gestures (header click → sort, row checkbox → selection) flow out via `setState`. Uses `manualPagination: true` and `manualSorting: true`; client-side pagination is not supported (the source repo never used it).

This hook is exported from `~/components/table` and is the only entry point used by异型 views composing parts directly. The slim `<DataTable>` wrapper calls the same hook internally.

```ts
export interface UseDataTableOptions<T> {
  data: T[]
  columns: ColumnDef<T>[]
  totalCount: number
  state: TableState
  setState: (s: TableState) => void
  rowKey: (row: T) => string
}

export const useDataTable = <T>(opts: UseDataTableOptions<T>): {
  table: Table<T>
  state: TableState
  setState: (s: TableState) => void
}
```

### ③ Compound parts — controlled primitives

```
src/components/table/parts/
├── TableHeader.tsx        // <thead>, sort glyphs, alignment from meta.align
├── TableBody.tsx          // <tbody>, skeleton-rows when loading, empty fallback
├── TablePagination.tsx    // wraps ~/components/ui/Pagination
├── TableEmpty.tsx         // wraps ~/components/ui/Empty
├── TableLoading.tsx       // wraps ~/components/ui/Skeleton in row shape
├── TableDensityToggle.tsx // 3-segment toggle reading state.density
└── TableSelectionCell.tsx // wraps ~/components/ui/Checkbox
```

All parts accept `instance: Table<T>` (the TanStack `Table` instance, i.e. the `.table` field of `useDataTable`'s return). Visual parts have no internal state.

异型 view example:

```tsx
const { table } = useDataTable({ data, columns, totalCount, state, setState, rowKey })
return <DataTable.Header instance={table} />  // pass the Table<T>, not the wrapper return
```

### ④ Slim wrapper — `<DataTable>`

```tsx
export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  totalCount: number
  state: TableState
  setState: (s: TableState) => void
  rowKey: (row: T) => string
  loading?: boolean                         // initial-load only — show skeletons; equivalent to query.isLoading
  refetching?: boolean                      // background refetch — keep rows visible; view typically shows a Tag badge
  empty?: ReactNode                         // overrides default <TableEmpty>
  selectable?: boolean                      // injects selection column (multi)
  selectionMode?: 'single' | 'multiple'     // default 'multiple'; 'single' renders Radio cells
  isRowSelectable?: (row: T) => boolean     // disables checkbox/radio cell when false
  onRowClick?: (row: T) => void
  showPagination?: boolean                  // default true; false hides footer
  showDensityToggle?: boolean               // default false; opt-in
  className?: string
}

export function DataTable<T>(props: DataTableProps<T>): JSX.Element

DataTable.Header = TableHeader
DataTable.Body = TableBody
DataTable.Pagination = TablePagination
DataTable.Empty = TableEmpty
DataTable.Loading = TableLoading
DataTable.DensityToggle = TableDensityToggle
DataTable.SelectionCell = TableSelectionCell
```

The wrapper composes parts inside a plain viewport `<div className={scrollViewportStyle}>` with `overflow-x: auto`. The plain `<div>` is intentional — wrapping in Base UI's `<Scroll>` triggered an unhandled `Element.getAnimations is not a function` in happy-dom, and a plain scroll container is sufficient: the table's `min-width: max-content` lets long rows expand and the viewport takes over horizontal scroll. Custom scrollbar styling can be layered on later via `::-webkit-scrollbar` selectors if needed. 异型 views import parts directly and skip the wrapper.

### ⑤ Query sugar

`src/hooks/queries/useTableQuery.ts`:

```ts
export const useTableQuery = <T>(opts: {
  key: string
  queryFn: (state: TableState) => Promise<{ data: T[]; total: number }>
  defaultPageSize?: number
  enabled?: boolean
}): {
  state: TableState
  setState: (s: TableState) => void
  data: T[]
  totalCount: number
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<unknown>
}
```

Internals: `useAtom(tableStateAtomFamily(key))` + `useQuery({ queryKey: ['table', key, serverFields(state)], queryFn: () => opts.queryFn(state), placeholderData: keepPreviousData })`.

**Critical**: the query key must include only server-affecting fields. `serverFields(state)` returns `{ page, pageSize, sortBy, sortOrder, filters }`. `selectedRowKeys` and `density` are intentionally excluded — toggling selection or density would otherwise force a refetch, which is a footgun the original draft missed.

The atom default `pageSize` is set on first read by the hook only if `defaultPageSize` is provided and the current value still equals the global default; this avoids overwriting user-set sizes.

`setState` accepts both value and functional updater forms (`(prev) => next`); concurrent flows that spread the previous value (e.g. simultaneous filter change + selection clear) must use the functional form to avoid lost writes.

---

## Column definition

Pass-through TanStack Table `ColumnDef<T>`. The `meta` field carries our extensions:

```ts
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    align?: 'start' | 'center' | 'end'
    width?: number
    sortable?: boolean        // shorthand for enableSorting; defaults to false
    headerNode?: ReactNode    // for icon-only headers
    fixed?: 'left' | 'right'  // sticky-column (shipped in v1; see "Sticky columns" below)
  }
}
```

Filter-related meta is intentionally absent — filters are not a column concern in this design.

Selection column is injected automatically when `selectable` is true; views never define it manually.

### Sticky columns (v1, shipped 2026-05-10)

`meta.fixed: 'left' | 'right'` is rendered as a sticky column. `useDataTable` walks `columns`, builds `{ left: id[], right: id[] }`, and feeds `state.columnPinning` to `useReactTable`. `<TableHeader>` and `<TableBody>` read `column.getIsPinned()` and apply inline `position: sticky` with `left: getStart('left')px` or `right: getAfter('right')px`. The selection column (when `selectable` is true) carries `meta.fixed: 'left'` by default and is therefore pinned automatically.

Pinned body cells read their background from a CSS custom property `rowBgVar` set by `rowRecipe`, so selected/hover state propagates through the sticky cell — without this they would render transparent and content would bleed through during horizontal scroll. The opaque equivalents of the semi-transparent selection backgrounds are pre-computed (composited over `surface1`).

Boundary cells (last left-pinned, first right-pinned) get a soft scroll-shadow via `box-shadow: 6px 0 6px -6px rgba(0,0,0,0.45)` (mirrored on the right). The shadow is subtle when columns aren't scrolled and lifts visually when content slides under the pinned region.

`meta.fixed` requires an explicit `column.id`; columns missing one are skipped with a dev-only `console.warn`.

---

## Visual contract

Linear dark canvas, tokens from spec 02 v1 calibrated. The mockup at `.superpowers/brainstorm/272-1778412358/content/visual-direction.html` (kept in `.superpowers/`) is the visual reference until the implementation lands.

Key tokens / values:

- Table outer border: `hairline-1` (#23262b) + 6px radius
- Row separator: `hairline-2` (#1f2226), 1px
- Header bg: `surface2` (#171a1d)
- Row hover: `surface2`
- Selected row: `rgba(124, 109, 239, .08)`; selected + hover: `.12`
- Density paddings (vertical): `compact 6px / comfortable 11px / roomy 14px` (defaults to `comfortable`)
- Sort glyph: `↕` muted at rest, `↑` / `↓` brand-purple when active
- Refetching badge: `<Tag>` with brand-purple tint (rendered by view, not by box)
- Empty state: `<Empty>` primitive
- Loading skeleton: 8 rows of 4 inline `<Skeleton>` slabs at 11px height (matches comfortable cell)

The header row is sticky to the table container's top in MVP; full-page sticky-header is deferred until a view demands.

---

## Reused primitives

| Concern | Used | Notes |
|---|---|---|
| Selection cells | `<Checkbox>` | indeterminate state for "some rows selected" |
| Skeleton rows | `<Skeleton>` | one slab per cell, 11px height |
| Empty state | `<Empty>` | default body; override via `empty` prop |
| Pagination footer | `<Pagination>` | wraps the existing component; `pageSize` + `total` + `onPageChange` + `onPageSizeChange` already match our atom shape. **Reconciliation**: when `total` shrinks (e.g. delete + refetch) such that current `page > maxPage`, `<TablePagination>` must `setState((s) => ({ ...s, page: max(1, ceil(total / pageSize)) }))` in an effect; the existing `Pagination` clamps display only |
| Refetching badge | `<Tag>` | rendered view-side beside title |
| Sort header tooltip | `<Tooltip>` | "点击切换：升序 → 降序 → 不排序" |
| Cell truncation | `<Ellipsis>` | view-side; not part of the box |
| Horizontal overflow | `<Scroll>` (view-side, deferred from box) | MVP renders the table in a plain viewport `<div>`. Wide-column views wrap `<DataTable>` in `<Scroll horizontal>` themselves until v1 lifts it inside the box. |
| Page-size dropdown | `<Select>` | already inside `<Pagination>` |
| Row actions menu | `<Popover>` + `<Button>` | view-side `<RowActions>` component |

---

## View-side patterns

### CRUD (80%)

```tsx
const { state, setState, data, totalCount, isLoading, isFetching } = useTableQuery<PostModel>({
  key: 'posts:list',
  queryFn: (s) => postsApi.getList({
    page: s.page, size: s.pageSize,
    sortBy: s.sortBy, sortOrder: s.sortOrder,
    ...s.filters,
  }),
})

return (
  <>
    <FilterBar
      value={state.filters}
      onChange={(f) => setState((prev) => ({ ...prev, filters: f, page: 1, selectedRowKeys: [] }))}
    />
    <DataTable
      data={data} totalCount={totalCount}
      columns={postColumns}
      state={state} setState={setState}
      rowKey={(r) => r.id}
      loading={isLoading}                           {/* initial — skeletons */}
      refetching={isFetching && !isLoading}         {/* background — keep rows */}
      selectable
    />
  </>
)
```

### Mobile

```tsx
const isMobile = useViewport().mobile
return isMobile ? <PostCardList ... /> : <DataTable ... />
```

### Bulk actions (header)

```tsx
// inside layout header (<HeaderActions>):
const selectedRowKeys = useAtomValue(tableStateAtomFamily('posts:list')).selectedRowKeys
return selectedRowKeys.length > 0 ? <BulkBar keys={selectedRowKeys} /> : null
```

### 异型 (compound)

```tsx
const { state, setState, data, totalCount } = useTableQuery({...})
const { table } = useDataTable({ data, columns, totalCount, state, setState, rowKey })

return (
  <div className={twoCol}>
    <aside><FacetSidebar /></aside>
    <main>
      <DataTable.Header instance={table} />
      <DataTable.Body instance={table} />
      <CustomFooterStats />
      <DataTable.Pagination instance={table} />
    </main>
  </div>
)
```

---

## Migration mapping (admin-vue3 → next)

| vue3 | next |
|---|---|
| `useDataTable<T>({ queryKey, queryFn, pageSize, syncRoute, filters })` | `useTableQuery<T>({ key, queryFn, defaultPageSize? })` — `syncRoute` deferred; `filters` flows through `state.filters` |
| `<Table data pager onUpdateSorter onUpdateCheckedRowKeys onFetchData>` | `<DataTable data totalCount state setState columns rowKey loading selectable>` |
| naive-ui `TableColumns<T>` (`type: 'selection'`, `sorter`, `filterOptions`, `render`, `fixed`) | TanStack `ColumnDef<T>` (`cell`, `enableSorting`, `meta.align`, `meta.width`, `meta.fixed`); `selection` becomes a built-in column injected by `selectable`. `meta.fixed: 'left' \| 'right'` contract locked in MVP, impl in v1 (see "Sticky columns") |
| `checkedRowKeys.value` exposed by hook | `state.selectedRowKeys` in atom; consumer reads via `useAtomValue(tableStateAtomFamily(key))` |
| `setActions(<Bulk />)` in layout | unchanged pattern; `<Bulk />` reads `selectedRowKeys` from atom |
| Mobile branch via `if (isMobile) <CardList /> else <DataTable />` | identical pattern preserved |

---

## File layout

```
src/components/table/
├── DataTable.tsx
├── DataTable.css.ts
├── index.ts                 // barrel: <DataTable>, parts, useDataTable, types
├── hooks/
│   ├── useDataTable.ts      // internal TanStack bridge
│   └── selectionColumn.ts   // helper: built-in selection column factory
└── parts/
    ├── TableHeader.tsx
    ├── TableBody.tsx
    ├── TablePagination.tsx
    ├── TableEmpty.tsx
    ├── TableLoading.tsx
    ├── TableDensityToggle.tsx
    └── TableSelectionCell.tsx

src/atoms/table.ts
src/hooks/queries/useTableQuery.ts
```

---

## Acceptance

### MVP (this design)

1. `<DataTable>` renders rows with sort, selection, pagination from controlled `state` / `setState`.
2. Compound parts work standalone: importing only `<DataTable.Header>` + `<DataTable.Body>` renders correctly without the wrapper.
3. `useTableQuery` integration: changing `state.filters` triggers a refetch; toggling `selectedRowKeys` or `density` does **not** (the query key excludes both); `keepPreviousData` keeps prior rows visible during refetch.
4. Selection: header checkbox toggles all on current page; per-row checkbox toggles individual; indeterminate when some-but-not-all are selected. `selectionMode='single'` renders Radio cells with at-most-one selection. `isRowSelectable` disables the checkbox/radio for predicate-false rows.
5. Sort: clicking a sortable header toggles asc → desc → none; non-sortable headers do not show the affordance.
6. Density toggle (when `showDensityToggle`) writes to `state.density`; cells re-pad without remount **and without refetching**.
7. Empty state renders `<Empty>` (or override) when `data.length === 0 && !loading`.
8. Loading split: `loading=true && data.length === 0` renders skeleton rows; `refetching=true && data.length > 0` keeps rows visible (view shows a Tag).
9. Pagination reconciliation: deleting rows such that current `page > ceil(total/pageSize)` auto-corrects `state.page` via `setState`.
10. `setState` accepts both value and functional updater; functional form is preferred and used in spec examples.
11. `meta.fixed` parses without rendering sticky positioning (deferred); a single `console.warn` in dev mode flags the deferral the first time it's seen per session.
12. Logout (`useLogout`) evicts every `tableStateAtomFamily` entry via `setShouldRemove(() => true) → setShouldRemove(null)`.
13. Reuses `<Checkbox> <Pagination> <Skeleton> <Empty>` — no duplicated UI primitives. (`<Tooltip>` and `<Scroll>` are spec-level allowances; `<Tooltip>` is used view-side for sort-header help; `<Scroll>` deferred to v1 inside the box.)
14. Vitest cases (≥ 10): atom default + reset; query-key purity (selection / density toggle does not refetch); sort toggle; selection toggle (all / one / indeterminate / single-mode); `isRowSelectable` predicate; pagination prop wiring; pagination reconciliation when `total` shrinks; density toggle; empty + loading + refetching state branches; compound part round-trip; functional setState; logout-time atom eviction.
15. Mockup added to `_dev/primitives` page (section 25 · datatable).
16. typecheck + oxlint (changed files only) green.

### Deferred — separate design / spec when needed

- URL sync (`useUrlSyncedTableState`)
- Virtualization (`virtualized` prop)
- Column visibility menu, column resize, sticky first column
- Per-column filter UI inside the box (current design says no)
- Mobile card rendering inside the box (current design says no)

---

## Open questions

- **Page-size persistence across views**. Each table has its own atom. Should `pageSize` default to a per-user persisted value (localStorage) or stay per-table? Pick: **per-table for now**, revisit if users complain.
- **Selection clearing on filter change**. When `state.filters` changes, should `selectedRowKeys` clear? The vue3 hook clears them. Pick: **clear on `filters` change and on `pageSize` change; preserve on `page` change** (lets users batch-select across pages — though we likely never need that).
- **`onRowClick` vs link-in-cell**. Source views prefer link-in-cell (e.g. `<TableTitleLink>`). Pick: **support `onRowClick` but recommend cell-level `<a>` for navigation**, document this.
- **Sticky header**. Default on (per visual). If a list view has many wide columns and `<Scroll>` introduces a horizontal scrollbar, sticky header still works inside the scroll container.

---

## Status & traceability

- Spec 12 row in `STATUS.md` should be updated to point at this design and reflect "P2 in progress".
- Roadmap milestone P2 row notes "DataTable MVP one-shot per `2026-05-10-datatable-design.md`".
- Implementation plan written next via `writing-plans` skill.
