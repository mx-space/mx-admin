# Convention-Based Routing for `apps/admin/src/views`

**Status:** Draft
**Date:** 2026-05-26
**Owner:** Innei

## Problem

`apps/admin/src/routes.tsx` is the single source of route registration, sidebar
navigation, redirects, and auth-gate path policy. It has grown to ~850 lines and
couples four unrelated concerns:

1. Lazy component imports for ~38 view modules.
2. Route element registration (path → element).
3. Sidebar navigation tree (sections, groups, alias-only nav entries).
4. Legacy redirects (static + functional).

The current shape forces every new page to touch a single hot file, hides icon
and i18n metadata far from the page module, and offers no static guarantees
that the registered path corresponds to a real file or that metadata is
internally consistent.

## Goal

Replace manual registration with a file-system, convention-driven structure
under `apps/admin/src/views/`. A custom Vite plugin scans the tree, parses
per-route metadata, and emits a virtual module that the runtime consumes for
route registration, sidebar rendering, auth-gate classification, and redirects.

## Non-Goals

- Replacing React Router or moving to a different routing library.
- Introducing nested `<Outlet />` layouts (the admin shell is the only layout;
  the `(public)` group is a flag, not a layout component).
- Server-side rendering or route-level data loaders.
- Changing the URL surface for existing routes (except where the migration
  table explicitly notes a new `/maintenance/enrichment` canonical path).
- Internationalization changes — translation keys stay as-is.

## Decisions Summary

| # | Decision | Choice |
|---|---|---|
| 1 | Scope of the convention | Full replacement of route + sidebar + redirects + auth-gate classification |
| 2 | File layout | Next.js App Router style (folder per segment, leaf `page.tsx`) |
| 3 | Sidebar organization | `(section)` route-group directories with `meta.ts` |
| 4 | Multi-route components | Pure split — one `page.tsx` per URL; shared logic lives in non-route modules |
| 5 | Lazy semantics | `page.tsx` is lazy by default; `page.sync.tsx` is sync |
| 6 | Public pages | `(public)` route group — plugin tags them as `layout: 'public'` |
| 7 | Redirects | Centralized in `views/redirects.ts` |
| 8 | Recognized files | Whitelist: `page.tsx`, `page.sync.tsx`, `meta.ts`, `redirects.ts`. All others ignored. |
| 9 | Plugin strategy | Virtual module (`virtual:admin-routes`) generated from static AST scan |
| 10 | Alias-only sidebar entries | Removed — group root acts as the navigation leaf |

## Architecture

```
apps/admin/
  vite-plugins/
    admin-routes/
      index.ts              # Vite plugin entry
      scan.ts               # globs views/ and resolves the route tree
      meta-parser.ts        # AST parser for defineMetadata() literals
      generate.ts           # produces the virtual module source
  src/
    lib/
      route-meta.ts         # defineMetadata + type exports
    views/
      (public)/             # bypasses shell + auth gate
      (content)/
        meta.ts             # section title + order
        posts/
          page.tsx          # /posts (lazy)
          edit/page.tsx     # /posts/edit
          category/page.tsx # /posts/category
        ...
      (community)/...
      (assets)/...
      (system)/
        setting/[tab]/page.tsx
        ai/{summary,insights,...}/page.tsx
      (extra)/...
      (maintenance)/...
      (debug)/...
      (dev)/...             # plugin strips when !import.meta.env.DEV
      dashboard/page.tsx    # top-level, no section, order 1
      redirects.ts          # static + functional redirects
    routes.tsx              # ~50 lines, consumes virtual:admin-routes
    App.tsx                 # uses publicRoutes to bypass auth gate
```

### Data Flow

1. Plugin scans `views/` during `configResolved` and on file add/unlink/change
   to recognized files (`page.tsx`, `page.sync.tsx`, `meta.ts`,
   `redirects.ts`).
2. Plugin parses each `page.tsx` for a `defineMetadata({...})` call expression
   and extracts the object literal statically.
3. Plugin assembles `AppRoute[]`, `SidebarSection[]`, `RedirectEntry[]`, and
   `publicRoutes`/`shellRoutes` partitions.
