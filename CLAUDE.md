# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MX Admin is the dashboard for MX Space, a personal blog management system. The active admin app is a React application built with Base UI primitives, React Router, TanStack Query, Sonner, and UnoCSS.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (opens browser automatically)
pnpm build            # Build for production
pnpm lint             # Lint code with oxlint
pnpm lint:fix         # Lint and auto-fix
pnpm -C apps/admin exec tsc --noEmit --pretty false
```

## Architecture Overview

### Technology Stack

- **React** with TSX
- **Base UI** - Headless component primitives
- **React Router** - Route rendering and shell navigation
- **UnoCSS** (preset-wind4) - Tailwind-compatible utility classes
- **TanStack Query** (`@tanstack/react-query`) - Server state management
- **Sonner** - Toast notifications
- **Socket.IO** - Real-time WebSocket updates

### Path Aliases

```typescript
import { something } from '~/utils/...'  // ~ maps to ./src
```

### API Layer (`src/app/api/`)

React app API services use the fetch-based helpers in `src/app/api/http.ts`.

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

## Configuration Files

- `uno.config.ts` - UnoCSS configuration with custom breakpoints and theme colors
- `src/app/theme.ts` - CSS token installation for the React shell
- `src/app/` - React routes, shell, API helpers, UI primitives, and migrated views
- `.env` - Local dev API endpoint (`VITE_APP_BASE_API`)

## Related Projects

- **mx-core** — Backend API server (NestJS + MongoDB), located at `../mx-core`
- **Shiroi** — Next.js frontend (blog), located at `../Shiroi`
- **haklex** — Rich editor packages (`@haklex/*`), located at `../haklex` (standalone) or `../Shiroi/haklex` (original host)

### Rich Editor Integration

The admin app no longer mounts rich editor surfaces through a framework bridge. React editor work should be integrated as ordinary React components and kept out of compatibility shims.
