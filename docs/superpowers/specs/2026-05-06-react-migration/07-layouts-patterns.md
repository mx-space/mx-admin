# 07 · Layouts & Patterns

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P1 (AppShell + Sidebar + SetupLayout) → P2 (MasterDetailLayout + ConfigForm shell)
**Depends on**: 03 (primitives), 04 (layout slots atoms + UI store), 06 (routes)
**Feeds**: 11 (views compose into these layouts)

Defines the layout shells, the header-action injection mechanism, the master-detail pattern, and the responsive rules. The Vue source uses a `useLayout()` composable that mutates a Pinia store; the React port replaces it with Jotai slot atoms surfaced through a small hook.

---

## Scope

- **In**: AppShell composition, Sidebar nav structure, SetupLayout, MasterDetailLayout (mobile drawer behavior), header-action injection, page-title injection, Suspense + RouteFallback boundary, responsive breakpoints, scroll-to-top behavior, kbar mount point.
- **Out**: Sidebar nav data — that lives next to the route definitions (spec 06) since it mirrors the route tree. Per-view chrome (→ 11). Form layout (→ 08).

---

## Decisions

- **`AppShell` is the single authed-area shell.** Sidebar + Header + content area + portal targets (kbar, toasts, modals).
- **Header actions are React nodes set by views via `useLayoutSlots`** (writes Jotai atoms; AppShell reads).
- **MasterDetailLayout is a primitive, not a layout route.** Views compose it inside their own page component.
- **Responsive break at 768 px**: sidebar collapses to hamburger drawer; master-detail collapses to drawer overlay.
- **Scroll restoration is per-route, not per-app**: each lazy page mounts at the top.
- **Suspense boundaries are layered**: route-level (RouteFallback) and content-level (per-page Skeleton inside Card).

---

## AppShell

```
┌────────────────────────────────────────────────────────────┐
│  Sidebar      │  Header (page title, header actions, user) │
│               ├────────────────────────────────────────────┤
│  Nav          │                                            │
│               │  <Outlet />                                │
│  Footer       │                                            │
└────────────────────────────────────────────────────────────┘
```

```tsx
// src/layouts/AppShell/index.tsx
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastViewport } from '~/components/ui'
import { KBarMount } from '~/components/kbar'
import { SocketBridge } from '~/components/shared/SocketBridge'
import { useFirstLoginRedirect } from './useFirstLoginRedirect'
import * as styles from './AppShell.css'

export function AppShell() {
  useFirstLoginRedirect()
  return (
    <div className={styles.root}>
      <Sidebar className={styles.sidebar} />
      <div className={styles.main}>
        <Header className={styles.header} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <ToastViewport />
      <KBarMount />
      <SocketBridge />
    </div>
  )
}
```

`useFirstLoginRedirect()` reads the localStorage flag set during setup and redirects to `/setting/user` once.

`AppShell.css.ts` uses `display: grid; grid-template-columns: auto 1fr;` with the sidebar width responsive (collapsed → 56 px, expanded → 240 px). Below 768 px, the layout switches to a single column and the sidebar becomes a Drawer triggered by a hamburger button in the header.

### Header

```tsx
// src/layouts/AppShell/Header.tsx
export function Header({ className }: { className?: string }) {
  const pageTitle = useAtomValue(pageTitleAtom)
  const headerActions = useAtomValue(headerActionsAtom)
  const headerHidden = useAtomValue(headerHiddenAtom)

  if (headerHidden) return null
  return (
    <header className={cx(styles.header, className)}>
      <div className={styles.headerLeft}>
        <SidebarToggle />
        <Breadcrumb />
        {pageTitle && <h1 className={styles.title}>{pageTitle}</h1>}
      </div>
      <div className={styles.headerRight}>
        {headerActions}
        <KBarTrigger />
        <UserMenu />
      </div>
    </header>
  )
}
```

`Breadcrumb` derives from current location and a `routeMeta` map (mirrors source `name.ts`).

### Sidebar

```tsx
// src/layouts/AppShell/Sidebar.tsx
export function Sidebar({ className }: { className?: string }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const isMobile = useViewport().width < 768

  if (isMobile) return <MobileSidebarDrawer />
  return (
    <aside className={cx(styles.sidebar({ collapsed }), className)}>
      <SidebarBrand />
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter />
    </aside>
  )
}
```

`SidebarNav` consumes `navItems` (port from source `src/layouts/sidebar/items.ts`):