4. Plugin emits the generated source through `load('virtual:admin-routes')`.
5. Plugin writes a `.d.ts` declaration so IDE consumers see the typed exports.
6. Runtime modules import from `virtual:admin-routes` and render.

## File Convention

### Recognized Files (whitelist)

| File | Purpose | Notes |
|---|---|---|
| `page.tsx` | Route element, **lazy by default** | Must `export default` a React component |
| `page.sync.tsx` | Route element, eager | Mutually exclusive with `page.tsx` in the same directory |
| `meta.ts` | Directory-level config | `(section)/meta.ts` carries the section title and order |
| `redirects.ts` | Only at `views/` root | Static + functional redirects |

All other files (helpers, shared components, styles, internal modules) are
ignored by the scanner. Pages import them as ordinary modules.

### Path Derivation

| Filesystem path | URL path |
|---|---|
| `dashboard/page.tsx` | `/dashboard` |
| `(content)/posts/page.tsx` | `/posts` |
| `(content)/posts/edit/page.tsx` | `/posts/edit` |
| `(system)/setting/[tab]/page.tsx` | `/setting/:tab` |
| `(public)/login/page.tsx` | `/login` |
| `[...rest]/page.tsx` | `*` (catch-all) |

`(xxx)` parenthesised directories are route groups: they do **not** contribute
to the URL. They serve two purposes:

1. Sidebar section grouping (`(content)`, `(system)`, …).
2. Layout classification — only `(public)` is special; the plugin tags every
   route under `(public)` as `layout: 'public'`, others as `layout: 'shell'`.

### Sidebar Sectioning Rules

- Pages under a `(section)` directory join a `SidebarSection` whose
  `titleKey` and `order` come from that directory's `meta.ts`. If `meta.ts`
  is missing the section still exists but renders without a header.
- Pages directly under `views/` that are *not* inside any route group
  (e.g. `dashboard/page.tsx`) join a single implicit section with no
  `titleKey` and `order: 0`. This is how the dashboard entry appears at the
  top of the sidebar today.
- Routes whose `layout` is `'public'` are excluded from `sidebarTree`
  entirely. They appear in `appRoutes` and `publicRoutes` only.
- Routes with `metadata.hidden: true` register but are excluded from
  `sidebarTree`.

### `defineMetadata`

```ts
// src/lib/route-meta.ts
import type { LucideIcon } from 'lucide-react'
import type { TranslationKey } from '~/i18n/types'

export interface RouteMetadata {
  titleKey: TranslationKey
  descriptionKey?: TranslationKey
  icon?: LucideIcon
  order?: number          // sibling sidebar order; default 999
  matchPaths?: string[]   // additional paths that highlight this nav entry
  hidden?: boolean        // real route but excluded from sidebar
}

export interface SectionMeta {
  titleKey: TranslationKey
  order: number
}

export function defineMetadata<T extends RouteMetadata>(m: T): T { return m }
```

Usage:

```ts
// views/(content)/posts/page.tsx
import { FileText } from 'lucide-react'
import { defineMetadata } from '~/lib/route-meta'

export const metadata = defineMetadata({
  titleKey: 'routes.posts.title',
  descriptionKey: 'routes.posts.description',
  icon: FileText,
  order: 1,
})

export default function PostsPage() { /* ... */ }
```

### Section `meta.ts`

```ts
// views/(content)/meta.ts
import type { SectionMeta } from '~/lib/route-meta'
export default {
  titleKey: 'shell.nav.content',
  order: 2,
} satisfies SectionMeta
```

When a `(section)/meta.ts` is missing, routes under it still register but the
sidebar does not render a section header for them.

### `redirects.ts`

```ts
// views/redirects.ts
import {
  LegacyPageRedirect,
  LegacyExtraRedirect,
} from '../components/legacy-redirects'

export default [
  { from: '/posts/view', to: '/posts' },
  { from: '/notes/view', to: '/notes' },
  { from: '/pages/list', to: '/pages' },
  { from: '/files/list', to: '/files' },
  { from: '/enrichment', to: '/maintenance/enrichment' },
  { from: '/maintenance', to: '/maintenance/cron' },
  { from: '/extra-features', to: '/extra-features/snippets' },
  { from: '/ai', to: '/ai/summary' },
  { from: '/page/*', element: LegacyPageRedirect },
  { from: '/extra/*', element: LegacyExtraRedirect },
] satisfies RedirectEntry[]
```

