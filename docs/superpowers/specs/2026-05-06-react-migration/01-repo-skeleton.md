# 01 · Repo Skeleton

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P0
**Depends on**: nothing — this is the foundation

Defines the new `admin-react` repository: directory layout, Vite 8 configuration, TypeScript settings, env handling, HTML entry, lint, and the base dependency manifest. No business code lives in scope; this spec ends when `pnpm dev` boots an empty React 19 app at `localhost` with theme provider and TanStack Query devtools attached.

---

## Decisions

- Repo lives at `admin-react/` (new top-level repo, not a workspace inside `innei-repo`).
- Package manager: `pnpm` (matches source).
- Node: `>=20`.
- Bundler: Vite 8.
- React: 19.
- TS: 5.9+.
- Path alias: `~` → `./src` (matches source).

---

## Directory layout

```
admin-react/
├── DESIGN.md                  # Linear DESIGN spec (full text from brainstorm)
├── README.md
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .oxlintrc.json
├── .browserslistrc
├── .env                       # local dev (gitignored)
├── .env.production
├── .gitignore
├── public/
│   └── favicon.png
└── src/
    ├── main.tsx               # entry: createRoot, providers, router
    ├── App.tsx                # root layout shell
    ├── env.d.ts               # vite/import.meta.env types
    ├── styles/
    │   ├── theme.css.ts       # design tokens (colors, typography, spacing, radius)
    │   ├── reset.css.ts       # css reset
    │   ├── global.css.ts      # body, html, ::selection
    │   └── recipes/           # css.ts recipes shared across primitives
    ├── routes/
    │   ├── index.tsx          # route tree
    │   ├── ProtectedRoute.tsx
    │   └── names.ts           # route name enum (port from src/router/name.ts)
    ├── layouts/
    │   ├── AppShell.tsx
    │   ├── SetupLayout.tsx
    │   └── MasterDetailLayout.tsx
    ├── pages/                 # one dir per view module (21 dirs after P3)
    ├── components/
    │   ├── ui/                # Base UI wrappers
    │   ├── form/              # ConfigForm DSL
    │   ├── editor/
    │   │   ├── rich/
    │   │   ├── monaco/
    │   │   ├── codemirror/
    │   │   └── xterm/
    │   ├── chart/
    │   ├── table/             # placeholder API in P2; real impl in 12
    │   ├── kbar/
    │   ├── markdown/
    │   ├── upload/
    │   ├── ai/
    │   ├── draft/
    │   ├── setting/
    │   └── shared/
    ├── stores/                # Zustand
    │   ├── auth.ts
    │   ├── ui.ts
    │   └── layout.ts
    ├── atoms/                 # Jotai
    │   ├── layout.ts          # headerActions, pageTitle, ...
    │   ├── ai.ts              # task queue
    │   └── ...
    ├── api/                   # 36 service modules ported from src/api/
    ├── hooks/
    │   ├── queries/           # TanStack Query hooks (use-posts.ts, ...)
    │   ├── useAuth.ts
    │   ├── useSocketIO.ts
    │   ├── useG2Chart.ts
    │   └── useDataTableState.ts
    ├── lib/
    │   ├── request.ts         # ofetch wrapper, error classes
    │   ├── query-client.ts
    │   ├── socket-client.ts
    │   ├── auth-client.ts     # better-auth client
    │   └── transform.ts       # camelcase, response unwrap
    ├── models/                # types ported from src/models/
    ├── constants/
    │   └── env.ts
    └── utils/
```

**Notes**:

- `pages/` is flat per-route module (e.g. `pages/dashboard/index.tsx`, `pages/posts/list.tsx`). Sub-folders only when a view has more than ~5 sibling files.
- `components/ui/` only holds Base UI wrappers. App-specific compounds go to `components/shared/` or under their feature dir.
- `components/table/` ships a placeholder in P2 so P3 views can adopt the API early; real implementation lands per spec 12.

---

## `package.json` (initial)

