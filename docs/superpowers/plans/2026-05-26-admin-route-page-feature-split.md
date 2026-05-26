# Admin Route Page Feature Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor every admin route page so `apps/admin/src/views/*-page.tsx` and debug route view files become thin route skeletons, while business UI, hooks, types, constants, and utilities live under `apps/admin/src/features/<domain>/...`.

**Architecture:** Keep route registration stable in `apps/admin/src/routes.tsx`. Move page-owned implementation into feature domains, first by establishing route-level feature entry points and then by splitting large route implementations into focused `components`, `hooks`, `types`, `utils`, and `constants` files. Keep globally shared primitives in `apps/admin/src/ui`, global API clients in `apps/admin/src/api`, and backend response models in `apps/admin/src/models`.

**Tech Stack:** React 19, React Router 7, TanStack Query 5, Vite 8, TypeScript 5.9, oxlint, pnpm.

---

## Non-Negotiable Invariants

- Do not use `git restore`, `git checkout --`, `git reset --hard`, or equivalent destructive workflows.
- Preserve unrelated dirty files currently present in the worktree.
- Keep imports route-compatible with the existing `~/*` alias in `apps/admin/tsconfig.json`.
- Each `views/*-page.tsx` file must become a thin wrapper or re-export after its feature migration.
- Each non-trivial component extracted from a migrated page must live in its own file.
- Type-only definitions owned by one feature must live in `features/<domain>/types`.
- Static option lists and query keys owned by one feature must live in `features/<domain>/constants.ts` or a focused constants file.
- Pure transformations, URL parsers, payload builders, and formatters must live in `features/<domain>/utils`.
- Behavior checks are preferred over implementation-snapshot tests.

## Target Shape

```text
apps/admin/src/
├── views/
│   ├── posts-page.tsx
│   ├── write-page.tsx
│   └── ...
├── features/
│   ├── posts/
│   │   ├── routes/PostsRouteView.tsx
│   │   ├── components/PostListItem.tsx
│   │   ├── hooks/usePostsListState.ts
│   │   ├── types/posts-list.ts
│   │   ├── utils/search-params.ts
│   │   └── constants.ts
│   ├── write/
│   │   ├── routes/PostWriteRouteView.tsx
│   │   ├── routes/NoteWriteRouteView.tsx
│   │   ├── routes/PageWriteRouteView.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── constants.ts
│   └── settings/
│       ├── routes/SettingsRouteView.tsx
│       ├── components/
│       ├── hooks/
│       ├── types/
│       ├── utils/
│       └── constants.ts
```

## Page Inventory and Domain Mapping

