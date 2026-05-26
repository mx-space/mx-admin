# src/ui Reorganization — Design Spec

**Date:** 2026-05-26
**Scope:** `apps/admin/src/ui/` and adjacent directories
**Status:** Approved (pending implementation)

## Problem

`apps/admin/src/ui/` has become a junk drawer:

- 39 files sit at the top level with no grouping (primitives, layout shells, data tables, business-coupled widgets, hooks, utils all mixed together).
- Two large forked subsystems (`rich-editor/`, `codemirror/`) live inside `ui/`, but they are not UI primitives — they are vendor code copied from `@haklex/*` packages.
- Several components are coupled to specific feature domains (`draft-status-tag`, `terminal-output-dialog`, `metric-card`, etc.) yet live in the same directory as `button.tsx`.

The result: poor discoverability, blurred boundaries, and `ui/` no longer means "reusable UI primitives".

## Goals

1. `src/ui/` contains only **framework-agnostic, reusable UI primitives and layout shells** — nothing tied to a specific business domain.
2. Forked vendor code (`rich-editor`, `codemirror`) lives under a clearly labelled `src/vendor/`.
3. Business-coupled components move into their owning `features/<domain>/components/` directory; multi-feature shared widgets live in `features/_shared/components/`.
4. Hooks and utils currently inside `ui/` join the existing top-level `src/hooks/` and `src/utils/` directories.

## Non-Goals

- Renaming components themselves (only moving files).
- Refactoring the internal logic of `rich-editor` or `codemirror` forks.
- Introducing barrel files (`index.ts`) for `ui/*` — kept absent to preserve tree-shaking and the current import style.
- Changing the existing TypeScript path alias (`~` → `apps/admin/src`).

## Target Directory Layout

```
apps/admin/src/
├── ui/
│   ├── primitives/                      # Base UI wrappers + simple visual atoms
│   │   ├── button.tsx
│   │   ├── checkbox.tsx
│   │   ├── switch.tsx
│   │   ├── select.tsx
│   │   ├── text-field.tsx
│   │   ├── datetime-picker.tsx
│   │   ├── panel.tsx
│   │   ├── tag.tsx
│   │   ├── scroll.tsx
│   │   ├── code-editor.tsx              # Monaco wrapper
│   │   └── markdown-render.tsx
│   │
│   ├── feedback/                        # Overlays, modals, toasts (imperative)
│   │   ├── modal.tsx
│   │   ├── drawer.tsx
│   │   ├── bottom-sheet.tsx
│   │   ├── bottom-sheet.test.tsx
│   │   ├── portal-layer.tsx
│   │   └── modal-imperative/            # whole subdir moves intact
│   │       ├── context.tsx
│   │       ├── index.ts
│   │       ├── present.ts
│   │       ├── root.tsx
│   │       ├── store.ts
│   │       └── types.ts
│   │
│   ├── layout/                          # Page / shell / nav scaffolding
│   │   ├── content-layout.tsx
│   │   ├── content-layout.test.tsx
│   │   ├── page-layout.tsx
│   │   ├── page-layout.test.tsx
│   │   ├── sidebar-body.tsx
│   │   ├── sidebar-nav-item.tsx
│   │   ├── shell-nav-context.tsx
│   │   ├── shell-nav-context.test.tsx
│   │   ├── header-back-button.tsx
│   │   └── mobile-hamburger.tsx
│   │
│   └── data/                            # Tables and pagination
│       ├── data-table.tsx
│       ├── responsive-data-table.tsx
│       ├── responsive-data-table.test.tsx
│       └── compact-pagination.tsx
│
├── vendor/
│   ├── rich-editor/                     # Former apps/admin/src/ui/rich-editor/
│   │   ├── core/
│   │   ├── components/
│   │   ├── mount/
│   │   ├── utils/
│   │   ├── globals.d.ts
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   └── codemirror/                      # Former apps/admin/src/ui/codemirror/
│       ├── universal/
│       ├── wysiwyg/
│       ├── slash-menu/
│       ├── toolbar/
│       ├── CodeMirrorEditor.tsx
│       ├── ImageDropZone.tsx
│       ├── ImageEditPopover.tsx
│       ├── (... all other top-level codemirror files)
│       └── index.ts
│
├── features/
│   ├── _shared/components/              # NEW directory
│   │   ├── content-list-item.tsx        # used by posts, notes
│   │   ├── content-list-toolbar.tsx     # used by posts, notes
│   │   └── ip-info-popover.tsx          # used by settings, comments, dashboard
│   ├── drafts/components/
│   │   └── draft-status-tag.tsx
│   ├── snippets/components/
│   │   └── terminal-output-dialog.tsx
│   └── analyze/components/
│       └── metric-card.tsx
│
├── hooks/
│   └── use-media-query.ts               # moved from ui/
│
├── constants/
│   └── layout.ts                        # moved from ui/ (header height constants)
│
└── utils/
    └── cn.ts                            # moved from ui/
```

