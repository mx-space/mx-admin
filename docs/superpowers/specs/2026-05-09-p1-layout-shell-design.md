# P1 Layout Shell · Design

**Date**: 2026-05-09
**Status**: design approved, plan pending
**Phase**: P1 vertical-slice (layout shell focus)
**Owner spec**: [00-roadmap.md](./2026-05-06-react-migration/00-roadmap.md)
**Depends on**: 02 (tokens), 03 P0 (Button / Input / Card / Modal / Toast), 04 P0 (`useAuthStore`, `useUIStore`), 05 P0 (`useAppInfoQuery`), 06 P0 (`ProtectedRoute`, route tree)
**Refines**: [07-layouts-patterns.md](./2026-05-06-react-migration/07-layouts-patterns.md) — supersedes its hook-based header injection model
**Feeds**: P3 view porting (each view returns one of these layout components as its root)

---

## Goal

Ship a Linear-style admin shell that satisfies two outcomes simultaneously:

1. **Visual target for token calibration** — the chrome (sidebar, header, content surface) renders at high enough fidelity to confront `02-design-tokens.md` v0 values against real surface hierarchy.
2. **Functional spine for view porting** — pages can be authored as `FullLayout` / `TwoColLayout` consumers and dropped into the shell without rewriting chrome glue.

Real this session: layout shell, mobile drawer, one G2 chart on `/dashboard`. Stub: real login form, passkey, real logout, kbar provider.

---

## §1 Architecture

```
<AppShell>                         persistent sidebar + <Outlet />
  <Sidebar />                      ─ only the sidebar lives at shell level
  <Outlet />                       ─ page renders here
</AppShell>
```

The page itself owns its header + container. `AppShell` does **not** render a global header. Instead, every authenticated page returns one of three layout components as its root:

```tsx
function CommentsPage() {
  return (
    <TwoColLayout>
      <TwoColLayout.Header>
        <TwoColLayout.Title>评论</TwoColLayout.Title>
        <TwoColLayout.Actions><RefreshBtn /></TwoColLayout.Actions>
      </TwoColLayout.Header>
      <TwoColLayout.List><CommentList /></TwoColLayout.List>
      <TwoColLayout.Detail><CommentDetail /></TwoColLayout.Detail>
    </TwoColLayout>
  )
}
```

### Consequences

- The hook-based header injection from `07-layouts-patterns.md` (`useLayoutSlots`, `pageTitleAtom`, `headerActionsAtom`, `headerHiddenAtom`, `contentPaddingDisabledAtom`) is **deprecated**. Header content travels through layout-component slots, not global atoms.
- Each layout owns its own header bar and applies the shared `chrome.headerHeight` baseline so headers across the app sit on the same horizontal line.
- The global ⌘K trigger / search affordance lives on the **sidebar top**, not in any per-page header — Linear-style. Header is reserved for page-local title + actions.
- No floating-action-button surface ships. The `floatButtonsAtom` proposed in spec 04 is dropped.

---

## §2 Layout components API

### Slot primitives (primary surface)

The slot form is the source of truth. Every page that does not use the sugar wrapper uses these subcomponents directly.

```tsx
// Single-column full surface
<FullLayout>
  <FullLayout.Header>                                         // chrome.headerHeight 高度，hairline 下界
    <FullLayout.Title>仪表盘</FullLayout.Title>
    <FullLayout.Actions>                                      // 右对齐
      <Button>新建</Button>
    </FullLayout.Actions>
  </FullLayout.Header>
  <FullLayout.Body padding="default">                         // padding="none" | "default"
    {children}
  </FullLayout.Body>
</FullLayout>

// Master-detail two-column
<TwoColLayout
  listWidth={360}                                              // listWidth?: number, defaults chrome.twoColListDefaultWidth
  selectedId={selectedId}                                      // string | null — drives mobile detail drawer; omit for views with no selection model
  onSelectedIdChange={setSelectedId}                           // (id: string | null) => void — page persists via selectedIdAtomFamily('comments') etc
>
  <TwoColLayout.Header>{/* same shape as Full */}</TwoColLayout.Header>
  <TwoColLayout.List>{listNode}</TwoColLayout.List>
  <TwoColLayout.Detail>{detailNode}</TwoColLayout.Detail>
</TwoColLayout>

// Auth surface (login, setup, setup-api). Already exists; no chrome.
<SetupLayout>
  {childRoute}
</SetupLayout>
```