```json
{
  "name": "admin-react",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --open --host",
    "build": "vite build",
    "preview": "vite preview --port 2323",
    "lint": "oxlint src",
    "lint:fix": "oxlint src --fix",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "@tanstack/react-query": "^5.95.0",
    "@tanstack/react-query-devtools": "^5.95.0",
    "@tanstack/query-async-storage-persister": "^5.95.0",
    "@tanstack/query-persist-client-core": "^5.95.0",
    "zustand": "^5.0.0",
    "jotai": "^2.10.0",
    "@base-ui-components/react": "latest",
    "@vanilla-extract/css": "^1.16.0",
    "@vanilla-extract/recipes": "^0.5.0",
    "motion": "^11.0.0",
    "lucide-react": "latest",
    "sonner": "^1.7.0",
    "kbar": "^0.1.0",
    "@tanstack/react-form": "^1.29.3",
    "zod": "4.3.6",
    "ofetch": "1.5.1",
    "better-auth": "1.4.18",
    "@better-auth/passkey": "1.4.18",
    "@simplewebauthn/browser": "13.3.0",
    "@mx-space/api-client": "1.21.2",
    "socket.io-client": "4.8.3",
    "date-fns": "4.1.0",
    "es-toolkit": "1.45.1",
    "fuse.js": "7.1.0",
    "@haklex/rich-editor": "0.4.0",
    "@haklex/rich-agent-chat": "0.4.0",
    "@haklex/rich-agent-core": "0.4.0",
    "@haklex/rich-diff": "0.4.0",
    "@haklex/rich-ext-ai-agent": "0.4.0",
    "@haklex/rich-ext-nested-doc": "0.4.0",
    "@haklex/rich-style-token": "0.4.0",
    "@monaco-editor/react": "^4.7.0",
    "monaco-editor": "0.55.1",
    "@codemirror/commands": "6.10.1",
    "@codemirror/lang-markdown": "6.5.0",
    "@codemirror/language": "6.12.1",
    "@codemirror/language-data": "6.5.2",
    "@codemirror/search": "6.6.0",
    "@codemirror/state": "6.5.4",
    "@codemirror/theme-one-dark": "6.1.3",
    "@codemirror/view": "6.39.11",
    "@xterm/xterm": "6.0.0",
    "@xterm/addon-fit": "0.11.0",
    "@antv/g2": "^5.4.8",
    "@excalidraw/excalidraw": "^0.18.0",
    "emoji-mart": "5.6.0",
    "@emoji-mart/data": "1.2.1",
    "@emoji-mart/react": "^1.1.0",
    "shiki": "3.21.0",
    "marked": "17.0.5",
    "markdown-escape": "2.0.0",
    "katex": "0.16.40",
    "highlight.js": "11.11.1",
    "canvas-confetti": "1.9.4",
    "@pierre/diffs": "1.1.3",
    "jsondiffpatch": "0.7.3",
    "ansi_up": "6.0.6",
    "blurhash": "2.0.5",
    "buffer": "6.0.3",
    "ejs": "4.0.1",
    "event-source-polyfill": "1.0.31",
    "js-cookie": "3.0.5",
    "js-yaml": "4.1.1",
    "json5": "2.2.3",
    "qs": "6.15.0",
    "qier-progress": "1.0.4",
    "validator": "13.15.26",
    "xss": "1.0.15"
  },
  "devDependencies": {
    "vite": "8.0.1",
    "@vitejs/plugin-react-swc": "^3.7.0",
    "@vanilla-extract/vite-plugin": "^4.0.0",
    "vite-plugin-checker": "0.12.0",
    "vite-plugin-mkcert": "1.17.10",
    "typescript": "5.9.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^22.0.0",
    "@types/canvas-confetti": "1.9.0",
    "@types/ejs": "3.1.5",
    "@types/event-source-polyfill": "1.0.5",
    "@types/js-yaml": "4.0.9",
    "@types/markdown-escape": "1.1.3",
    "@types/qs": "6.15.0",
    "@types/validator": "13.15.10",
    "oxlint": "latest",
    "happy-dom": "^15.11.0",
    "vitest": "^4.1.5",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0"
  }
}
```

**Drop relative to source**: `vue`, `vue-router`, `pinia`, `vue-sonner`, `lucide-vue-next`, `@bytebase/vue-kbar`, `@vueuse/core`, `naive-ui`, `@vitejs/plugin-vue`, `@vitejs/plugin-vue-jsx`, `vite-plugin-vue-inspector`, `@vue/compiler-sfc`, `@vue/test-utils`, `unocss`, `@unocss/*`, `postcss`, `postcss-nested`, `postcss-preset-env`, `@tanstack/vue-query`.

**Pin policy**: `@haklex/*` are pinned exact versions (mirrors source). React, TanStack, Zustand, Base UI use caret. Re-pin haklex on each upstream release per source repo's CLAUDE.md note.

---

## `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import checker from 'vite-plugin-checker'
import mkcert from 'vite-plugin-mkcert'
import path from 'node:path'

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      // worker / browser polyfills retained from source repo
      buffer: 'buffer',
      path: 'path-browserify',
      os: 'os-browserify',
    },
  },
  plugins: [
    react(),
    vanillaExtractPlugin(),
    checker({ typescript: true }),
    mode === 'development' && mkcert(),
  ].filter(Boolean),
  server: {
    port: 9528,                  // matches source dev port
    https: false,                // mkcert flips this in dev when needed
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // first-pass split; tune in P5
          monaco: ['monaco-editor', '@monaco-editor/react'],
          codemirror: [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/language',
            '@codemirror/lang-markdown',
          ],
          haklex: [
            '@haklex/rich-editor',
            '@haklex/rich-agent-chat',
            '@haklex/rich-agent-core',
            '@haklex/rich-diff',
            '@haklex/rich-ext-ai-agent',
            '@haklex/rich-ext-nested-doc',
            '@haklex/rich-style-token',
          ],
          charts: ['@antv/g2'],
          excalidraw: ['@excalidraw/excalidraw'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@huacnlee/autocorrect', '@dqbd/tiktoken'],  // mirror source
  },
}))
```

**Plugins dropped from source**: `@vitejs/plugin-vue`, `@vitejs/plugin-vue-jsx`, `vite-plugin-vue-inspector`, the custom `htmlPlugin()` (re-implement only if env injection into `index.html` is still needed — see HTML section below).

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "experimentalDecorators": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    },
    "types": ["vite/client", "node"]
  },
  "include": ["src", "src/env.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json` for `vite.config.ts` only (standard Vite template).

