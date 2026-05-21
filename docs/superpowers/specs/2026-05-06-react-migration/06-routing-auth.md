# 06 · Routing & Auth

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P0 (router shell + auth client) → P1 (login / setup flows + ProtectedRoute) → P3 (route tree expands per view batch)
**Depends on**: 04 (auth store), 05 (request, query client), 03 (Button, Input for login form)
**Feeds**: 07 (layouts mount under routes), 11 (per-view routes register here)

Defines the router topology, the auth client wiring (better-auth + passkey), the ProtectedRoute and setup-state guards, and the login / setup UX entry points.

---

## Scope

- **In**: route tree shape and registration, ProtectedRoute + SetupGuard, better-auth client setup, login flow (passkey + username), session check, logout, env-injected API URL handling, redirect rules, AUTH_FAILED handling.
- **Out**: per-view component implementations (→ 11), layouts internals (→ 07), form binding (→ 08).

---

## Decisions

- **`react-router` v7** in classic component-routing mode. No data router (`loader` / `action`).
- **One route tree** in `src/routes/index.tsx`. Routes are registered as JSX children of `<Routes>`.
- **`ProtectedRoute`** wraps every authenticated route as a layout route. `SetupGuard` wraps `/setup` and `/setup-api`.
- **better-auth client is the source of truth for session**. `useAuthStore` (Zustand) is a runtime mirror; the writer is `useAuthBootstrap()` (mounted once at app root).
- **No route-level loaders.** Auth checks happen inside `ProtectedRoute` via the auth store + a cached `useSession()` query.
- **Code-splitting**: every view module is `React.lazy()`. P0 / P1 ships the small handful eagerly; P3 batches add lazy routes.
- **Route names** preserved from source `src/router/name.ts` for stable named-route lookup (used by kbar in spec 10).

---

## Route topology

Mirror source `src/router/route.tsx`. Names and paths unchanged.

```
/                                  → redirect to /dashboard (when authed)
/login                             → public · LoginPage           (SetupLayout)
/setup                             → public · SetupPage            (SetupLayout, init-not-yet guard)
/setup-api                         → public · SetupApiPage         (SetupLayout)

/dashboard                         → auth · DashboardPage           (AppShell)
/posts/view                        → auth · PostsListPage
/posts/edit                        → auth · PostsWritePage
/posts/category                    → auth · PostsCategoryPage
/notes/view                        → auth · NotesListPage
/notes/edit                        → auth · NotesWritePage
/notes/topic                       → auth · NotesTopicPage
/comments                          → auth · CommentsPage
/drafts                            → auth · DraftsPage
/pages/list                        → auth · PagesListPage
/pages/edit                        → auth · PagesWritePage
/readers                           → auth · ReadersPage
/files/list                        → auth · FilesListPage
/files/orphans                     → auth · FilesOrphansPage
/files/comment-images              → auth · FilesCommentImagesPage
/says                              → auth · SaysListPage
/recently                          → auth · ShorthandPage
/projects                          → auth · ProjectsListPage
/friends                           → auth · FriendsPage
/ai/summary                        → auth · AiSummaryPage
/ai/insights                       → auth · AiInsightsPage
/ai/translation                    → auth · AiTranslationPage
/ai/translation-entries            → auth · AiTranslationEntriesPage
/ai/tasks                          → auth · AiTasksPage
/ai/slug-backfill                  → auth · AiSlugBackfillPage
/analyze                           → auth · AnalyzePage
/setting                           → auth · SettingPage          (with sub-tabs: user, account, meta-preset)
/setting/:tab                      → auth · SettingPage
/extra-features/snippets           → auth · SnippetsPage
/extra-features/subscribe          → auth · SubscribePage
/extra-features/webhooks           → auth · WebhookPage
/extra-features/assets/template    → auth · AssetTemplatePage
/extra-features/markdown           → auth · MarkdownHelperPage
/maintenance/cron                  → auth · CronPage
/maintenance/backup                → auth · BackupPage

/debug/*                           → auth · DebugRoutes (dev-only, glob)
/dev/*                             → auth · DevRoutes (dev-only, glob)

*                                  → NotFoundPage
```

**Layouts**:

- `SetupLayout` (spec 07) wraps `/login`, `/setup`, `/setup-api`.
- `AppShell` (spec 07) wraps every `auth` route.

---

## Route tree implementation