Functional redirect components live in a regular component module so the
scanner ignores them.

### Constraints

- Metadata must be a single object literal passed directly to
  `defineMetadata`. The AST parser does not evaluate arbitrary expressions.
- `icon` must be imported by name from `lucide-react`. The parser records the
  import specifier so the generated module re-imports it.
- `titleKey`, `descriptionKey`, and `matchPaths` entries must be string
  literals.
- Every `page.tsx` / `page.sync.tsx` must `export default` a React component
  and (unless `hidden: true`) `export const metadata = defineMetadata({...})`.
  Missing metadata raises a build error.
- A directory may contain at most one of `page.tsx` or `page.sync.tsx`.
- Duplicate URL paths (across the whole tree, including redirects) raise a
  build error.

## Virtual Module: `virtual:admin-routes`

### Type Declaration

```ts
declare module 'virtual:admin-routes' {
  import type { ComponentType, LazyExoticComponent } from 'react'
  import type { LucideIcon } from 'lucide-react'
  import type { TranslationKey } from '~/i18n/types'

  export interface AppRoute {
    path: string
    element: ComponentType | LazyExoticComponent<ComponentType>
    titleKey: TranslationKey
    descriptionKey?: TranslationKey
    icon?: LucideIcon
    matchPaths?: string[]
    layout: 'shell' | 'public'
    hidden?: boolean
  }

  export interface SidebarNode {
    route: AppRoute
    children?: SidebarNode[]
  }

  export interface SidebarSection {
    titleKey?: TranslationKey
    order: number
    items: SidebarNode[]
  }

  export interface RedirectEntry {
    from: string
    to?: string
    element?: ComponentType
  }

  export const appRoutes: AppRoute[]          // all routes (public + shell)
  export const publicRoutes: AppRoute[]       // (public) group
  export const shellRoutes: AppRoute[]        // everything else
  export const sidebarTree: SidebarSection[]  // shell only, ordered by section order
  export const redirects: RedirectEntry[]
}
```

### Generated Module (illustrative)

```ts
import { lazy } from 'react'
import {
  FileText, Pencil, FolderOpen, /* ... */
} from 'lucide-react'

import LoginPage from '~/views/(public)/login/page'
import SetupPage from '~/views/(public)/setup/page'

const PostsPage = lazy(() => import('~/views/(content)/posts/page'))
const PostsEditPage = lazy(() => import('~/views/(content)/posts/edit/page'))
// ... one binding per page

export const appRoutes = [
  {
    path: '/login',
    element: LoginPage,
    titleKey: 'routes.login.title',
    layout: 'public',
  },
  {
    path: '/posts',
    element: PostsPage,
    titleKey: 'routes.posts.title',
    descriptionKey: 'routes.posts.description',
    icon: FileText,
    layout: 'shell',
  },
  // ...
]

export const publicRoutes = appRoutes.filter((r) => r.layout === 'public')
export const shellRoutes = appRoutes.filter((r) => r.layout === 'shell')

export const sidebarTree = [
  {
    titleKey: 'shell.nav.content',
    order: 2,
    items: [
      {
        route: /* posts */,
        children: [/* edit, category */],
      },
      // ...
    ],
  },
  // ...
]

export const redirects = [
  { from: '/posts/view', to: '/posts' },
  // ...
]
```

### HMR Behavior

- The plugin watches `views/**/{page,page.sync,meta}.{ts,tsx}` and
  `views/redirects.ts`.
- On add / unlink / metadata change, the plugin invalidates
  `virtual:admin-routes` via `server.moduleGraph` and triggers a full reload.
- Pure component-body edits inside a `page.tsx` are handled by React Fast
  Refresh; the plugin does not interfere.

### Dev / Debug Routes

- `(dev)` routes are only included when `import.meta.env.DEV` is true. The
  plugin omits them from production builds.