### Sugar (`FullPage` / `TwoColPage`)

Thin wrappers over the slot primitives for the common case where the header has just title + actions.

```tsx
import { FullPage, TwoColPage } from '~/components/layout'

<FullPage title="仪表盘" actions={<Button>新建</Button>}>
  <DashboardContent />
</FullPage>
// internal: <FullLayout><FullLayout.Header>{ title + actions }</FullLayout.Header><FullLayout.Body>{ children }</FullLayout.Body></FullLayout>

<TwoColPage title="评论" actions={<RefreshBtn />} list={<CommentList />}>
  <CommentDetail />
</TwoColPage>
// internal: TwoColLayout w/ slots filled from props
```

### Constraints

- Every layout primitive `forwardRef` + accepts `className` passthrough on the root element.
- `Header` may be omitted (e.g., setup sub-pages). When omitted, no top hairline is rendered.
- `Title` and `Actions` are independently optional inside `Header`.
- Slot subcomponents detect parent context via React `Symbol`-tagged components; passing them outside their parent is a runtime warning in dev, no-op in prod.
- `FullLayout.Body padding="default"` resolves to `chrome.contentPaddingDesktop` desktop / `chrome.contentPaddingMobile` mobile via media query. `padding="none"` is for surfaces that own their own padding (G2 chart bleeding to edges).
- Two-col `Detail` does not own scroll containment outside mobile mode — desktop, both panes scroll independently inside the body.

### File layout

Match the existing `src/layouts/` convention from CLAUDE.md (route shells + page-composable layout primitives all live under `src/layouts/`).

```
src/layouts/
├── AppShell/
│   ├── index.tsx              shell route — Sidebar + <Outlet />
│   ├── Sidebar.tsx            top-org chip + nav body + user chip
│   ├── SidebarItem.tsx        nav-item / group renderer
│   ├── UserChip.tsx           footer popover (theme / settings / logout placeholder)
│   ├── navItems.ts            NavTree data (P1: Dashboard only)
│   └── *.css.ts               recipes
├── FullLayout/
│   ├── index.tsx              slot primitive
│   └── FullLayout.css.ts
├── TwoColLayout/
│   ├── index.tsx              slot primitive
│   └── TwoColLayout.css.ts
├── SetupLayout/
│   ├── index.tsx              route shell + visual (bg + centered card + <Outlet />)
│   └── SetupLayout.css.ts
├── pages.tsx                  FullPage + TwoColPage sugar wrappers
└── index.ts                   barrel
```

`SetupLayout` is both the route element (rendered inside the route tree) and the visual chrome (bg + card). No primitive/route twin — one component does both jobs because `SetupLayout` only ever wraps `<Outlet />` and the visual is uniform across `/login`, `/setup`, `/setup-api`. The existing `src/layouts/SetupLayout.tsx` stub is replaced by this richer implementation.

---

## §3 Sidebar contract + nav data shape

The sidebar is the single source of navigation chrome. Anatomy, top-down:

| Region | Content | P1 |
|---|---|---|
| Org chip | `[avatar] MX Admin ▾` | static; dropdown later |
| Top icon `⌕` | global search (kbar) | placeholder — clicking shows toast `kbar 待 spec 10` |
| Top icon `✎` | quick-create | placeholder — clicking shows `toast.info` |
| Nav body | `NavTree` of `item` + `group` | renders P1 items per `navItems.ts` (specifics deferred — see Out of scope) |
| User chip | `[avatar] name role ⋯` | `⋯` opens Popover with three items: theme switch, settings (NotFound stub), logout (`toast.info('logout pending P1.5')`) |

### NavTree contract

```ts
// src/layouts/AppShell/navItems.ts
import type { LucideIcon } from 'lucide-react'

export type NavItemLeaf = {
  kind: 'item'
  to: string
  label: string
  icon: LucideIcon
  stub?: boolean         // when true, the item links to a route that resolves to NotFoundPage; render dimmed
}
export type NavGroup = {
  kind: 'group'
  label: string
  children: NavItemLeaf[]
}
export type NavTree = (NavItemLeaf | NavGroup)[]

export const navItems: NavTree = [
  { kind: 'item', to: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  // additional items added per business iteration; not designed in this spec
]
```

### Sidebar interaction contract

