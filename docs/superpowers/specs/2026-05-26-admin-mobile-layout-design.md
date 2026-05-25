# Admin Mobile Layout Design

**Date:** 2026-05-26
**Status:** Approved (brainstorming phase)
**Scope:** `apps/admin` shell, page layout primitives, content layout primitives, and table rendering for viewport widths below `lg` (1024px).

## Problem

The admin dashboard was built desktop-first. The shell uses a fixed two-column grid `grid-cols-[240px_minmax(0,1fr)]` with no collapse path. `PageHeader` lays actions in a horizontal flex row that crowds quickly. `ContentLayout` mounts a 320px–50% resizable right panel via `react-resizable-panels` with no mobile branch. Six pages render wide tables with no mobile fallback.

`MasterDetailLayout` is the only primitive with a mobile branch today; it uses a `lg:` (1024px) breakpoint to switch from two-pane to a `translate-x` stack.

Mobile users currently see a 240px sidebar consuming most of the viewport, overflowing headers, and tables that scroll horizontally with no affordance.

## Goals

- Provide a usable layout for viewports `< lg` (1024px) across every admin view.
- Reuse existing UI primitives (`Drawer`, `PageHeader`, `ContentLayout`, `MasterDetailLayout`) rather than parallel mobile implementations.
- Adopt a single breakpoint (`lg`, 1024px) so existing `MasterDetailLayout` and new code agree on what "mobile" means.
- Ship the shell, header, and right-panel changes as Phase 1; table card transforms as Phase 2 per page.

## Non-Goals

- Touch gestures (sheet drag-to-resize, edge-swipe to open drawer). Tap-on-scrim closes are sufficient for v1.
- Tablet-specific intermediate layouts. `< lg` is one mode; `≥ lg` is the other.
- Restructuring the sidebar information architecture (sections, item ordering, depth). The drawer renders the existing tree.
- Settings page tab reorganization (defer to a separate spec; the global rules here apply).

## Breakpoint

`lg` (1024px) is the sole mobile/desktop divider.

- `< lg` → mobile mode: sidebar in drawer, `PageHeader` icon-only actions, `ContentLayout` aside in bottom sheet, tables as cards.
- `≥ lg` → desktop mode: current behavior unchanged.

Rationale: `MasterDetailLayout` already uses `lg:` for its mobile branch. Introducing a second breakpoint (e.g., `md`) would force two stacked mode transitions and complicate the mental model.

## Design

### 1. Shell sidebar — slide-in drawer (`apps/admin/src/shell.tsx`)

Decision: **A. Slide-in Drawer.** The sidebar is hidden by default on mobile, opens from the left edge as an overlay, and dismisses via scrim tap, Escape, or navigation.

Implementation:

- The root grid becomes `grid lg:grid-cols-[240px_minmax(0,1fr)]` (single column on mobile). The `<aside>` is hidden on `< lg` via `hidden lg:flex`.
- A second copy of the sidebar content is rendered inside `<Drawer side="left">` and shown only on `< lg`. The drawer's `open` state lives in `AdminShell` (`const [navOpen, setNavOpen] = useState(false)`).
- `Drawer` already supports `side="left"`. Reuse it as-is. Default width `w-[min(85vw,18rem)]` for the nav variant.
- Auto-close on route change: `useEffect` watching `location.pathname` to call `setNavOpen(false)`.
- The shell exposes `navOpen` and `setNavOpen` to descendants via a `ShellNavContext`. `PageHeader` consumes it to render the hamburger trigger (next section).

Extract the sidebar body (the `<nav>` + footer block currently inline in `AdminShell`) into a `SidebarBody` component so both the desktop `<aside>` and the mobile `<Drawer>` render the same tree without duplication.

### 2. `PageHeader` — hamburger + icon-only actions (`apps/admin/src/ui/page-layout.tsx`)

Decision: **B. All icon-only on mobile.** The drawer trigger occupies the leading slot. Trailing actions render as icons with `aria-label` and tooltip; on desktop they render with their text labels.

Implementation:

- Add a leading hamburger button rendered only when `< lg`. It reads `setNavOpen` from `ShellNavContext` and is positioned before `back` and `title`. Hidden via `lg:hidden`.
- Replace the `actions: ReactNode` prop with a typed actions API:
  ```ts
  type HeaderAction =
    | { kind: 'button'; icon: LucideIcon; label: string; onClick: () => void; primary?: boolean; disabled?: boolean }
    | { kind: 'custom'; node: ReactNode; mobileNode?: ReactNode }
  ```
  - `actions?: HeaderAction[]` — preferred shape.
  - Continue to accept legacy `actions: ReactNode` for incremental migration. Legacy actions render as-is on both breakpoints (no auto icon-ification). Callers migrate page-by-page.
- For `kind: 'button'`, mobile renders an icon-only square button (`size-9`) with the label as `aria-label` and `title`; desktop renders icon + label.
- For `kind: 'custom'`, callers may supply `mobileNode` to substitute a compact form for `< lg`; if omitted, the desktop node renders on both.

`HeaderBackButton` already exists and stays unchanged.

