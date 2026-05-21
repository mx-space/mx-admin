# 04 · State Layer

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P0 (auth + ui stores) → P2 (full atom catalog)
**Depends on**: 01 (deps installed)
**Feeds**: 06 (auth store), 05 (TanStack Query is the *server* state half), 07 (layout slots), 11 (per-view atoms)

Defines the non-server state layer: Zustand stores for session-level singletons, Jotai atoms for page-local ephemeral state. Codifies the migration map from the existing Pinia stores and the elimination of `window.bus`.

---

## Scope

- **In**: state allocation rule, Zustand store definitions (auth, ui, layout backbone), Jotai atom catalog (layout slots, AI task queue, master-detail selection, table state, draft drawer), event-bus dismantle plan, persistence policy.
- **Out**: server data (→ 05), form state (→ 08, owned by `@tanstack/react-form`), router state (→ 06).

---

## State allocation rule (canonical)

| Bucket | Lives in | Examples |
|---|---|---|
| Server data | TanStack Query | posts list, comments, AI tasks, app info, categories |
| Session-level singleton | Zustand | auth, theme, viewport, layout backbone, sidebar collapse |
| Page-local ephemeral | Jotai | drawer open/close, master-detail selectedId, header-action slot, AI task queue, draft draft-drawer |
| Component-private | `useState` | search input field local value, toggle inside a leaf |

When uncertain: Jotai by default. Promote to Zustand only when state outlives the route or needs persistence.

---

## Zustand stores

Three stores at P0/P1. Total surface stays small intentionally — anything that does not pass the singleton bar above goes to Jotai.

### `useAuthStore`

```ts
// src/stores/auth.ts
import { create } from 'zustand'
import type { UserModel } from '~/models'

interface AuthState {
  user: UserModel | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null

  setUser: (u: UserModel | null) => void
  setStatus: (s: AuthState['status']) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,
  setUser: (user) =>
    set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
  setStatus: (status) => set({ status }),
  reset: () => set({ user: null, status: 'unauthenticated', error: null }),
}))
```

- **No persistence.** Session lives in HTTP-only cookies; the store is a runtime mirror only.
- **Single writer**: spec 06's `useAuth` hook is the only thing calling `setUser` / `reset`. Components read.
- **Derived selectors** (`useAuthStore((s) => s.user?.username)`) are encouraged over destructuring whole state.

### `useUIStore`

```ts
// src/stores/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'

interface UIState {
  themeMode: ThemeMode
  isDark: boolean
  viewport: { width: number; height: number }
  sidebarCollapsed: boolean

  setThemeMode: (mode: ThemeMode) => void
  toggleSidebar: () => void
  updateViewport: (w: number, h: number) => void
  refreshIsDark: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      isDark: false,
      viewport: { width: 0, height: 0 },
      sidebarCollapsed: false,
      setThemeMode: (themeMode) => {
        set({ themeMode })
        get().refreshIsDark()
      },
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      updateViewport: (width, height) => set({ viewport: { width, height } }),
      refreshIsDark: () => {
        const { themeMode } = get()
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark)
        set({ isDark })
        document.documentElement.classList.toggle('dark', isDark)
      },
    }),
    {
      name: 'mx-admin:ui',
      partialize: (s) => ({ themeMode: s.themeMode, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
```

- **Persisted keys**: `themeMode`, `sidebarCollapsed`. Viewport is recomputed on every mount.
- **`localStorage` key**: `mx-admin:ui`. Replaces source repo's loose `theme-mode` key — but the boot script in `index.html` (spec 01) reads the legacy `theme-mode` until P1 finalizes the migration script. **Migration script** (in 04 implementation): if `theme-mode` exists and `mx-admin:ui` does not, copy value into the new key.
- A small `useUIStoreEffects` component mounts at app root, registers `prefers-color-scheme` change listener, and a `window` resize listener that calls `updateViewport`.

### `useLayoutStore`

The Vue source `useLayoutStore` mixed two concerns: persistent layout config (sidebar, content padding default) and ephemeral slots (header actions, page title, float buttons holding VNodes). The new design splits them:

- **Backbone (persistent / cross-route)** → Zustand `useLayoutStore`.
- **Slots (ephemeral / per-route)** → Jotai atoms (see catalog below).

```ts
// src/stores/layout.ts
import { create } from 'zustand'

interface LayoutState {
  contentPaddingEnabled: boolean
  hideHeaderDefault: boolean
  setContentPadding: (enabled: boolean) => void
  setHideHeaderDefault: (hidden: boolean) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  contentPaddingEnabled: true,
  hideHeaderDefault: false,
  setContentPadding: (contentPaddingEnabled) => set({ contentPaddingEnabled }),
  setHideHeaderDefault: (hideHeaderDefault) => set({ hideHeaderDefault }),
}))
```