```ts
// src/layouts/AppShell/navItems.ts
import { LayoutDashboard, Newspaper, Notebook, MessagesSquare, /* ... */ } from 'lucide-react'

export const navItems = [
  { kind: 'item', to: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { kind: 'group', label: '内容', children: [
    { kind: 'item', to: '/posts/view', label: '文章', icon: Newspaper },
    { kind: 'item', to: '/notes/view', label: '日记', icon: Notebook },
    /* ... */
  ]},
  /* ... */
]
```

Sidebar items respect collapsed state — show icon only when collapsed, with Tooltip.

### UserMenu

Sidebar footer or header dropdown (decide during P1). Renders avatar, username, and menu items: `Settings`, `Switch theme`, `Logout`. Logout calls the `useLogout()` hook from spec 06.

---

## SetupLayout

```tsx
// src/layouts/SetupLayout/index.tsx
import { Outlet } from 'react-router'

export function SetupLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.bg} />
      <div className={styles.overlay} />
      <div className={styles.card}>
        <Outlet />
      </div>
    </div>
  )
}
```

- Background image from `VITE_APP_LOGIN_BG` (or a fallback gradient). Loads lazily; falls back to surface-1 if image fails.
- Card centered, max-width ~480 px, `Card` primitive at elevation `raised`.
- No sidebar / header — pure entry surface.

---

## MasterDetailLayout

> **Status 2026-05-10 — superseded.** Replaced by the column-layout primitives shipped during P1: `FullLayout` (single-column page surface) + `TwoColLayout` (master/detail with mobile drawer). Master-detail views compose `<TwoColLayout>` directly with their own list + detail children. The spec text below is preserved as design history; the `MasterDetailLayout` symbol and `useMasterDetailLayout` hook are no longer planned. Acceptance items 1–2 below are dropped from P2 acceptance.

Used by ~10 views: `comments`, `manage-friends`, `manage-project`, `maintenance/cron`, `ai/*`, `shorthand`, `setting`, `reader`.

```
desktop (≥ 768 px):
┌─────────────────┬──────────────────────────────┐
│  List           │  Detail                      │
│  (selectable)   │                              │
│                 │                              │
└─────────────────┴──────────────────────────────┘

mobile (< 768 px):
┌──────────────────────────────────────────────────┐
│  List                                            │
│  (selecting an item opens Detail as Drawer)      │
└──────────────────────────────────────────────────┘
```

```tsx
// src/components/layout/MasterDetailLayout.tsx
interface MasterDetailLayoutProps {
  list: ReactNode
  detail: ReactNode
  isDetailOpen?: boolean
  onDetailClose?: () => void
  splitRatio?: [number, number]   // default [3, 7]
}

export function MasterDetailLayout({ list, detail, isDetailOpen, onDetailClose, splitRatio = [3, 7] }: MasterDetailLayoutProps) {
  const isMobile = useViewport().width < 768
  if (isMobile) {
    return (
      <>
        <div className={styles.mobileList}>{list}</div>
        <Drawer.Root open={isDetailOpen} onOpenChange={(o) => !o && onDetailClose?.()}>
          <Drawer.Content placement="right" size="full">{detail}</Drawer.Content>
        </Drawer.Root>
      </>
    )
  }
  return (
    <div className={styles.desktop} style={{ gridTemplateColumns: `${splitRatio[0]}fr ${splitRatio[1]}fr` }}>
      <div className={styles.list}>{list}</div>
      <div className={styles.detail}>{detail}</div>
    </div>
  )
}
```

The `selectedId` state is owned by the consumer view (via `selectedIdAtomFamily('viewKey')`); the layout itself is dumb.

A companion `useMasterDetailLayout(key)` hook provides `selectedId`, `setSelectedId`, `isDetailOpen` (mobile-only), `closeDetail` for ergonomics.

---

## SettingsLayout (sub-case of MasterDetailLayout)

`/setting/:tab` is master-detail with extra structure: a `SettingsListPanel` on the left listing `user`, `account`, `meta-preset`; a `SettingsDetailPanel` on the right rendering the active tab's form.

Implementation: thin wrapper around `MasterDetailLayout` plus navigation → `tab` URL param.

---

## RouterView (Suspense layer)

Outlets that nest deeply (e.g. `/setting/:tab`) wrap their `Outlet` in a Suspense boundary so tab switches show a fallback without un-mounting the layout:

```tsx
// src/layouts/SuspenseOutlet.tsx
export function SuspenseOutlet() {
  return (
    <Suspense fallback={<RouteFallback inline />}>
      <Outlet />
    </Suspense>
  )
}
```

`RouteFallback` accepts an `inline` prop: when set, it renders a small Skeleton inside the existing layout instead of a full-screen loader.

---

## Header-action injection

`useLayoutSlots` is the canonical writer for header slots:

