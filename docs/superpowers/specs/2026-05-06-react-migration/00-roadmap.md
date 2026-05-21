# Vue 3 → React Migration · Roadmap

**Date**: 2026-05-06
**Scope**: New greenfield repo `admin-react`. Source repo (`admin-vue3/apps/admin`, v7.0.1) is frozen during migration and replaced at cutover.
**Goal**: 1:1 functional parity + design redesign (Linear dark-canvas system) on a modern React stack.

This document is the **index**. It carries decisions and milestones, not implementation detail. Each sub-spec under this folder owns one slice of the migration.

---

## Sub-spec layout

```
docs/superpowers/specs/2026-05-06-react-migration/
├── 00-roadmap.md           ← this file
├── 01-repo-skeleton.md     ← Vite 8, tsconfig, oxlint, env, html, deps, dir layout
├── 02-design-tokens.md     ← Linear DESIGN.md → css.ts tokens, theme switching
├── 03-ui-primitives.md     ← Base UI wrappers, API + variant + a11y contracts
├── 04-state-layer.md       ← Zustand stores, Jotai atoms, event-bus removal, persistence
├── 05-data-layer.md        ← request.ts port, TanStack Query patterns, socket.io hook
├── 06-routing-auth.md      ← react-router tree, ProtectedRoute, better-auth + passkey
├── 07-layouts-patterns.md  ← AppShell, Sidebar, MasterDetailLayout, header-action injection
├── 08-form-system.md       ← @tanstack/react-form + zod (Standard Schema), ConfigForm DSL port
├── 09-editors.md           ← haklex direct-mount, monaco, codemirror, xterm, draft system
├── 10-charts-misc.md       ← G2 hook, kbar swap, shiki/marked, diffs, excalidraw, confetti
├── 11-views-migration.md   ← 21 views in batches; preconditions + acceptance per batch
└── 12-table-effort.md      ← dedicated table effort (TanStack Table or hand-built)
```

**Writing order**: this file + 01–06 first (P0 + P1 ammunition). 07–10 and 12 are written when P1 calibrates tokens and primitives. 11 is written when P2 settles patterns.

---

## Tech stack decisions

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 19 + Vite 8 + `@vitejs/plugin-react-swc` | Vite 8 already on source repo; SWC for speed |
| Routing | `react-router` v7 (classic `<Routes>/<Route>`) | User-specified; data router (loaders) explicitly rejected |
| Server state | `@tanstack/react-query` 5.x + `query-persist-client-core` | 1:1 port; `['ai']` prefix persisted to localStorage |
| Session state | Zustand | auth, theme, layout backbone, ui — singletons that span the session |
| Page-local state | Jotai | drawer toggles, form drafts, selections, AI task queue, layout slots (header actions, page title) |
| UI primitives | Base UI (`@base-ui-components/react`) | headless; pairs with css.ts |
| Styling | css.ts (`@vanilla-extract/css` + vite plugin) | Compile-time CSS; tokens live as TS exports |
| Design system | Linear dark-canvas (per pasted DESIGN.md) | Lavender accent, four-step surface ladder, no second chromatic accent |
| Forms | `@tanstack/react-form` + `zod` (Standard Schema) | aligns with TanStack Query/Table; zod already in source repo; library swap landed 2026-05-10 |
| Animation | `motion` | User-specified |
| Icons | `lucide-react` | 1:1 swap from `lucide-vue-next` |
| Toast | `sonner` | 1:1 swap from `vue-sonner` |
| Command palette | `kbar` | Original React lib; replaces `@bytebase/vue-kbar` |
| Code editors | `@monaco-editor/react`, CodeMirror 6 hand-rolled | Slash menu / WYSIWYG depth justifies hand-roll for CM6 |
| Rich editor | `@haklex/*` mounted directly (no Vue bridge) | `@mx-admin/rich-react` already React-native |
| Charts | `@antv/g2` via `useG2Chart` hook | Library is framework-agnostic |
| Terminal | `xterm` via `useEffect` mount | Library is framework-agnostic |
| Realtime | `socket.io-client` via `useSocketIO` hook | Replaces `window.bus` event bus |
| Auth | `better-auth` + `@better-auth/passkey` | Framework-agnostic; same flow |
| API client | `ofetch` + existing `@mx-space/api-client` types | Both framework-agnostic; port unchanged |
| Lint | `oxlint` | Sticks with current toolchain |

### Explicitly rejected

- TanStack Router data router (loaders/actions). Component routing only.
- Tailwind / UnoCSS for the new repo (css.ts wins).
- Naive UI compatibility shim. Full primitive rewrite.
- SSR. SPA only, same as source.

