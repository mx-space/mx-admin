# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MX Admin is the dashboard for MX Space, a personal blog management system. The repo is a pnpm workspace whose only active app is `apps/admin` — a React 19 SPA built with Base UI primitives, React Router (HashRouter), TanStack Query, Sonner, UnoCSS, and a Tailwind v4 layer. Despite the repo name `admin-vue3`, the Vue codebase has been retired; React is the sole runtime.

## Development Commands

Root scripts proxy to `apps/admin` via `pnpm -C apps/admin <task>`:

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Vite dev server (opens browser automatically)
pnpm build            # Production build
pnpm lint             # oxlint
pnpm lint:fix         # oxlint --fix
pnpm typecheck        # tsc --noEmit (per-package)
```

Scope checks to changed files only — never run lint/typecheck/build over the whole tree just to verify a small edit. For a one-off file typecheck inside the app: `pnpm -C apps/admin exec tsc --noEmit --pretty false`.

Local API endpoint lives in `apps/admin/.env` as `VITE_APP_BASE_API`.

## Architecture Overview

### Technology Stack

- **React 19** + TSX, react-compiler enabled via Babel
- **Base UI** (`@base-ui/react`) — headless primitives; UI wrappers live in `apps/admin/src/ui/`
- **React Router 7** (`HashRouter`) — `apps/admin/src/routes.tsx` is the single source of route → lazy-view mapping
- **UnoCSS** (preset-wind4) + **Tailwind v4** layer via `@tailwindcss/vite`
- **TanStack Query** — created in `apps/admin/src/query-client.ts`, mounted in `providers.tsx`
- **Sonner** — toast layer mounted alongside the query provider
- **Socket.IO** — `src/socket/SocketBridge` hangs off the authenticated shell
- **better-auth** + passkey for login; auth gate in `App.tsx` (`checkLogged` query) wraps everything except `/setup`, `/setup-api`, `/login`

### Entry & Shell

`main.tsx` → `App.tsx` (mounts providers, HashRouter, auth gate, installs theme tokens via `installThemeTokens`) → `AdminShell` (nav chrome + `SocketBridge` + `AppRoutes`). All views in `routes.tsx` are `lazy()`-loaded and wrapped in `<Suspense>`; add new pages by registering a lazy import there.

### Path Aliases

```typescript
import { something } from '~/utils/...'  // ~ → apps/admin/src
```

### API Layer (`apps/admin/src/api/`)

API services use the fetch-based helpers in `apps/admin/src/api/http.ts`.

When using TanStack Query, extract arrays with:
```typescript
select: (res: any) => Array.isArray(res) ? res : res?.data ?? []
```

**Error Classes:**
- `BusinessError` - Application-level errors (4xx responses)
- `SystemError` - Network/server errors (5xx responses, network failures)

### Responsive Breakpoints (UnoCSS)

- `phone:` - max-width: 768px
- `tablet:` - max-width: 1023px
- `desktop:` - min-width: 1024px

## Code Style Rules

### Validation

After modifying code, run focused type checking and linting. Run production build before reporting completion for broad application changes.

### Gray Scale Colors

All gray colors MUST use `neutral` instead of `gray` to match the Vercel-style design:
- ✅ `text-neutral-500`, `bg-neutral-800`, `border-neutral-200`
- ❌ `text-gray-500`, `bg-gray-800`, `border-gray-200`

### Typography

Do NOT use arbitrary font sizes (e.g., `text-[11px]`, `text-[13px]`). Use standard Tailwind classes:

| Purpose | Class | Size | Use Case |
|---------|-------|------|----------|
| Page title | `text-2xl` | 24px | Main page titles |
| Section title | `text-xl` | 20px | Section headers |
| Card/Modal title | `text-lg` | 18px | Card titles, modal headers |
| Secondary title | `text-base` | 16px | Sub-headings, stats |
| Body text | `text-sm` | 14px | List items, form labels, buttons |
| Metadata | `text-xs` | 12px | Timestamps, badges, descriptions |

See `docs/typography.md` for full guidelines.

## Layout Conventions

New admin views must follow the master-detail / content-layout convention. See:

- `docs/master-detail-layout.md` — list+detail pages (comments, drafts, topics)
- `docs/typography.md` — full typography rules
- `apps/admin/src/ui/content-layout.tsx` and `page-layout.tsx` — reusable shells

## Configuration Files

- `apps/admin/vite.config.mts` — Vite + react-compiler + Tailwind + mkcert + checker
- `apps/admin/uno.config.ts` — UnoCSS breakpoints (`phone:`, `tablet:`, `desktop:`) and theme colors (if present)
- `apps/admin/src/theme.ts` — CSS token installation for the shell
- `apps/admin/src/index.css` — global stylesheet + Tailwind layer

## Related Projects

- **mx-core** — Backend API server (NestJS + MongoDB), located at `../mx-core`
- **Shiroi** — Next.js frontend (blog), located at `../Shiroi`
- **haklex** — Rich editor packages (`@haklex/*`), located at `../haklex` (standalone) or `../Shiroi/haklex` (original host)

### Rich Editor Integration

The admin app no longer mounts rich editor surfaces through a framework bridge. React editor work should be integrated as ordinary React components and kept out of compatibility shims.