```tsx
// src/routes/index.tsx
import { lazy, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'
import { SetupGuard } from './SetupGuard'
import { AppShell } from '~/layouts/AppShell'
import { SetupLayout } from '~/layouts/SetupLayout'
import { RouteFallback } from '~/components/shared/RouteFallback'

const LoginPage = lazy(() => import('~/pages/login'))
const SetupPage = lazy(() => import('~/pages/setup'))
const SetupApiPage = lazy(() => import('~/pages/setup-api'))
const DashboardPage = lazy(() => import('~/pages/dashboard'))
// ... rest

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* public */}
        <Route element={<SetupLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<SetupGuard />}>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/setup-api" element={<SetupApiPage />} />
          </Route>
        </Route>

        {/* authed */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* ...rest of authed routes */}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
```

`<RouteFallback />` shows a small spinner / blank to bridge the lazy-load gap; spec 03 ships the Spinner.

---

## ProtectedRoute

```tsx
// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '~/stores/auth'
import { useAuthBootstrap } from '~/hooks/useAuthBootstrap'
import { RouteFallback } from '~/components/shared/RouteFallback'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  useAuthBootstrap()
  const location = useLocation()

  if (status === 'idle' || status === 'loading') return <RouteFallback />
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
```

`useAuthBootstrap()`:

- Runs once. Calls better-auth's `getSession()` via TanStack Query (`['auth', 'session']`).
- On success: `useAuthStore.setState({ user, status: 'authenticated' })`.
- On 401 / null: status → `'unauthenticated'`.
- Cached for 5 minutes (matches source `userApi.checkLogged()` cache window).
- Re-runs on `AUTH_FAILED` socket event (clears cache).

```ts
// src/hooks/useAuthBootstrap.ts (sketch)
export function useAuthBootstrap() {
  const setStatus = useAuthStore((s) => s.setStatus)
  const setUser = useAuthStore((s) => s.setUser)

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: () => authClient.getSession(),
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
  })

  useEffect(() => {
    if (isPending) { setStatus('loading'); return }
    if (isError || !data?.user) { setStatus('unauthenticated'); return }
    setUser(data.user)
  }, [data, isPending, isError, setStatus, setUser])
}
```

---

## SetupGuard

`/setup` is reachable only when the system is **not yet initialized**. Once an admin user exists, `/setup` redirects to `/login`.

```tsx
// src/routes/SetupGuard.tsx
import { Navigate, Outlet } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { systemApi } from '~/api/system'
import { RouteFallback } from '~/components/shared/RouteFallback'

export function SetupGuard() {
  const { data, isPending } = useQuery({
    queryKey: ['system', 'init'],
    queryFn: () => systemApi.checkIsInit(),
    staleTime: Infinity,
  })

  if (isPending) return <RouteFallback />
  if (data?.initialized) return <Navigate to="/login" replace />
  return <Outlet />
}
```

`/setup-api` skips the `initialized` check — it's a fallback for when the user has not yet pointed the admin at a backend at all (so the API call to `checkIsInit()` would itself fail).

---

## Auth client (better-auth)

### `src/lib/auth-client.ts`

```ts
import { createAuthClient } from 'better-auth/react'
import { passkeyClient } from '@better-auth/passkey/client'
import { usernameClient } from 'better-auth/client/plugins'
import { resolveBaseUrl } from '~/constants/env'

export const authClient = createAuthClient({
  baseURL: `${resolveBaseUrl()}/auth`,
  fetchOptions: { credentials: 'include' },
  plugins: [passkeyClient(), usernameClient()],
})
```

The client is framework-agnostic for the most part; better-auth ships React hooks separately under `better-auth/react`. We use the React variant for ergonomic `useSession()` if needed, but the canonical session source remains `useAuthBootstrap` to keep one writer.

### Login flow

`LoginPage`:

1. Username + password form — `@tanstack/react-form` + zod.
2. Passkey button — `authClient.signIn.passkey()`.
3. Both redirect to `state.from?.pathname ?? '/dashboard'` on success (read from `useLocation().state`).
4. Errors: `BusinessError` rendered inline below the form; `SystemError` toasts.

```ts
// pseudocode in LoginPage
async function onPasswordSubmit(values: { username: string; password: string }) {
  const res = await authClient.signIn.username(values)
  if (res.error) { setError(res.error.message); return }
  await refetchSession()
  navigate(state?.from?.pathname ?? '/dashboard', { replace: true })
}

async function onPasskey() {
  const res = await authClient.signIn.passkey()
  if (res.error) { toast.error(res.error.message); return }
  await refetchSession()
  navigate(state?.from?.pathname ?? '/dashboard', { replace: true })
}
```

### Setup flow