- Active item: matched against `useLocation().pathname` (startsWith for nested), rendered with `surface (between 1 and 2)` background and `ink` text.
- Stub items: dimmed (`inkSubtle`) but still clickable; route lands on NotFoundPage (existing).
- Collapsed (desktop): sidebar narrows to `chrome.sidebarWidthCollapsed`; section headers and labels hide; each item's icon shows a Tooltip with the label on hover.
- ⌘B keyboard shortcut toggles `useUIStore.sidebarCollapsed` for desktop only; the listener mirrors the source repo behavior (skip the binding when focus is in editor-like elements).

---

## §4 Responsive behavior

### Breakpoints

| Width | Sidebar | Layout body |
|---|---|---|
| ≥ 1024 px | expanded `chrome.sidebarWidthExpanded` (default) / collapsed `chrome.sidebarWidthCollapsed` (user-toggled) | full |
| 768 – 1023 px | collapsed by default; user may expand | full |
| < 768 px | `Drawer.from-left`, `chrome.sidebarMobileWidth`; layout headers grow a hamburger button | TwoCol degrades to list-only with detail in `Drawer.from-right` |

### State for sidebar

- Desktop collapse: `useUIStore.sidebarCollapsed` (persisted via `mx-admin:ui`).
- Mobile drawer open: new local atom `sidebarMobileOpenAtom` in `src/atoms/sidebar.ts`. Not persisted.
- `useViewport()` hook: thin selector over `useUIStore((s) => s.viewport)` exposing `width`, `height`, `isMobile`, `isTablet`, `isDesktop`.

### Drawer primitive (advance from spec 03 P2)

The mobile sidebar drawer and the mobile two-col detail drawer both need a `Drawer` primitive. We pull it forward from spec 03 P2 to P1.

- Wraps `@base-ui-components/react/dialog` configured for floating positions.
- Subcomponents: `Drawer.Root / Trigger / Portal / Backdrop / Content / Close`.
- Variants: `placement: 'left' | 'right'`; `size: 'sm' | 'md' | 'lg' | 'full'`.
- Reuses Modal's enter/exit motion idioms. Owns its own css.ts file under `src/components/ui/Drawer/`.
- Vitest spec covers open/close round-trip via Trigger/Close and `placement` variant application.

### TwoColLayout mobile contract

When `useViewport().isMobile`:

- `List` panel fills the body; selecting an item calls the page's `selectedId` setter (page state, not layout state).
- `Detail` is portaled into a `Drawer.from-right` whose `open` derives from `selectedId !== null`.
- Closing the drawer sets `selectedId` to `null`.

The layout component reads / writes `selectedId` via two props the page provides:

```tsx
<TwoColLayout
  listWidth={360}
  selectedId={selectedId}                  // string | null
  onSelectedIdChange={setSelectedId}       // (id: string | null) => void
>
```

This keeps the layout component dumb about the storage location; pages persist `selectedId` via `selectedIdAtomFamily('comments')` from spec 04.

### FullLayout mobile

- `Body padding`: `chrome.contentPaddingMobile` instead of `chrome.contentPaddingDesktop`.
- `Header` height unchanged. `Actions` rendered children may collapse to icon-only at the page's discretion.

### SetupLayout mobile

- Background image suppressed (network cost on mobile).
- Card stretches to full width minus 16 px gutter; centered vertically.

---

## §5 Routing & dev login

The route tree from spec 06 P0 stands. Two adjustments:

### Dev sign-in button

`/login` page is still a stub for spec 06 P1.5, but gains a dev-only button:

```tsx
function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const onDevSignIn = () => {
    setUser({
      id: 'dev',
      username: 'dev',
      name: 'Dev User',
    } as UserModel)
    navigate('/dashboard', { replace: true })
  }
  return (
    <Card>
      <p>Login flow lands with spec 06 P1.5.</p>
      {import.meta.env.DEV && <Button onClick={onDevSignIn}>Sign in (dev)</Button>}
    </Card>
  )
}
```

- `import.meta.env.DEV` guards the button; production builds omit it.
- Setting `useAuthStore.setUser(fakeUser)` short-circuits `useAuthBootstrap`'s status flow (it sees `status === 'authenticated'` and skips), allowing access to `/dashboard` without a real backend.

### Layout mounting in routes

No changes to `src/routes/index.tsx`. Each lazy page returns its own layout component as its root. `AppShell` stays a thin shell.

`/_dev/design` and `/_dev/primitives` remain public, outside the shell — they exist for isolated token / primitive evaluation.

### Logout placeholder

