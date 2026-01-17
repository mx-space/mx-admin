# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MX Admin (admin-vue3) is the **legacy dashboard** for MX Space, a personal blog management system. Built with Vue 3, Naive UI, and Tailwind CSS v4. This project is being replaced by `mx-dashboard` (React-based rewrite).

> **Note**: This is the old version of the dashboard. For new feature development, prefer working on `mx-dashboard` instead.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (opens browser automatically)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
pnpm lint:fix

# Format code
pnpm format
```

## Architecture Overview

### Directory Structure

- `src/views/` - Page components organized by feature
- `src/components/` - Reusable UI components
- `src/layouts/` - Layout components (sidebar, header, etc.)
- `src/stores/` - Pinia state management stores
- `src/router/` - Vue Router configuration
- `src/models/` - TypeScript type definitions and API models
- `src/hooks/` - Vue 3 composables
- `src/utils/` - Utility functions
- `src/socket/` - WebSocket connection handling
- `src/external/` - External service integrations

### Technology Stack

- **Vue 3** - UI framework with Composition API
- **Naive UI** - Component library
- **Tailwind CSS v4** - Utility-first CSS framework
- **Pinia** - State management
- **Vue Router** - Routing
- **CodeMirror/Monaco** - Code editors
- **@mx-space/api-client** - API client for backend communication

### Key Patterns

**State Management**: Uses Pinia stores in `src/stores/` for global state.

**API Integration**: Uses `@mx-space/api-client` for type-safe API calls to MX Core backend.

**Auto Import**: Uses `unplugin-auto-import` for automatic importing of Vue APIs and components.

**WebSocket**: Real-time updates via Socket.IO connection to backend.

## Configuration

- Environment variables in `.env` and `.env.production`
- Vite configuration in `vite.config.mts`
- Tailwind CSS configuration in `src/index.css` (@theme block)
- Theme colors in `src/utils/color.ts` (fixed Vercel-style neutral gray)

## Claude Code Rules

- **验证方式**：修改代码后只需运行类型检查（`pnpm tsc --noEmit` 或依赖 IDE 诊断），不要运行 `pnpm build` 构建整个项目

## Related Projects

- **mx-core** - Backend API server (NestJS + MongoDB)
- **mx-dashboard** - New React-based dashboard (replacement for this project)
