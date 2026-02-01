# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MX Admin (admin-vue3) is the dashboard for MX Space, a personal blog management system. Built with Vue 3, Naive UI, and UnoCSS. This is the v4.0 admin interface for Mix Space Server v5.0.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (opens browser automatically)
pnpm build            # Build for production
pnpm lint             # Lint code with Biome
pnpm lint:fix         # Lint and auto-fix
npx tsc --noEmit      # Type check (use this instead of build for validation)
```

## Architecture Overview

### Technology Stack

- **Vue 3** with Composition API and TSX (JSX via `@vitejs/plugin-vue-jsx`)
- **Naive UI** - Component library with Vercel-style neutral theme
- **UnoCSS** (preset-wind4) - Tailwind-compatible utility classes
- **Pinia** - State management
- **TanStack Query** (`@tanstack/vue-query`) - Server state management with localStorage persistence
- **Socket.IO** - Real-time WebSocket updates
- **CodeMirror/Monaco** - Code editors

### Path Aliases

```typescript
import { something } from '~/utils/...'  // ~ maps to ./src
```

### API Layer (`src/api/`)

API services use the custom request layer built on `ofetch`. The backend wraps array responses as `{ data: [...] }`, which is automatically unwrapped by the request layer.

When using TanStack Query, extract arrays with:
```typescript
select: (res: any) => Array.isArray(res) ? res : res?.data ?? []
```

**Error Classes:**
- `BusinessError` - Application-level errors (4xx responses)
- `SystemError` - Network/server errors (5xx responses, network failures)

### State Management

**Pinia Stores (`src/stores/`):**
- `useUIStore` - Theme mode (light/dark/system), viewport dimensions, sidebar state
- `useUserStore` - User authentication state
- `useAppStore` - Global application state
- `useCategoryStore` - Category data

### Responsive Breakpoints (UnoCSS)

- `phone:` - max-width: 768px
- `tablet:` - max-width: 1023px
- `desktop:` - min-width: 1024px

## Code Style Rules

### Validation

After modifying code, run type check only (`npx tsc --noEmit`). Do not run `pnpm build` for validation.

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
- `src/utils/color.ts` - Naive UI theme overrides (Vercel-style neutral gray palette)
- `biome.json` - Linter/formatter configuration with Vue globals
- `.env` - Local dev API endpoint (`VITE_APP_BASE_API`)

## Related Projects

- **mx-core** - Backend API server (NestJS + MongoDB), located at `../mx-core`