`SetupPage` (the init wizard) is a multi-step form ported from source `src/views/setup/index.tsx`. Spec 11 carries the visual port; spec 06 only confirms:

- It runs under `SetupGuard`.
- On success, it calls `authClient.signIn.username(...)` to log in the freshly created admin and navigates to `/dashboard`.

`SetupApiPage` writes the user-supplied API URL to `localStorage` and reloads the app. This page must work without any backend connection — it cannot import anything that triggers a `request` call at module load.

### Logout

```ts
async function logout() {
  await authClient.signOut()
  useAuthStore.getState().reset()
  queryClient.clear()
  navigate('/login', { replace: true })
}
```

Exposed via a `useLogout()` hook. Triggered from the sidebar user menu (spec 07).

---

## AUTH_FAILED handling

Source repo: `AUTH_FAILED` socket event triggers re-login flow.

New repo:

```ts
useSocketEvent(SocketEvent.AUTH_FAILED, () => {
  // already-running session went bad
  useAuthStore.getState().reset()
  queryClient.clear()
  navigate('/login', { replace: true })
  toast.warning('Session expired')
})
```

This subscription lives in `<SocketBridge />` (spec 05).

The 401 BusinessError path inside `request.ts` does not navigate directly — it throws `BusinessError(401, ...)`. Code that calls `useQuery` handles via the `useAuthBootstrap` re-check; for `useMutation`, the calling component decides whether to re-prompt or surface inline. A small `<UnauthenticatedBoundary />` component at the AppShell level catches uncaught 401s from any query and triggers the same logout path.

---

## Env-injected API URL

`/setup-api` lets the user override the backend URL at runtime:

```ts
// inside SetupApiPage
function commit(url: string) {
  localStorage.setItem('VITE_APP_BASE_API', url)
  location.reload()
}
```

The `resolveBaseUrl()` function (spec 01) reads:

```
sessionStorage.VITE_APP_BASE_API
  || localStorage.VITE_APP_BASE_API
  || window.injectData?.VITE_APP_BASE_API
  || import.meta.env.VITE_APP_BASE_API
```

Reload is intentional: most dependencies (request, socket, auth client) baked the resolved URL at module init.

---

## Redirect rules

| From | When | To |
|---|---|---|
| `/` | authed | `/dashboard` |
| `/` | unauthed | `/login` |
| any authed route | unauthed | `/login` (with `state.from`) |
| `/login` | authed | `/dashboard` (or `state.from?.pathname`) |
| `/setup` | already initialized | `/login` |
| any | source has `firstLoginRedirect` to `/setting/user` if a localStorage flag is set | preserve behavior |

The "first-login → setting" redirect lives in `AppShell`'s mount-once effect, not in the router.

---

## Acceptance for spec 06

### P0 acceptance

1. `src/lib/auth-client.ts` exports a configured better-auth client with passkey + username plugins.
2. `src/routes/index.tsx` exposes `<AppRoutes />`; `App.tsx` mounts it inside `<BrowserRouter>`.
3. Visiting `/dashboard` with no session redirects to `/login` and preserves `state.from`.
4. Visiting `/login` with an active session redirects to `/dashboard`.
5. `useAuthBootstrap` resolves the session inside ProtectedRoute on first paint.

### P1 acceptance

1. Login form (username + password) authenticates a real user end-to-end against a dev backend.
2. Passkey button registers + authenticates against a real backend.
3. `/setup` runs the init wizard end-to-end; on success the user lands on `/dashboard` authenticated.
4. `/setup-api` writes a custom API URL and reloads correctly.
5. Logout clears auth store, clears query cache, navigates to `/login`.
6. `AUTH_FAILED` socket event reproduces the same logout flow.
7. The sidebar user menu (spec 07) triggers `useLogout()` correctly.

---

## Open questions

- **Lazy-loading granularity.** All view modules are lazy by default; some tiny pages (login, setup-api, dashboard) might be eager for first-paint speed. Decide during P1 measurement.
- **`useSession` vs `useAuthBootstrap`.** Both wrap the session check. Decision: only `useAuthBootstrap` writes to the auth store; component code reads `useAuthStore`. Avoid sprinkling `useSession()` calls.
- **First-login redirect mechanism.** Source repo uses a localStorage flag set during setup. Keep behavior; document the flag name explicitly during implementation.
- **`/setting/:tab` vs query string.** Source uses path-based tab. Keep path-based for shareable URLs.
- **Persistent session check interval.** Source caches 5 min. New repo uses 5 min. Adjust if backend session lifetime changes.