```tsx
// src/hooks/useLayoutSlots.ts
import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { pageTitleAtom, headerActionsAtom, headerHiddenAtom, contentPaddingDisabledAtom } from '~/atoms/layout'

interface LayoutSlots {
  title?: string | null
  actions?: ReactNode
  hideHeader?: boolean
  disableContentPadding?: boolean
}

export function useLayoutSlots(slots: LayoutSlots) {
  const setTitle = useSetAtom(pageTitleAtom)
  const setActions = useSetAtom(headerActionsAtom)
  const setHidden = useSetAtom(headerHiddenAtom)
  const setNoPadding = useSetAtom(contentPaddingDisabledAtom)

  useEffect(() => {
    if (slots.title !== undefined) setTitle(slots.title)
    if (slots.actions !== undefined) setActions(slots.actions)
    if (slots.hideHeader !== undefined) setHidden(slots.hideHeader)
    if (slots.disableContentPadding !== undefined) setNoPadding(slots.disableContentPadding)

    return () => {
      setTitle(null)
      setActions(null)
      setHidden(false)
      setNoPadding(false)
    }
  }, [slots.title, slots.actions, slots.hideHeader, slots.disableContentPadding])
}
```

Usage:

```tsx
// inside a page
useLayoutSlots({
  title: '文章',
  actions: <Button intent="primary" onClick={onCreate}>新建</Button>,
})
```

Consumers must memoize `actions` (or accept re-renders on every page render) to avoid unnecessary header redraws. A small lint rule could catch missing `useMemo`; for now, document the pattern.

---

## Float buttons

Source repo has a `floatButtonsAtom` (Map keyed by Symbol) — used for floating action buttons on specific views (e.g. AI task queue toggle). Pattern:

```tsx
// inside a view that registers a float button
const setFloats = useSetAtom(floatButtonsAtom)
useEffect(() => {
  const id = Symbol('ai-task-queue-toggle')
  setFloats((m) => new Map(m).set(id, <AiTaskQueueButton />))
  return () => setFloats((m) => { const c = new Map(m); c.delete(id); return c })
}, [])
```

`AppShell` renders the union from the bottom-right corner.

---

## Responsive rules

| Breakpoint | Behavior |
|---|---|
| ≥ 1024 px | Sidebar default expanded, master-detail desktop split |
| 768 – 1024 px | Sidebar collapsed by default (icon only); master-detail split |
| < 768 px | Sidebar becomes mobile drawer; master-detail collapses to list-only with drawer-overlay detail; header collapses |

Hook: `useViewport()` reads `useUIStore((s) => s.viewport)`. The viewport is updated on every resize by the AppShell-level effect.

Tablet vs phone breakpoints map to source's `phone:` (≤ 768 px), `tablet:` (≤ 1023 px), `desktop:` (≥ 1024 px) — but with css.ts these are media queries inside recipes, not utility classes.

---

## Scroll restoration

`react-router` v7's built-in `<ScrollRestoration />` is **not** used (it's data-router only). Instead, mount a `useScrollToTopOnRouteChange()` hook in `AppShell`:

```ts
export function useScrollToTopOnRouteChange() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0)
  }, [pathname])
}
```

For views that explicitly want to preserve scroll across route changes (rare), they bypass the hook by managing their own scroll state.

---

## Acceptance for spec 07

### P1 acceptance

1. `AppShell` renders Sidebar + Header + Outlet at `/dashboard`.
2. Sidebar nav items (P1 subset: dashboard + a placeholder list of route names) navigate correctly.
3. Sidebar collapses below 1024 px and becomes a Drawer below 768 px.
4. `SetupLayout` renders centered card with optional background image.
5. `useLayoutSlots({ title, actions })` updates the header live and resets on unmount.
6. `RouteFallback` shows during lazy-load gaps.

### P2 acceptance

1. `MasterDetailLayout` works on desktop and mobile in at least one view (`/comments` recommended).
2. `useMasterDetailLayout` hook returns the documented shape.
3. `SettingsLayout` renders `/setting/:tab` correctly.
4. `floatButtonsAtom` registers / unregisters cleanly across navigation.
5. `useScrollToTopOnRouteChange` works without breaking scroll inside the editor surfaces (which manage their own scroll).

---

## Open questions

- **Sidebar nav data source.** Either keep the static `navItems` array (current plan) or derive from route metadata. Decided: static array — easier to control labels, icons, and grouping than deriving.
- **Breadcrumb depth.** Source has 1-level breadcrumb. Keep simple; expand if a P3 view actually needs nesting.
- **kbar trigger placement.** Header right or sidebar footer. Default header-right with `⌘K` shortcut hint.
- **Mobile drawer animation.** `motion` slide-in; reuse Drawer primitive. Decided.