- `(debug)` routes are always included.

## Runtime Consumers

### `src/routes.tsx`

```tsx
import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import {
  publicRoutes,
  shellRoutes,
  redirects,
} from 'virtual:admin-routes'

import { LegacyStaticRedirect } from './components/legacy-redirects'

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<Navigate replace to="/dashboard" />} path="/" />
        {publicRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={<r.element />} />
        ))}
        {shellRoutes.map((r) => (
          <Route key={r.path} path={r.path} element={<r.element />} />
        ))}
        {redirects.map((r) =>
          r.to
            ? (
              <Route
                key={r.from}
                path={r.from}
                element={<LegacyStaticRedirect to={r.to} />}
              />
            )
            : (
              <Route key={r.from} path={r.from} element={<r.element! />} />
            ),
        )}
        <Route element={<Navigate replace to="/dashboard" />} path="*" />
      </Routes>
    </Suspense>
  )
}
```

### `App.tsx`

```tsx
import { publicRoutes } from 'virtual:admin-routes'

const publicPathSet = new Set(publicRoutes.map((r) => r.path))

function shouldBypassShell(pathname: string) {
  return publicPathSet.has(pathname)
}
```

The existing `checkLogged` query and `AdminShell` mount logic stay in place;
only the path predicate changes.

### `AdminShell` sidebar

```tsx
import { sidebarTree } from 'virtual:admin-routes'

// render sidebarTree directly; remove sidebarRoute / sidebarGroupNode helpers
```

## Migration Plan

### Module Map

```
old                              new
views/login-page.tsx          → views/(public)/login/page.sync.tsx
views/setup-page.tsx          → views/(public)/setup/page.sync.tsx
views/setup-api-page.tsx      → views/(public)/setup-api/page.sync.tsx

views/dashboard-page.tsx      → views/dashboard/page.tsx

views/posts-page.tsx          → views/(content)/posts/page.tsx
views/categories-page.tsx     → views/(content)/posts/category/page.tsx
views/notes-page.tsx          → views/(content)/notes/page.tsx
views/topics-page.tsx         → views/(content)/notes/topic/page.tsx
views/pages-page.tsx          → views/(content)/pages/page.tsx
views/drafts-page.tsx         → views/(content)/drafts/page.tsx
views/says-page.tsx           → views/(content)/says/page.tsx
views/recently-page.tsx       → views/(content)/recently/page.tsx
views/projects-page.tsx       → views/(content)/projects/page.tsx

# write-page.tsx (3 components) → shared shell extracted, 3 page wrappers
views/write-page.tsx          → src/components/write/shell.tsx
                              + views/(content)/posts/edit/page.tsx
                              + views/(content)/notes/edit/page.tsx
                              + views/(content)/pages/edit/page.tsx

views/comments-page.tsx       → views/(community)/comments/page.tsx
views/readers-page.tsx        → views/(community)/readers/page.tsx
views/friends-page.tsx        → views/(community)/friends/page.tsx
views/subscribe-page.tsx      → views/(community)/subscribe/page.tsx

# files-page.tsx (3 exports) → split, shared logic into components/files/
views/files-page.tsx          → src/components/files/{files,orphans,comments}.tsx
                              + views/(assets)/files/page.tsx
                              + views/(assets)/files/orphans/page.tsx
                              + views/(assets)/files/comment-images/page.tsx
views/template-page.tsx       → views/(assets)/template/page.tsx
views/markdown-page.tsx       → views/(assets)/markdown/page.tsx

# ai-page.tsx (1 component, 7 URLs) → shared module + 7 thin re-exports
views/ai-page.tsx             → src/components/ai/page.tsx
                              + views/(system)/ai/page.tsx
                              + views/(system)/ai/summary/page.tsx
                              + views/(system)/ai/insights/page.tsx
                              + views/(system)/ai/translation/page.tsx
                              + views/(system)/ai/translation-entries/page.tsx
                              + views/(system)/ai/tasks/page.tsx
                              + views/(system)/ai/slug-backfill/page.tsx
views/analyze-page.tsx        → views/(system)/analyze/page.tsx
views/settings-page.tsx       → views/(system)/setting/page.tsx
                              + views/(system)/setting/[tab]/page.tsx

views/snippets-page.tsx       → views/(extra)/snippets/page.tsx
views/webhooks-page.tsx       → views/(extra)/webhooks/page.tsx

views/backup-page.tsx         → views/(maintenance)/backup/page.tsx
views/cron-page.tsx           → views/(maintenance)/cron/page.tsx
views/search-index-page.tsx   → views/(maintenance)/search-index/page.tsx
views/enrichment-page.tsx     → views/(maintenance)/enrichment/page.tsx
# Canonical URL becomes /maintenance/enrichment; /enrichment stays via redirects.ts

views/debug/*.tsx             → views/(debug)/{authn,events,rich,serverless,toast}/page.tsx
views/dev/*.tsx               → views/(dev)/<name>/page.tsx
```

