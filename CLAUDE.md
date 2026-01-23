# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MX Admin (admin-vue3) is the dashboard for MX Space, a personal blog management system. Built with Vue 3, Naive UI, and UnoCSS.

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
- **TanStack Query** (`@tanstack/vue-query`) - Server state management
- **Socket.IO** - Real-time WebSocket updates
- **CodeMirror/Monaco** - Code editors

### Path Aliases

```typescript
import { something } from '~/utils/...'  // ~ maps to ./src
```

### API Layer (`src/api/`)

API services wrap `@mx-space/api-client`. Backend wraps array responses as `{ data: [...] }`. Extract with:
```typescript
select: (res: any) => Array.isArray(res) ? res : res?.data ?? []
```

### Auto-Imported APIs

Vue Composition APIs (`ref`, `computed`, `watch`, etc.) are globally available via Biome globals config - no imports needed.

### Responsive Breakpoints (UnoCSS)

- `phone:` - max-width: 768px
- `tablet:` - max-width: 1023px
- `desktop:` - min-width: 1024px

## Claude Code Rules

- **验证方式**：修改代码后只需运行类型检查（`npx tsc --noEmit`），不要运行 `pnpm build` 构建整个项目
- **灰阶颜色**：所有灰阶色必须使用 `neutral` 而不是 `gray`（如 `text-neutral-500`、`bg-neutral-800`、`border-neutral-200`）。这与项目的 Vercel 风格设计一致
- **字号规范**：禁止使用任意值字号（如 `text-[11px]`、`text-[13px]`），必须使用标准 Tailwind 类：
  - `text-2xl` (24px) - 页面大标题
  - `text-xl` (20px) - 区块标题
  - `text-lg` (18px) - 卡片/Modal 标题
  - `text-base` (16px) - 次级标题
  - `text-sm` (14px) - 正文、列表标题、按钮
  - `text-xs` (12px) - 元数据、时间戳、徽章

  详见 `docs/typography.md`

## Configuration Files

- `uno.config.ts` - UnoCSS configuration with custom breakpoints and theme colors
- `src/utils/color.ts` - Naive UI theme overrides (Vercel-style neutral gray palette)
- `biome.json` - Linter/formatter configuration with Vue globals
- `.env` - Local dev API endpoint (`VITE_APP_BASE_API`)

## Related Projects

- **mx-core** - Backend API server (NestJS + MongoDB), located at `../mx-core`