| Current file | Feature domain | Target route entry |
| --- | --- | --- |
| `apps/admin/src/views/dashboard-page.tsx` | `dashboard` | `features/dashboard/routes/DashboardRouteView.tsx` |
| `apps/admin/src/views/posts-page.tsx` | `posts` | `features/posts/routes/PostsRouteView.tsx` |
| `apps/admin/src/views/write-page.tsx` | `write` | `features/write/routes/PostWriteRouteView.tsx`, `NoteWriteRouteView.tsx`, `PageWriteRouteView.tsx` |
| `apps/admin/src/views/write-page-meta-presets.tsx` | `write` | `features/write/meta-presets.tsx` |
| `apps/admin/src/views/categories-page.tsx` | `categories` | `features/categories/routes/CategoriesRouteView.tsx` |
| `apps/admin/src/views/notes-page.tsx` | `notes` | `features/notes/routes/NotesRouteView.tsx` |
| `apps/admin/src/views/topics-page.tsx` | `topics` | `features/topics/routes/TopicsRouteView.tsx` |
| `apps/admin/src/views/pages-page.tsx` | `pages` | `features/pages/routes/PagesRouteView.tsx` |
| `apps/admin/src/views/drafts-page.tsx` | `drafts` | `features/drafts/routes/DraftsRouteView.tsx` |
| `apps/admin/src/views/says-page.tsx` | `says` | `features/says/routes/SaysRouteView.tsx` |
| `apps/admin/src/views/recently-page.tsx` | `recently` | `features/recently/routes/RecentlyRouteView.tsx` |
| `apps/admin/src/views/projects-page.tsx` | `projects` | `features/projects/routes/ProjectsRouteView.tsx` |
| `apps/admin/src/views/comments-page.tsx` | `comments` | `features/comments/routes/CommentsRouteView.tsx` |
| `apps/admin/src/views/readers-page.tsx` | `readers` | `features/readers/routes/ReadersRouteView.tsx` |
| `apps/admin/src/views/friends-page.tsx` | `friends` | `features/friends/routes/FriendsRouteView.tsx` |
| `apps/admin/src/views/subscribe-page.tsx` | `subscribe` | `features/subscribe/routes/SubscribeRouteView.tsx` |
| `apps/admin/src/views/files-page.tsx` | `files` | `features/files/routes/FilesRouteView.tsx`, `OrphanFilesRouteView.tsx`, `CommentImagesRouteView.tsx` |
| `apps/admin/src/views/template-page.tsx` | `templates` | `features/templates/routes/TemplateRouteView.tsx` |
| `apps/admin/src/views/markdown-page.tsx` | `markdown` | `features/markdown/routes/MarkdownRouteView.tsx` |
| `apps/admin/src/views/ai-page.tsx` | `ai` | `features/ai/routes/AiRouteView.tsx` |
| `apps/admin/src/views/analyze-page.tsx` | `analyze` | `features/analyze/routes/AnalyzeRouteView.tsx` |
| `apps/admin/src/views/settings-page.tsx` | `settings` | `features/settings/routes/SettingsRouteView.tsx` |
| `apps/admin/src/views/backup-page.tsx` | `backup` | `features/backup/routes/BackupRouteView.tsx` |
| `apps/admin/src/views/cron-page.tsx` | `cron` | `features/cron/routes/CronRouteView.tsx` |
| `apps/admin/src/views/search-index-page.tsx` | `search-index` | `features/search-index/routes/SearchIndexRouteView.tsx` |
| `apps/admin/src/views/enrichment-page.tsx` | `enrichment` | `features/enrichment/routes/EnrichmentRouteView.tsx` |
| `apps/admin/src/views/login-page.tsx` | `auth` | `features/auth/routes/LoginRouteView.tsx` |
| `apps/admin/src/views/setup-page.tsx` | `setup` | `features/setup/routes/SetupRouteView.tsx` |
| `apps/admin/src/views/setup-api-page.tsx` | `setup` | `features/setup/routes/SetupApiRouteView.tsx` |
| `apps/admin/src/views/*-debug-page.tsx` | `debug` | `features/debug/routes/*DebugRouteView.tsx` |
| `apps/admin/src/views/debug/*.tsx` | `debug` | Thin wrappers or route glob adapters after debug migration |

## Route Skeleton Contract

Each migrated view file should contain only an import and export:

```tsx
export { PostsRouteView as PostsPage } from '~/features/posts/routes/PostsRouteView'
```

For files that export multiple route entries, keep only aliases:

```tsx
export { NoteWriteRouteView as NoteWritePage } from '~/features/write/routes/NoteWriteRouteView'
export { PageWriteRouteView as PageWritePage } from '~/features/write/routes/PageWriteRouteView'
export { PostWriteRouteView as PostWritePage } from '~/features/write/routes/PostWriteRouteView'
```

## Task 1: Establish Migration Scaffold and Guardrails

**Files:**
- Create: `apps/admin/src/features/.gitkeep` if no feature file exists yet
- Modify: no route behavior

- [ ] Run:

```bash
rtk git status --short
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
```

- [ ] Record unrelated failures before editing. Do not fix unrelated files.
- [ ] Confirm `apps/admin/src/features` exists before moving page implementation.

## Task 2: Low-Risk Single-Page Domains

**Files:**
- Modify: `apps/admin/src/views/readers-page.tsx`
- Modify: `apps/admin/src/views/says-page.tsx`
- Modify: `apps/admin/src/views/subscribe-page.tsx`
- Modify: `apps/admin/src/views/template-page.tsx`
- Modify: `apps/admin/src/views/markdown-page.tsx`
- Create: matching `features/<domain>/routes/*RouteView.tsx`
- Create: matching `features/<domain>/components/*.tsx`, `types/*.ts`, `utils/*.ts`, `constants.ts` when the page contains local declarations