The user chip's `⋯` menu surfaces a Logout entry that emits `toast.info('logout pending P1.5')`. Real implementation (clearing auth store, query cache, navigating) ships with spec 06 P1.5.

---

## §6 State cleanup

The hook-based header injection model is dropped. Rather than mark deprecated, we delete.

### Removed

| Path | Action |
|---|---|
| `src/atoms/layout.ts` `pageTitleAtom` | delete |
| `src/atoms/layout.ts` `headerActionsAtom` | delete |
| `src/atoms/layout.ts` `headerHiddenAtom` | delete |
| `src/atoms/layout.ts` `contentPaddingDisabledAtom` | delete |
| `src/atoms/layout.ts` `floatButtonsAtom` | delete |
| `src/atoms/layout.ts` (file) | delete (becomes empty) |
| `src/hooks/useLayoutSlots.ts` | delete |

### Added

```ts
// src/atoms/sidebar.ts
import { atom } from 'jotai'
export const sidebarMobileOpenAtom = atom<boolean>(false)
```

### Unchanged

- `src/atoms/master-detail.ts` `selectedIdAtomFamily` — TwoCol mobile drawer uses page-owned `selectedId`.
- `src/atoms/{table, draft, agent, ai-task-queue}.ts` — untouched.

### Spec sync

- `04-state-layer.md` P0 acceptance §5 must be updated to drop the deleted atoms and the hook. STATUS.md gets a note: "spec 04 redesigned — layout slot atoms + `useLayoutSlots` removed; layout-component-owned slots replace them."

---

## §7 Token calibration pass

Calibration runs **after** the shell renders end-to-end at `/dashboard`. Five color targets only; spacing / typography / radius / motion / zIndex stay v0.

### Process

1. `pnpm dev`; open `/dashboard`, `/_dev/design`, `/_dev/primitives` simultaneously.
2. Compare against linear.app real surfaces via DevTools computed style.
3. Adjust at most the five tokens listed below.
4. Append a `## v1 calibrated · 2026-05-XX` section to `02-design-tokens.md` listing each before / after value with a one-line rationale.
5. Flip STATUS.md spec 02 state to `calibrated (v1)`.
6. `pnpm test` must remain green (no test depends on hex values).

### Targets

| Token | v0 | v1 candidate (subject to live calibration) | Why |
|---|---|---|---|
| `canvas` | `#010102` | `#08090b` | pure black is too inert; nudge toward Linear's blue-tinted near-black; preserve canvas → surface1 delta |
| `surface1 / 2 / 3 / 4` | `#0f1011 / #181a1c / #1f2124 / #26282b` | `#101113 / #171a1d / #1f2226 / #272b30` | even 5-lightness steps; surface1 ≈ Card default; surface3 ≈ popover/hover |
| `hairline / hairlineStrong / hairlineTertiary` | `#23252a / #2f3137 / #1a1c20` | `#23262b / #2f3239 / #181b1f` | tertiary subtly hint, hairline standard, strong emphasis — current values are fine but realign hue |
| `primary / primaryHover / primaryFocus` | `#5e6ad2 / #828fff / #5e69d1` | unchanged | Linear's brand accent; do not move |
| Active nav background | (was effectively surface3) | `#1a1c20` (between surface1 and surface2) | active state too bright at surface3; new value sits closer to sidebar bg |

### chrome dimensions tokens

A new tokens file ships alongside calibration:

```ts
// src/styles/tokens/chrome.ts
export const chrome = {
  headerHeight: '44px',
  sidebarWidthExpanded: '232px',
  sidebarWidthCollapsed: '56px',
  sidebarMobileWidth: '280px',
  twoColListDefaultWidth: '360px',
  contentPaddingDesktop: '24px',
  contentPaddingMobile: '16px',
  setupCardMaxWidth: '480px',
} as const
```

`src/styles/tokens/index.ts` re-exports. spec 02's namespace table grows one row (`chrome`, plain TS, not in theme contract). Layout css.ts files import from here — never inline px values for chrome dimensions.

### Out of scope for the calibration pass

- Light theme — still aliased dark; spec 02b owns this later.
- Font calibration — Inter is locked.
- New tokens for sidebar-specific paint (active bg, hover bg) — if a static value in `Layout.css.ts` solves it, do not bloat the contract.
- Spacing / radius / motion adjustments.

---

## Out of scope (this design)