### Category Definitions

- **primitives/** — Base UI wrappers, simple visual atoms, single-purpose display components. No business logic, no domain types.
- **feedback/** — Overlay/modal/portal stack including the imperative modal system.
- **layout/** — Page shells, sidebar/topbar primitives, navigation context. Reusable across views.
- **data/** — Table and pagination primitives. No domain knowledge.
- **vendor/** — Forked third-party code (haklex). Treated like a copied package; minimal modification.
- **features/\<domain\>/components/** — Components used by exactly one feature.
- **features/\_shared/components/** — Business-coupled components used by 2+ features. New directory.

## Migration Mapping

### Files staying inside `ui/` (regrouped)

| Current path                       | New path                                |
| ---------------------------------- | --------------------------------------- |
| `ui/button.tsx`                    | `ui/primitives/button.tsx`              |
| `ui/checkbox.tsx`                  | `ui/primitives/checkbox.tsx`            |
| `ui/switch.tsx`                    | `ui/primitives/switch.tsx`              |
| `ui/select.tsx`                    | `ui/primitives/select.tsx`              |
| `ui/text-field.tsx`                | `ui/primitives/text-field.tsx`          |
| `ui/datetime-picker.tsx`           | `ui/primitives/datetime-picker.tsx`     |
| `ui/panel.tsx`                     | `ui/primitives/panel.tsx`               |
| `ui/tag.tsx`                       | `ui/primitives/tag.tsx`                 |
| `ui/scroll.tsx`                    | `ui/primitives/scroll.tsx`              |
| `ui/code-editor.tsx`               | `ui/primitives/code-editor.tsx`         |
| `ui/markdown-render.tsx`           | `ui/primitives/markdown-render.tsx`     |
| `ui/modal.tsx`                     | `ui/feedback/modal.tsx`                 |
| `ui/drawer.tsx`                    | `ui/feedback/drawer.tsx`                |
| `ui/bottom-sheet.tsx` (+ test)     | `ui/feedback/bottom-sheet.tsx` (+ test) |
| `ui/portal-layer.tsx`              | `ui/feedback/portal-layer.tsx`          |
| `ui/modal-imperative/*`            | `ui/feedback/modal-imperative/*`        |
| `ui/content-layout.tsx` (+ test)   | `ui/layout/content-layout.tsx` (+ test) |
| `ui/page-layout.tsx` (+ test)      | `ui/layout/page-layout.tsx` (+ test)    |
| `ui/sidebar-body.tsx`              | `ui/layout/sidebar-body.tsx`            |
| `ui/sidebar-nav-item.tsx`          | `ui/layout/sidebar-nav-item.tsx`        |
| `ui/shell-nav-context.tsx` (+test) | `ui/layout/shell-nav-context.tsx`       |
| `ui/header-back-button.tsx`        | `ui/layout/header-back-button.tsx`      |
| `ui/mobile-hamburger.tsx`          | `ui/layout/mobile-hamburger.tsx`        |
| `ui/data-table.tsx`                | `ui/data/data-table.tsx`                |
| `ui/responsive-data-table.tsx` (+test) | `ui/data/responsive-data-table.tsx` |
| `ui/compact-pagination.tsx`        | `ui/data/compact-pagination.tsx`        |

### Files leaving `ui/`

| Current path                       | New path                                                  |
| ---------------------------------- | --------------------------------------------------------- |
| `ui/rich-editor/**`                | `vendor/rich-editor/**`                                   |
| `ui/codemirror/**`                 | `vendor/codemirror/**`                                    |
| `ui/use-media-query.ts`            | `hooks/use-media-query.ts`                                |
| `ui/cn.ts`                         | `utils/cn.ts`                                             |
| `ui/layout.ts`                     | `constants/layout.ts`                                     |
| `ui/draft-status-tag.tsx`          | `features/drafts/components/draft-status-tag.tsx`         |
| `ui/terminal-output-dialog.tsx`    | `features/snippets/components/terminal-output-dialog.tsx` |
| `ui/metric-card.tsx`               | `features/analyze/components/metric-card.tsx`             |
| `ui/content-list-item.tsx`         | `features/_shared/components/content-list-item.tsx`       |
| `ui/content-list-toolbar.tsx`      | `features/_shared/components/content-list-toolbar.tsx`    |
| `ui/ip-info-popover.tsx`           | `features/_shared/components/ip-info-popover.tsx`         |

## Import Strategy

- Approximately 178 files import from `~/ui/*`. All affected paths must be rewritten.
- Use `ast-grep` (preferred) or `sed`/manual edits scoped per file. Verify by running a focused TypeScript check per touched file rather than full repo build.
- **No re-export barrels.** Imports keep the explicit `~/ui/primitives/button` style. The skill cost (one extra path segment) is worth the file-locality clarity.
- Internal cross-references inside `ui/` (e.g. `modal.tsx` importing `cn`) are updated to the new `~/utils/cn` and `~/hooks/use-media-query` paths.
- Forked code in `vendor/` is treated as a sealed module: its internal imports stay relative; only its external consumers update their entry path from `~/ui/rich-editor` to `~/vendor/rich-editor`.

## Migration Order

The move is mechanical, but ordering reduces churn:

1. Create new target directories (empty).
2. Move files by `git mv` to preserve history. Group by category to keep diff readable.
3. Update imports per category, scoped per file. Run `pnpm -C apps/admin exec tsc --noEmit --pretty false` on touched files.
4. After each category lands, commit so any breakage is bisectable.
5. Final pass: `pnpm lint` on changed paths only; `pnpm dev` smoke check.

Recommended commit sequence:

- `refactor(admin): move ui primitives into ui/primitives`
- `refactor(admin): move ui overlays into ui/feedback`
- `refactor(admin): move ui layout shells into ui/layout`
- `refactor(admin): move ui data primitives into ui/data`
- `refactor(admin): relocate hooks/utils/constants out of ui`
- `refactor(admin): move business widgets into features`
- `refactor(admin): move forked editor packages into src/vendor`

## Risks & Mitigations

- **Broken imports:** mitigated by per-category commits and focused tsc per file.
- **Lost git history:** mitigated by `git mv` (no copy+delete).
- **CSS / asset relative paths inside vendor forks:** verify CSS imports and asset URLs still resolve after the move; the vendor forks rely on `import './foo.css'` style — these stay relative and survive the directory move.
- **`apps/admin/vite.config.mts`, `tsconfig.*.json`, UnoCSS config:** confirm no hard-coded paths reference `ui/codemirror` / `ui/rich-editor` (none expected, but verify).
- **Test files:** colocated, move with the component. The vitest config uses globbing so no config change should be required.

## Validation Checklist

- [ ] `pnpm -C apps/admin exec tsc --noEmit --pretty false` passes
- [ ] `pnpm -C apps/admin lint` passes (scoped to touched files via `--filter`)
- [ ] `pnpm dev` boots; smoke-test write page (rich editor + codemirror), posts/notes list (content-list widgets), settings (ip-info-popover), snippets (terminal-output-dialog).
- [ ] No file remains directly under `src/ui/` (other than the four category directories).
- [ ] No reference to `~/ui/rich-editor` or `~/ui/codemirror` remains in source.

## Out of Scope (Future Work)

- Promoting `vendor/rich-editor` and `vendor/codemirror` into actual workspace packages (`packages/rich-editor`, `packages/codemirror`).
- Introducing a public re-export barrel at `~/ui` if/when the count of touched import lines becomes a maintenance burden.
- Splitting `ui/primitives/` further (e.g. `primitives/form/`) if it grows beyond ~15 files.