- [ ] Move each page implementation into its domain route entry.
- [ ] Replace each view file with the route skeleton export.
- [ ] Extract local JSX helpers into one-file components.
- [ ] Extract local union types and interfaces into `types`.
- [ ] Run:

```bash
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
```

## Task 3: Existing List Management Pages

**Files:**
- Modify: `apps/admin/src/views/posts-page.tsx`
- Modify: `apps/admin/src/views/notes-page.tsx`
- Modify: `apps/admin/src/views/pages-page.tsx`
- Modify: `apps/admin/src/views/categories-page.tsx`
- Modify: `apps/admin/src/views/topics-page.tsx`
- Modify: `apps/admin/src/views/drafts-page.tsx`
- Create: matching `features/<domain>/routes/*RouteView.tsx`
- Create: list components, search-param utilities, and list-state hooks under each domain

- [ ] Keep shared list chrome in `apps/admin/src/ui/content-list-toolbar.tsx` and `apps/admin/src/ui/content-list-item.tsx`.
- [ ] Move page-specific row rendering into domain components such as `PostListItem.tsx` or `NoteListItem.tsx`.
- [ ] Move URL parameter parsing into `features/<domain>/utils/search-params.ts`.
- [ ] Move query key and page-size constants into `features/<domain>/constants.ts`.
- [ ] Run:

```bash
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
```

## Task 4: Multi-Export and Shared-Route Domains

**Files:**
- Modify: `apps/admin/src/views/write-page.tsx`
- Modify: `apps/admin/src/views/write-page-meta-presets.tsx`
- Modify: `apps/admin/src/views/files-page.tsx`
- Modify: `apps/admin/src/views/ai-page.tsx`
- Create: `apps/admin/src/features/write/**`
- Create: `apps/admin/src/features/files/**`
- Create: `apps/admin/src/features/ai/**`

- [ ] Split `write-page.tsx` into route entries, editor surface components, content metadata panels, draft dialogs, rich-editor bridge, page parsing dialogs, and agent panel files.
- [ ] Split `files-page.tsx` into route entries for standard files, orphan files, and comment images, while keeping shared file-list state in one hook.
- [ ] Split `ai-page.tsx` into route entry, AI task surface, grouped resource surfaces, translation entries, slug backfill, writer generate panel, task detail, badges, and JSON/detail blocks.
- [ ] Keep existing route paths and lazy imports stable in `apps/admin/src/routes.tsx`.
- [ ] Run:

```bash
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
rtk pnpm -C apps/admin run build
```

## Task 5: Large Settings Domain

**Files:**
- Modify: `apps/admin/src/views/settings-page.tsx`
- Create: `apps/admin/src/features/settings/routes/SettingsRouteView.tsx`
- Create: `apps/admin/src/features/settings/components/OwnerSettings.tsx`
- Create: `apps/admin/src/features/settings/components/SystemSettings.tsx`
- Create: `apps/admin/src/features/settings/components/AIConfigEditor.tsx`
- Create: `apps/admin/src/features/settings/components/AccountSettings.tsx`
- Create: `apps/admin/src/features/settings/components/MetaPresetSettings.tsx`
- Create: `apps/admin/src/features/settings/types/*.ts`
- Create: `apps/admin/src/features/settings/utils/*.ts`
- Create: `apps/admin/src/features/settings/constants.ts`

- [ ] Move the top-level tab composition into `SettingsRouteView.tsx`.
- [ ] Extract owner, system, AI provider, account, session, password, token, passkey, and meta-preset panels into independent files.
- [ ] Move OAuth provider and AI provider types into `types`.
- [ ] Move provider options and default model metadata into `constants.ts`.
- [ ] Move option-tree editing helpers into `utils`.
- [ ] Run:

```bash
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
rtk pnpm -C apps/admin run build
```

## Task 6: Analytics, Maintenance, and Operational Pages