- Real login form (`react-hook-form` + `zod`, passkey button, real `authClient.signIn.*` calls) — spec 06 P1.5.
- Real logout — spec 06 P1.5.
- Setup wizard implementation — spec 06 P1.5 + spec 11.
- AUTH_FAILED socket bridge — depends on socket layer (spec 05 P1).
- Real kbar provider, command list, view-level commands — spec 10 P1 partial.
- Specific sidebar nav item set beyond `Dashboard` — deferred to per-view porting; the design only locks the `NavTree` shape.
- Light theme — spec 02b.
- AppShell-level scroll restoration mechanics — see "Open questions".

---

## Acceptance

This design is implementable when each of the following passes.

1. `<AppShell>` renders `<Sidebar>` + `<Outlet>`; visiting `/dashboard` (after dev sign-in) shows the chrome.
2. `<FullLayout>` slot subcomponents render with `chrome.headerHeight` header, hairline divider, and padded body. Sugar `<FullPage>` produces equivalent DOM.
3. `<TwoColLayout>` slot subcomponents render `Header / List / Detail`; on desktop, list+detail are columns; on mobile (<768 px), list fills and detail mounts in `Drawer.from-right` driven by `selectedId`.
4. `<SetupLayout>` renders centered card with optional bg image and proper mobile fallback.
5. Sidebar collapses on `⌘B` (desktop) and respects `useUIStore.sidebarCollapsed` persistence; below 768 px it becomes `Drawer.from-left` driven by `sidebarMobileOpenAtom`.
6. Sidebar nav renders one real item (`Dashboard`) and the contract for `NavTree` is exported for later additions.
7. User chip popover (`⋯`) opens a menu with theme switch (live), settings stub (NotFound), logout placeholder (toast).
8. `/login` shows a dev-only `Sign in (dev)` button under `import.meta.env.DEV` that authenticates a fake user and lands on `/dashboard`.
9. `/dashboard` renders one G2 chart with mock data (smoke target for token calibration).
10. `Drawer` primitive ships under `src/components/ui/Drawer/` with a Vitest spec covering open / close + `placement` variant.
11. `src/atoms/layout.ts` and `src/hooks/useLayoutSlots.ts` are deleted; spec 04 STATUS reflects the redesign.
12. `src/styles/tokens/chrome.ts` exists, is barrel-exported, and is the only source for chrome dimensions in css.ts.
13. After visual rendering, the v1 token calibration ships: `02-design-tokens.md` gains a `v1 calibrated` section; STATUS.md flips spec 02 to `calibrated (v1)`.
14. `pnpm typecheck` 0 error; `pnpm test` green; oxlint on changed files clean.

---

## Open questions

- **Scroll restoration**. Spec 07 §343 proposed `useScrollToTopOnRouteChange` mounted in AppShell. With layout components owning the body scroll container, the hook needs a stable selector — the body element of the active layout. Resolve during implementation; fallback is per-layout `useEffect` that runs on `pathname` change.
- **Tooltip primitive**. Sidebar collapsed-mode label tooltips need `Tooltip`. spec 03 P2 owns it. Pull forward only if the implementation reveals a strict need; otherwise use a temporary CSS-only tooltip via `title` attribute.
- **Slot validation strictness**. Whether to warn at runtime when a slot subcomponent appears outside its parent. Default: dev-only `console.warn`, no production cost.
- **`chrome` tokens vs theme contract**. Static across themes, so plain TS suffices. If a future requirement makes header height responsive to user density preferences, this becomes a contract candidate. Not now.

---

## Implementation note (for the planner)

The implementation plan should bundle:

1. `chrome.ts` tokens + barrel update first (everything else imports it).
2. `Drawer` primitive next (sidebar mobile + TwoCol mobile both depend on it).
3. Layout components (`FullLayout`, `TwoColLayout`, `FullPage`, `TwoColPage`, `SetupLayout` migration).
4. `AppShell` + `Sidebar` (with `navItems.ts` shipping only `Dashboard`).
5. State cleanup (delete atoms / hook; add `sidebarMobileOpenAtom`).
6. Page wiring: `LoginPage` dev button, `DashboardPage` adopting `<FullPage>` with one G2 chart.
7. Tests: `Drawer.test.tsx`; smoke render tests for `FullLayout` / `TwoColLayout` slot composition.
8. Token calibration pass once visual rendering is complete.
9. Spec / STATUS updates.

A separate planning step under `superpowers:writing-plans` will sequence and check-point this work.