---

## State allocation rule (canonical)

| Bucket | Goes to |
|---|---|
| Server data (anything fetched from API) | TanStack Query |
| Session-level singletons (auth, theme, layout backbone, app config) | Zustand |
| Page-local ephemeral (drawer open, form draft, selected id, AI task queue, header-action slot) | Jotai |
| Truly component-private | `useState` |

Cross-component fan-out without server fetch → Jotai by default. Promote to Zustand only when state outlives the route.

---

## Dependency graph

```
00-roadmap (index)
01-repo ──┬─→ 02-tokens ──→ 03-primitives ──┐
          │                                   ├─→ 07-layouts ──┐
          ├─→ 04-state ──────────────────────┤                 │
          ├─→ 05-data ───────────────────────┤                 ├─→ 11-views
          └─→ 06-routing-auth ───────────────┘                 │
                                                                │
                                  08-form ──────────────────────┤
                                  09-editors ───────────────────┤
                                  10-charts-misc ───────────────┤
                                  12-table ─────────────────────┘
```

A spec may be **drafted** before its upstream dependencies stabilize, but must be **finalized** in graph order.

---

## Milestones

| Phase | Window | Deliverable | Spec dependency |
|---|---|---|---|
| **P0 thin-foundation** | ~1 wk | repo scaffolding, theme tokens, 5 primitives (Button/Input/Card/Modal/Toast), request layer, query client, router shell, auth client | 01, 02, 03 (subset), 04 (subset), 05 (subset), 06 (subset) |
| **P1 vertical slice** | ~1.5 wk | `/login`, `/setup-api`, `/setup`, AppShell + Sidebar, `/dashboard` (incl. G2 charts, socket, kbar). Tokens **calibrated** against real surface. | 06, 07 (initial), 10 (G2 + kbar partial) |
| **P2 primitive backfill + patterns** | ~1.5 wk | Drawer, Tabs, Tooltip, Popover, Select, Switch, Checkbox, Tag, Skeleton, Empty, Pagination, Avatar, Badge, Progress, Spinner, Ellipsis, Scroll. MasterDetailLayout, ConfigForm DSL, placeholder Table API. | 03 (full), 07 (full), 08 |
| **P3 horizontal sweep** | ~5 wk | 16 views in 6 batches (3a list-read, 3b config, 3c analyze, 3d files, 3e AI, 3f extras). Batches parallelizable. | 11 |
| **P4 rich-write closure** | ~3 wk | `/posts/edit`, `/notes/edit`, `/pages/edit`, `/posts/category`. haklex direct-mount, draft system, agent sidebar, metadata drawer. | 09 |
| **P5 wrap-up** | ~1 wk | debug routes, dev tools, first-paint optimization, bundle split, smoke E2E. | — |
| **Table track** | parallel from end of P2 | Real Table replaces placeholder. | 12 |

**Total**: ~13 weeks for the main track + Table track running parallel from week 4.

---

## Critical-path risks

1. **Table is a blocker for ~50% of views.** P2 ships a placeholder `useDataTableState` API + minimal renderer so P3 can proceed; the Table track replaces internals later without view-side rewrites.
2. **haklex bridge removal** is mechanically simple but the **draft system, agent chat state, and Lexical theme injection** need careful porting. Pin haklex package versions across the migration window.
3. **socket.io currently dispatches via `window.bus`.** Migration moves to `useSocketIO` hook + Jotai/context fan-out. Audit every `window.bus` consumer before removing the bus.
4. **css.ts is compile-time.** Dynamic per-instance styling (e.g. `motion` interpolations) must use inline style or `style` props, not generated css.ts variants. 02 + 03 nail down the contract.
5. **Linear tokens** will get hammered during P1. Treat 02 as "v0 → calibrated v1 at end of P1". Do not freeze before that.
6. **Auth cookies need same-origin (or properly configured CORS).** Confirm during 06 implementation; affects local dev proxy config in 01.

---

## Out of scope

- Backend changes. The migration consumes the existing mx-core API surface unchanged.
- E2E test framework choice. Smoke E2E in P5 uses whatever is light (Playwright suggested but not mandated here).
- i18n. Source repo is Chinese-only; new repo inherits the same posture.
- Mobile app. Responsive web only.

---

## Cross-references to source surveys

The six parallel surveys feeding this roadmap are summarized inline across 01–12. The raw survey output is preserved in agent transcripts and not re-pasted here.

- Routes & views — feeds 11
- State stores — feeds 04
- API & data — feeds 05
- UI components — feeds 03, 08
- Heavy assets — feeds 09, 10
- Auth & build — feeds 01, 06