**Files:**
- Modify: `apps/admin/src/views/dashboard-page.tsx`
- Modify: `apps/admin/src/views/analyze-page.tsx`
- Modify: `apps/admin/src/views/backup-page.tsx`
- Modify: `apps/admin/src/views/cron-page.tsx`
- Modify: `apps/admin/src/views/search-index-page.tsx`
- Modify: `apps/admin/src/views/enrichment-page.tsx`
- Modify: `apps/admin/src/views/comments-page.tsx`
- Modify: `apps/admin/src/views/friends-page.tsx`
- Modify: `apps/admin/src/views/projects-page.tsx`
- Modify: `apps/admin/src/views/recently-page.tsx`
- Modify: `apps/admin/src/views/webhooks-page.tsx`
- Modify: `apps/admin/src/views/snippets-page.tsx`
- Create: matching feature domains and files

- [ ] Extract table/list rows, filter bars, dialogs, drawers, and detail panels into separate component files.
- [ ] Extract polling/query orchestration hooks where a route contains more than one independent data surface.
- [ ] Keep global UI primitives in `apps/admin/src/ui`; move only domain-specific components.
- [ ] Run:

```bash
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
rtk pnpm -C apps/admin run build
```

## Task 7: Auth, Setup, and Debug Pages

**Files:**
- Modify: `apps/admin/src/views/login-page.tsx`
- Modify: `apps/admin/src/views/setup-page.tsx`
- Modify: `apps/admin/src/views/setup-api-page.tsx`
- Modify: `apps/admin/src/views/authn-debug-page.tsx`
- Modify: `apps/admin/src/views/events-debug-page.tsx`
- Modify: `apps/admin/src/views/rich-debug-page.tsx`
- Modify: `apps/admin/src/views/serverless-debug-page.tsx`
- Modify: `apps/admin/src/views/toast-debug-page.tsx`
- Modify: `apps/admin/src/views/debug/authn.tsx`
- Modify: `apps/admin/src/views/debug/events.tsx`
- Modify: `apps/admin/src/views/debug/rich.tsx`
- Modify: `apps/admin/src/views/debug/serverless.tsx`
- Modify: `apps/admin/src/views/debug/toast.tsx`
- Create: `apps/admin/src/features/auth/**`
- Create: `apps/admin/src/features/setup/**`
- Create: `apps/admin/src/features/debug/**`

- [ ] Move full debug implementations into `features/debug/routes`.
- [ ] Keep `views/debug/*.tsx` compatible with the existing `import.meta.glob('./views/debug/**/*.tsx')` route registration until route glob ownership is redesigned.
- [ ] Convert legacy `*-debug-page.tsx` files to skeleton exports or remove them only if no import path references remain.
- [ ] Run:

```bash
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
rtk pnpm -C apps/admin run build
```

## Task 8: Final Route and Dependency Audit

**Files:**
- Modify: `apps/admin/src/routes.tsx` only if lazy import paths should move directly to `features`
- Inspect: `apps/admin/src/views`
- Inspect: `apps/admin/src/features`

- [ ] Confirm every `apps/admin/src/views/*-page.tsx` file is below 30 lines unless it is an intentionally retained route glob adapter.
- [ ] Confirm no migrated domain keeps large local helper components inside a route file.
- [ ] Confirm no feature imports from another feature unless there is an explicit shared domain decision.
- [ ] Run:

```bash
rtk rg -n "function [A-Z]|interface [A-Z]|type [A-Z]" apps/admin/src/views
rtk wc -l apps/admin/src/views/*.tsx apps/admin/src/views/debug/*.tsx
rtk pnpm -C apps/admin run typecheck
rtk pnpm -C apps/admin run lint
rtk pnpm -C apps/admin run build
rtk git diff --check
```

## Completion Criteria

- All route page files under `apps/admin/src/views` are route skeletons or documented route glob adapters.
- Every feature domain has a clear `routes`, `components`, `hooks`, `types`, `utils`, and constants boundary where applicable.
- No implementation-snapshot tests were added solely to assert internal object literal shape.
- Typecheck, lint, build, and whitespace checks either pass or have documented unrelated baseline failures.