This store stays tiny on purpose. The actual page chrome (header actions, title, float buttons) flows through Jotai.

---

## Jotai atom catalog

Atoms are organized by feature. Each file under `src/atoms/` exports its atoms; consumers import by name.

### `atoms/layout.ts` — header / page slots

```ts
import { atom } from 'jotai'
import type { ReactNode } from 'react'

export const pageTitleAtom = atom<string | null>(null)
export const headerActionsAtom = atom<ReactNode>(null)
export const headerHiddenAtom = atom<boolean>(false)
export const contentPaddingDisabledAtom = atom<boolean>(false)
export const floatButtonsAtom = atom<Map<symbol, ReactNode>>(new Map())
```

- Pages use `useSetAtom(pageTitleAtom)` in a `useEffect` to set the title on mount. The `AppShell` (spec 07) reads the atoms.
- The float-buttons map keys by `Symbol()` so multiple components can register independently and unregister cleanly.
- A `useLayoutSlots` convenience hook in `src/hooks/useLayoutSlots.ts` wraps the common pattern: `useLayoutSlots({ title, actions, hideHeader })` resets on unmount.

### `atoms/ai-task-queue.ts`

```ts
import { atom } from 'jotai'

export interface TrackedAiTask {
  id: string
  kind: 'summary' | 'insights' | 'translation' | 'slug'
  status: 'pending' | 'running' | 'success' | 'failed'
  progress: number
  startedAt: number
  finishedAt?: number
  error?: string
}

export const aiTasksAtom = atom<TrackedAiTask[]>([])
export const aiTaskQueueOpenAtom = atom<boolean>(false)

export const aiActiveCountAtom = atom((get) =>
  get(aiTasksAtom).filter((t) => t.status === 'pending' || t.status === 'running').length
)

export const aiOverallProgressAtom = atom((get) => {
  const tasks = get(aiTasksAtom)
  if (tasks.length === 0) return 0
  return tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
})
```

- Polling lives in a `useAiTaskPolling()` hook (spec 11 — AI batch). The hook owns the `setInterval`.
- Derived atoms compute `activeCount` and `overallProgress` so the badge in the sidebar reads them without recomputing.

### `atoms/master-detail.ts` — atom family for selected-id-per-route

Multiple views share the master-detail pattern (comments, friends, projects, AI sub-views). Each view needs an independent `selectedId`. Atom families fit:

```ts
import { atomFamily } from 'jotai/utils'
import { atom } from 'jotai'

export const selectedIdAtomFamily = atomFamily(
  (key: string) => atom<string | null>(null),
  (a, b) => a === b
)

// usage in a view:
// const [selectedId, setSelectedId] = useAtom(selectedIdAtomFamily('comments'))
```

### `atoms/table.ts` — placeholder for table state

Until spec 12 lands the real Table, an atom family holds per-table state for sort/filter/page so views opt in early.

```ts
import { atomFamily } from 'jotai/utils'
import { atom } from 'jotai'

interface TableState {
  page: number
  pageSize: number
  sortBy: string | null
  sortOrder: 'asc' | 'desc' | null
  filters: Record<string, unknown>
  selectedRows: string[]
}

const initial: TableState = {
  page: 1,
  pageSize: 20,
  sortBy: null,
  sortOrder: null,
  filters: {},
  selectedRows: [],
}

export const tableStateAtomFamily = atomFamily(
  (_key: string) => atom<TableState>({ ...initial }),
)
```

The `useDataTableState(key)` hook (spec 05) reads / writes this atom and exposes a tuple-style API to consumers. When spec 12 ships, the hook contract stays — only its internals migrate.

### `atoms/draft.ts` — write-editor draft drawer

```ts
import { atom } from 'jotai'

export const draftRecoveryOpenAtom = atom<boolean>(false)
export const draftListOpenAtom = atom<boolean>(false)
export const activeDraftIdAtom = atom<string | null>(null)
```

Used by `manage-posts/write`, `manage-notes/write`, `manage-pages/write` (P4 / spec 09).

### `atoms/agent.ts` — selected agent model

```ts
import { atomWithStorage } from 'jotai/utils'

export const selectedAgentModelAtom = atomWithStorage<string | null>(
  'mx-admin:agent-model',
  null
)
```

This is a borderline case — it's session-level but scope is editor-local. Source repo persists it per editor instance via localStorage, so `atomWithStorage` matches behavior. Stays in Jotai because it doesn't pull weight as a Zustand store.

---

## Pinia → React migration map