### 3. Tables — card transform via `ResponsiveDataTable` (`apps/admin/src/ui/data-table.tsx`)

Decision: **B. Card transform.** Each row renders as a card on `< lg` with primary field highlighted and remaining fields as `label · value` rows.

Implementation:

- Phase 1 (this spec): introduce a new primitive alongside the existing `DataTable`:
  ```tsx
  <ResponsiveDataTable<Row>
    rows={rows}
    columns={[…]}
    mobileCard={(row) => <DefaultRowCard row={row} />}
  />
  ```
  - `< lg` → render `rows.map(mobileCard)`.
  - `≥ lg` → render the existing table (delegate to current `DataTable`).
- Provide a `<DefaultRowCard>` helper that, given `columns`, picks the first column as the title and renders the rest as a two-column `label · value` grid. Pages can pass a custom `mobileCard` for richer layouts.
- For pages **not yet migrated**, wrap the existing `<table>` in `<div class="overflow-x-auto -mx-4 px-4">` as a safe fallback so nothing visually breaks on mobile.
- Phase 2 (out of scope for the spec but listed for tracking): migrate `settings-page.tsx`, `analyze-page.tsx`, `friends-page.tsx`, `markdown-page.tsx`, `snippets-page.tsx`, `ai-page.tsx` to `ResponsiveDataTable` or a hand-tuned `mobileCard`.

### 4. `ContentLayout` aside — bottom sheet (`apps/admin/src/ui/content-layout.tsx`)

Decision: **A. Bottom sheet.** On `< lg`, the right aside becomes a bottom-anchored sheet that opens to half height by default and can expand to (near) full height.

Implementation:

- Add a `BottomSheet` primitive at `apps/admin/src/ui/bottom-sheet.tsx`. It mirrors `Drawer` but slides up from the bottom:
  - Two snap points: `half` (60vh) and `full` (95vh). Toggle button in the sheet header switches between them. No drag in v1.
  - Drag-handle bar at the top is visual only (no gesture).
  - Scrim tap, Escape, and explicit close button all close the sheet.
  - `useFloatingZ('drawer')` for z-stacking parity with `Drawer`.
- `ContentLayout` adds a `< lg` branch:
  - The desktop `<PanelGroup>` is wrapped in `hidden lg:flex`.
  - On `< lg`, the main pane fills the viewport. The aside element is mounted inside `<BottomSheet open={props.open} onClose={…}>`. `ContentLayoutContext.asideEl` points to the sheet body on mobile and the panel body on desktop — same portal target, different host.
  - `ContentLayoutSlot` continues to portal into `asideEl` and needs no change.
- `props.open` already controls aside visibility; on mobile the same flag drives sheet open/closed. Pages need no API change.
- `AsidePanel`'s existing header (title + close) renders inside the sheet; its `onClose` becomes the sheet's close path.

### 5. `MasterDetailLayout` — already mobile-aware

No changes. Confirm it continues to use the `lg:` breakpoint and that `PageHeader.back` is wired by consumers when entering the detail pane on mobile (this is already the pattern in `comments-page.tsx`, `drafts-page.tsx`, etc.).

## File Touch List

**Phase 1 (this spec):**

- `apps/admin/src/shell.tsx` — grid breakpoint, nav drawer mount, `ShellNavContext`, extract `SidebarBody`.
- `apps/admin/src/ui/page-layout.tsx` — `PageHeader` hamburger, typed `actions` API, icon-only mobile rendering.
- `apps/admin/src/ui/bottom-sheet.tsx` — **new** primitive.
- `apps/admin/src/ui/content-layout.tsx` — mobile branch routing aside to `BottomSheet`.
- `apps/admin/src/ui/responsive-data-table.tsx` — **new** `ResponsiveDataTable` and `DefaultRowCard`. `data-table.tsx` stays untouched and is the desktop delegate.
- All current `PageHeader` callers compile unchanged because the legacy `actions: ReactNode` prop is preserved.

**Phase 2 (separate work):**

- The 6 table pages migrate to `ResponsiveDataTable` with custom `mobileCard` renderers.
- High-traffic `PageHeader` callers migrate from legacy `actions: ReactNode` to the typed `actions: HeaderAction[]` API so they get icon-only mobile rendering.

## Testing

- `apps/admin/src/ui/__tests__/page-layout.test.tsx` (new) — assert hamburger renders only when context provided; legacy `actions` ReactNode still works; typed actions render label on desktop, icon-only on mobile (via `matchMedia` mock).
- `apps/admin/src/ui/__tests__/bottom-sheet.test.tsx` (new) — open/close lifecycle, Escape closes, scrim click closes, snap toggle changes height class.
- `apps/admin/src/ui/__tests__/content-layout.test.tsx` (new) — `< lg`: aside slot portals into sheet body; `≥ lg`: aside portals into panel body.
- Manual: open `write-page` at 375px width, verify nav drawer opens via hamburger, meta panel opens as bottom sheet, sheet half→full toggle works, scrim closes both.

## Open Questions

- Sheet snap heights (60vh / 95vh) are placeholders. May tune after first manual pass on `write-page` with the on-screen keyboard.