### Section Meta Files

```
views/(content)/meta.ts        → { titleKey: 'shell.nav.content', order: 2 }
views/(community)/meta.ts      → { titleKey: 'shell.nav.community', order: 3 }
views/(assets)/meta.ts         → { titleKey: 'shell.nav.assets', order: 4 }
views/(system)/meta.ts         → { titleKey: 'shell.nav.system', order: 5 }
views/(extra)/meta.ts          → { titleKey: 'shell.nav.extra', order: 6 }
views/(maintenance)/meta.ts    → { titleKey: 'shell.nav.maintenance', order: 7 }
views/(debug)/meta.ts          → { titleKey: 'shell.nav.debug', order: 8 }
```

`(public)` has no meta — the plugin recognizes the group name and routes its
pages to `layout: 'public'`. `dashboard/` is top-level with implicit order 1.

### Phases

1. **Plumbing.** Scaffold `vite-plugins/admin-routes/`, add `defineMetadata`,
   declare the `virtual:admin-routes` module, and stub the runtime consumers
   so the build still succeeds with the existing manual `routes.tsx` in
   parallel.
2. **Pilot one section.** Migrate `(public)` (login / setup / setup-api).
   Verify lazy/sync distinction and auth-gate bypass.
3. **Bulk migration.** Move the remaining sections per the module map.
   One commit per section is preferred for review hygiene.
4. **Redirects and alias cleanup.** Author `redirects.ts`. Drop the
   alias-only sidebar entries (`/posts/view`, `/notes/view`, `/pages/list`,
   `/files/list`) — the group root page is the navigation leaf now.
5. **Dev/debug glob removal.** Delete the existing `import.meta.glob` blocks
   in the old `routes.tsx`.
6. **Shrink `routes.tsx`.** Remove the legacy ~850 lines; keep ~50 lines that
   consume the virtual module.
7. **Verification.** Run `pnpm lint` and
   `pnpm -C apps/admin exec tsc --noEmit --pretty false` on changed files;
   manually exercise each route in dev to confirm reachability and
   sidebar/highlight behavior.

### Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `views/(content)/posts/edit/page.tsx` imports `src/components/write/shell` → circular dependency | Enforce one-way dependency: extracted shells under `src/components/**` must not import from `views/**`. |
| Static AST parser fails on a `defineMetadata` call | Plugin throws a typed error pointing at the file path and the offending field. |
| Icon imports broken in tree-shaking | Generated module uses named lucide-react imports at top level; bundler shakes unused icons. |
| HMR misses a newly added `page.tsx` | Plugin watches add/unlink events and triggers a full reload on file changes. |
| Two pages resolve to the same URL | Scanner fails the build with a duplicate-path error covering both routes and redirects. |
| A page under `(public)` accidentally uses a shell-only hook | Documented constraint; out of scope for static enforcement. A future lint rule can close the gap. |

## Open Questions

None at spec time. All decisions are listed in the Decisions Summary table.

## Out of Scope (for follow-up work)

- ESLint rule that forbids `views/(public)/**` from importing shell-only
  hooks.
- Per-route loader / preload hints (currently every shell route is plain
  lazy).
- Code-splitting strategy for shared `src/components/{ai,write,files}/`
  modules.