| Source store | Source file | Destination | Notes |
|---|---|---|---|
| `useUserStore` | `src/stores/user.ts` | Zustand `useAuthStore` | Spec 06 owns the writer (login / logout / refresh). |
| `useUIStore` | `src/stores/ui.ts` | Zustand `useUIStore` | Persistence via `zustand/middleware/persist`. Boot-script keys migrated. |
| `useLayoutStore` | `src/stores/layout.ts` | Zustand `useLayoutStore` (backbone) + Jotai `atoms/layout.ts` (slots) | Splits responsibilities cleanly; VNode → ReactNode. |
| `useAppStore` | `src/stores/app.ts` | TanStack Query `useAppInfoQuery` | Pure server data — does not warrant a store. Consumers read via `useQuery`. |
| `useCategoryStore` | `src/stores/category.ts` | TanStack Query `useCategoriesQuery` | Same reasoning. The "computed map" derives in-component or via `select`. |
| `useAiTaskQueue` (composable, not Pinia) | `src/components/ai-task-queue/use-ai-task-queue.ts` | Jotai `atoms/ai-task-queue.ts` + `useAiTaskPolling` hook | Module-level `reactive` becomes atoms. |

---

## `window.bus` dismantle

The Vue source attaches an `EventBus` to `window.bus` and emits domain events (post created, comment incoming, link applied) from socket handlers. The new design replaces the bus with two cleaner channels:

1. **Realtime → TanStack Query invalidation.** Socket handlers in spec 05 call `queryClient.invalidateQueries(...)` directly. No bus.
2. **Realtime → toast.** Socket handlers call `toast.success(...)` / `toast.info(...)` directly via the sonner singleton.
3. **Cross-component imperative signals (rare).** Replace with explicit Zustand actions or a focused atom. Audit during 04 implementation: list every `bus.emit(...)` call site in source, classify each into invalidation, toast, or imperative-signal, and route accordingly.

After the audit, **no `window.bus` shim ships in the new repo**. Direct port of bus-pattern code is forbidden.

---

## Persistence policy

| Storage | Owner | Keys |
|---|---|---|
| `localStorage` | Zustand `persist` middleware | `mx-admin:ui` |
| `localStorage` | `atomWithStorage` | `mx-admin:agent-model` |
| `localStorage` | TanStack Query persister | `mx-admin-query-cache` (only `['ai']` prefix — see spec 05) |
| `sessionStorage` | manual (env override) | `VITE_APP_BASE_API` overrides for the setup flow |
| HTTP cookies | better-auth | session, csrf — never read directly from client code |

Versioning: each `persist` config sets a `version` field. When a stored shape changes, bump version and ship a migration in the store config; otherwise drop the persisted blob.

---

## Atom + Zustand combination patterns

**Reading both in one component**:

```ts
const isDark = useUIStore((s) => s.isDark)
const [pageTitle, setPageTitle] = useAtom(pageTitleAtom)
```

No special wrapper. Zustand and Jotai coexist without ceremony.

**Cross-store reactivity**: when a Zustand value should drive an atom (or vice versa), use a `useEffect`. Avoid building bridges; cross-pollination is rare and explicit `useEffect` is more readable.

**Read-only computed**: prefer derived Jotai atoms over component-side `useMemo` only when more than one component needs the same derived value.

---

## Acceptance for spec 04

### P0 acceptance

1. `useAuthStore`, `useUIStore`, `useLayoutStore` exist with the shapes above.
2. `useUIStore` persists `themeMode` + `sidebarCollapsed` to `mx-admin:ui`.
3. Boot script in `index.html` reads either legacy `theme-mode` or new `mx-admin:ui` key (migration script handles the swap).
4. `<html class="dark">` flips correctly when `setThemeMode` runs.
5. The atom catalog (`src/atoms/layout.ts`, `ai-task-queue.ts`, `master-detail.ts`, `table.ts`, `draft.ts`, `agent.ts`) exists with the atoms listed.
6. `useLayoutSlots` hook wraps the common slot-set pattern.

### P2 acceptance

1. `tableStateAtomFamily` is consumed by at least one P3 view (e.g. `/comments`) via `useDataTableState`.
2. `selectedIdAtomFamily` is consumed by at least three master-detail views.
3. `aiTasksAtom` round-trips through `useAiTaskPolling` correctly (verified with mock).

---

## Open questions

- **Devtools.** Both Zustand and Jotai ship dev integrations. Default: enable `redux-devtools` middleware on Zustand stores in dev only; Jotai's debug labels via `atom.debugLabel`. Confirm during implementation.
- **SSR posture.** The new repo is SPA only, so neither Zustand SSR nor Jotai's `Provider`-per-request is needed. If SSR ever becomes a target, both libraries support it without breaking.
- **`atomWithStorage` JSON shape changes.** No migration mechanism. If `selectedAgentModelAtom`'s shape changes, version the key (`:v2`) instead.