**Drop**: `jsxImportSource: "vue"`, `vue-app-env.d.ts`, Vue macro globals.

---

## Environment variables

| Key | Purpose | Required |
|---|---|---|
| `VITE_APP_BASE_API` | Backend mx-core base URL | yes |
| `VITE_APP_WEB_URL` | Public-facing blog URL (Shiroi) | yes |
| `VITE_APP_GATEWAY` | File / socket gateway URL | yes |
| `VITE_APP_LOGIN_BG` | Login page background image URL | no |
| `VITE_APP_PUBLIC_URL` | CDN / public asset prefix | no |

Resolution chain (mirrors source `src/constants/env.ts`):
`sessionStorage` → `localStorage` → `window.injectData` → `import.meta.env`.
The `setup-api` flow writes the user-chosen API URL to `localStorage` for runtime override.

`.env` and `.env.production` carry only the public `VITE_APP_*` prefix. `.env` is git-ignored.

---

## `index.html`

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/favicon.png" />
    <title>MX Admin</title>
    <script>
      // theme bootstrap — runs before React mounts; prevents flash
      (function () {
        try {
          var mode = localStorage.getItem('theme-mode')
          var isDark =
            mode === 'dark' ||
            (mode !== 'light' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches)
          if (isDark) document.documentElement.classList.add('dark')
        } catch (e) {}
      })()
    </script>
    <style>
      /* initial loader — keep until React mounts */
      #initial-loader { /* svg spinner styles */ }
    </style>
  </head>
  <body>
    <div id="initial-loader"><!-- svg spinner --></div>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Source diffs**:

- `<div id="app">` → `<div id="root">` (React convention).
- `/src/main.ts` → `/src/main.tsx`.
- Theme bootstrap script: kept verbatim — framework-agnostic.
- Initial loader markup: kept; React removes it on mount.
- `window.injectData` / `window.version`: keep on `window` typing in `env.d.ts`. Decide in spec 06 whether to inject via build plugin (rebuilding source's `htmlPlugin()`) or via runtime fetch.

---

## Lint

`.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "react-hooks", "import", "typescript"],
  "rules": {
    "react/jsx-no-target-blank": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "ignorePatterns": ["dist", "node_modules"]
}
```

Run scoped to changed files only (per source repo's CLAUDE.md). No project-wide lint sweeps.

---

## Polyfills

Source repo aliases `path → path-browserify`, `os → os-browserify`, `buffer → buffer`. The new repo inherits these conditionally:

| Alias | Used by | Verdict |
|---|---|---|
| `buffer` | base64, blurhash, file uploads | keep |
| `path-browserify` | path utilities in upload / file views | keep |
| `os-browserify` | rare, often dead | drop unless typecheck flags it |
| `node-fetch → isomorphic-fetch` | not needed in modern browsers | drop |

Audit during P0 implementation: greenfield repo can drop more than it keeps.

---

## Acceptance for spec 01

When implementation of this spec finishes, the following must hold:

1. `pnpm install && pnpm dev` boots `localhost:9528` showing an empty React 19 page.
2. `pnpm typecheck` passes with the directory layout above stubbed (empty `.ts` / `.tsx` placeholders are fine).
3. `pnpm lint` runs oxlint without errors on stubs.
4. `pnpm build` produces a Vite production bundle (no business code yet, so output is small).
5. `theme-mode` localStorage key flips `<html class="dark">` before React mounts (theme bootstrap script works).
6. `vanilla-extract` plugin compiles a sample `theme.css.ts` into a stylesheet.
7. TanStack Query devtools are visible under `?__devtools=1` (or whichever guard is chosen).
8. `~` import alias resolves both at build and in tsserver.

This spec does **not** include: design tokens content (→ 02), primitive components (→ 03), router setup (→ 06), or any business code.

---

## Open questions for implementation

- **Vite plugin for env injection**: source repo had a custom `htmlPlugin()` injecting `window.version` and `window.injectData` keys at build. New repo can either (a) reimplement the plugin, (b) move to runtime fetch from a `/config.json`, or (c) inline at build via `define`. Decide in 06 once the auth/config-fetch order is fixed.
- **HTTPS in dev**: `vite-plugin-mkcert` is included; only needed if cookie auth requires `Secure`. Confirm during 06 implementation.
- **Path-browserify alias**: keep or drop is gated on `pnpm typecheck` after porting `src/utils/`. Default keep, audit later.
