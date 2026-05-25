# 09 · Editors

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P3 (monaco for snippets / templates) → P4 (haklex / draft system / agent chat for write views)
**Depends on**: 03 (primitives), 04 (draft + agent atoms), 05 (drafts API)
**Feeds**: 11 (write views), 11 (extra-features/snippets, template, drafts)

Defines the integration of the four editor surfaces — `@haklex/*` rich editor, `@monaco-editor/react`, CodeMirror 6, `xterm` — plus the draft persistence system and the AI agent chat sidebar. The first three are framework-agnostic; the work is shape-mapping and (for haklex) **removing** the Vue bridge that exists in source.

---

## Scope

- **In**: haklex direct-mount contract, monaco wrapper contract, codemirror 6 hook contract, xterm hook contract, draft system port (recovery + history + autosave), agent chat sidebar wiring, theme injection across editors, emoji-mart React port.
- **Out**: per-view chrome (action buttons, metadata drawers — handled in 11), shiki / marked / katex (→ 10).

---

## Decisions

- **haklex mounts inside the admin app.** No `createRoot` Vue bridge and no `@mx-admin/rich-react` workspace package; the React runtime wrapper lives under `apps/admin/src/app/rich-editor`.
- **Monaco uses `@monaco-editor/react`.** Drop manual worker setup; the wrapper handles workers.
- **CodeMirror 6 hand-rolled.** A `useCodeMirror({ extensions, value, onChange, theme })` hook wraps `EditorView` lifecycle. The custom WYSIWYG / slash menu / image popover extensions port unchanged (they're framework-agnostic CM6 extensions).
- **xterm hand-rolled.** A `useXterm({ darkMode })` hook wraps `Terminal` + `FitAddon` + ResizeObserver.
- **Draft system is a hook + atoms**, not a class singleton. State lives in `atoms/draft.ts`; persistence in localStorage (key per content-type + ref id).
- **Agent chat is a sibling component, not embedded in the editor.** The editor exposes apply-callback handles; the chat panel calls them. This matches source's split (`@haklex/rich-agent-chat` is a separate package).
- **Theme prop is the single contract** for editor color sync. `isDark` from `useUIStore` flows in via prop; each editor wires it to its own theme system.

---

## haklex rich editor

### Direct mount

```tsx
// apps/admin/src/app/rich-editor/RichEditor.tsx
import { ShiroEditor, type ShiroEditorHandle, type ShiroEditorProps } from '~/app/rich-editor'
import { forwardRef, useCallback, useMemo } from 'react'
import { useUIStore } from '~/stores/ui'

export interface RichEditorProps extends Omit<ShiroEditorProps, 'theme'> {
  // any admin-side overrides
}

export const RichEditor = forwardRef<ShiroEditorHandle, RichEditorProps>((props, ref) => {
  const isDark = useUIStore((s) => s.isDark)
  const theme = isDark ? 'dark' : 'light'

  const onImageUpload = useCallback(async (file: File) => {
    // delegates to file API
    return uploadFile(file)
  }, [])

  return (
    <ShiroEditor
      ref={ref}
      theme={theme}
      onImageUpload={onImageUpload}
      {...props}
    />
  )
})
```

The Vue bridge (source `src/components/editor/rich/RichEditor.tsx` with `mountRichEditor`) is gone. Consumer views import `RichEditor` directly:

```tsx
const editorRef = useRef<ShiroEditorHandle>(null)
<RichEditor ref={editorRef} initialValue={post.content} onChange={onContentChange} />
```

### Theme injection

`@haklex/rich-style-token` ships dark + light tokens. The component prop `theme` toggles which. In source, the `useUIStore.isDark` reactive value drove a watcher; in React it drives the prop directly.

If haklex needs custom token overrides for admin only, keep them in `apps/admin/src/app/rich-editor` so the editor contract remains app-local.

### Lexical content format

Source repo treats lexical content via `JSON.stringify(serializedState)` round-trip. The new repo unchanged: the editor exposes `getEditor().getEditorState().toJSON()`; persisted as-is in posts/notes/pages content fields.

A toggle between "lexical" and "markdown" content formats lives at the metadata drawer (spec 11 — write views). The toggle calls `editorRef.current?.replaceContent(parsedFromMarkdown)` or vice versa.

### Excalidraw inline

`@excalidraw/excalidraw` is React-native and is mounted by haklex internally for the Excalidraw nested doc plugin. Admin-side responsibility: provide `saveExcalidrawSnapshot(snapshot) => string | Promise<string>` callback to upload the snapshot blob and return the resulting URL. Implementation lives in `~/lib/excalidraw-upload.ts`.

---

## Monaco

### Wrapper

```tsx
// src/components/editor/monaco/MonacoEditor.tsx
import Editor, { type OnMount, loader } from '@monaco-editor/react'
import { useUIStore } from '~/stores/ui'

loader.config({
  paths: { vs: '/monaco-editor-min/vs' },  // self-host or use CDN; default CDN
})

export interface MonacoEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  language?: string
  height?: number | string
  readonly?: boolean
}

export function MonacoEditor({ value, onChange, language = 'typescript', height = 320, readonly }: MonacoEditorProps) {
  const isDark = useUIStore((s) => s.isDark)
  const handleMount: OnMount = (editor, monaco) => {
    // register custom theme tokens here if needed
  }
  return (
    <Editor
      value={value}
      onChange={onChange}
      language={language}
      height={height}
      theme={isDark ? 'vs-dark' : 'light'}
      onMount={handleMount}
      options={{
        readOnly: readonly,
        minimap: { enabled: false },
        scrollbar: { vertical: 'auto', horizontal: 'auto' },
        fontFamily: '"JetBrains Mono", ui-monospace',
        fontSize: 13,
      }}
    />
  )
}
```

`@monaco-editor/react` loads Monaco from a CDN by default; for offline-first / strict environments the `loader.config({ paths })` line points to a self-hosted bundle. P0 picks default; revisit during P3 if connectivity is a concern.

### Language registration

Source repo registers a small set of TypeScript libraries via `@typescript/ata` (auto type acquisition) for snippet editing. The new repo defers ATA to a P3 enhancement; initial Monaco wrapper supports plain TS/JS without ambient types.

### Diff editor

For draft history view (`/drafts`): use Monaco's diff editor (`<DiffEditor />` from `@monaco-editor/react`). Wrap as `<MonacoDiff>` with the same theme prop.

---

## CodeMirror 6

### Hook

```tsx
// src/components/editor/codemirror/useCodeMirror.ts
import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

export function useCodeMirror({
  value,
  onChange,
  extensions = [],
  theme = 'light',
}: {
  value: string
  onChange?: (v: string) => void
  extensions?: Extension[]
  theme?: 'light' | 'dark'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeCompartment = useRef(new Compartment())

  useEffect(() => {
    if (!containerRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown(),
        themeCompartment.current.of(theme === 'dark' ? oneDark : []),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange?.(u.state.doc.toString())
        }),
        ...extensions,
      ],
    })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view
    return () => view.destroy()
  }, [])

  // sync value when external changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    }
  }, [value])

  // sync theme via compartment
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.current.reconfigure(theme === 'dark' ? oneDark : []),
    })
  }, [theme])

  return { containerRef, viewRef }
}
```

### Custom extensions

Source repo's CM6 setup includes:

- **WYSIWYG mode** — toggleable extension hiding markdown syntax; ports unchanged.
- **Slash menu** — popover positioned at caret; ports unchanged. Position tracking via `EditorView.requestMeasure` is framework-agnostic.
- **Image edit popover** — extension renders DOM via `WidgetType`; React side renders a popover synchronized via React portal. The interface stays the same; only the renderer migrates from Vue to React.
- **KaTeX inline preview** — extension; unchanged.
- **Drag-drop image upload** — extension calling the upload util; unchanged.

A `markdownExtensions(opts)` factory in `src/components/editor/codemirror/extensions.ts` returns the array of extensions for the markdown editor surface.

### Components

```tsx
// src/components/editor/codemirror/CodeMirror.tsx
export function CodeMirror({ value, onChange, theme }: CodeMirrorProps) {
  const { containerRef } = useCodeMirror({
    value, onChange, theme,
    extensions: markdownExtensions({ /* opts */ }),
  })
  return <div ref={containerRef} className={styles.cm} />
}
```

---

## xterm

```tsx
// src/components/editor/xterm/useXterm.ts
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

export function useXterm({ darkMode = true }: { darkMode?: boolean } = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const term = new Terminal({
      theme: darkMode ? darkTheme : lightTheme,
      fontFamily: '"JetBrains Mono", ui-monospace',
      fontSize: 13,
      cursorBlink: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()

    const obs = new ResizeObserver(() => fit.fit())
    obs.observe(containerRef.current)

    termRef.current = term
    fitRef.current = fit
    return () => {
      obs.disconnect()
      term.dispose()
    }
  }, [])

  // theme switch
  useEffect(() => {
    termRef.current?.options.theme && (termRef.current.options.theme = darkMode ? darkTheme : lightTheme)
  }, [darkMode])

  return { containerRef, termRef }
}
```

Wrapper `<Xterm />` consumes the hook. Used by `extra-features/snippets/components/install-dep-xterm.tsx` and `output-modal`.

---

## emoji-mart

`emoji-mart` ships a React export (`@emoji-mart/react`). Direct use:

```tsx
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

<Picker data={data} onEmojiSelect={(e) => insert(e.native)} theme={isDark ? 'dark' : 'light'} />
```

Wrapped in `src/components/editor/emoji/EmojiPicker.tsx` with the theme prop wired automatically.

---

## Draft system

Source repo's draft system spans:

- Auto-save: editor calls `saveDraft(refType, refId, content)` debounced.
- Recovery: on mount, `loadDraft(refType, refId)` checks for unsaved content; if present, shows `DraftRecoveryModal` to user.
- History: backend keeps versions; `/drafts` route lists all drafts and their parent refs.

### Port

```ts
// src/hooks/useDraft.ts
interface UseDraftOptions {
  refType: 'post' | 'note' | 'page'
  refId: string | undefined        // undefined for "new" entries
  content: string
}

export function useDraft({ refType, refId, content }: UseDraftOptions) {
  const localKey = `mx-admin:draft:${refType}:${refId ?? 'new'}`

  // autosave (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      localStorage.setItem(localKey, JSON.stringify({ content, savedAt: Date.now() }))
    }, 1500)
    return () => clearTimeout(handle)
  }, [localKey, content])

  // recovery: load on mount
  const recovered = useMemo(() => {
    const raw = localStorage.getItem(localKey)
    return raw ? (JSON.parse(raw) as { content: string; savedAt: number }) : null
  }, [localKey])

  const clearLocalDraft = useCallback(() => {
    localStorage.removeItem(localKey)
  }, [localKey])

  return { recovered, clearLocalDraft }
}
```

The component opens `<DraftRecoveryModal>` if `recovered` exists and the editor's current content differs significantly. Modal offers "Restore" / "Discard."

Server-side draft history (`/drafts` page) is rendered separately and lives under `src/pages/drafts/`. Backend endpoints unchanged (`drafts.history`, `drafts.byRef`, `drafts.restoreVersion`).

### Atoms

```ts
// reused from atoms/draft.ts (spec 04)
export const draftRecoveryOpenAtom
export const draftListOpenAtom
export const activeDraftIdAtom
```

`DraftRecoveryModal` reads `draftRecoveryOpenAtom`. `DraftListModal` reads `draftListOpenAtom`.

---

## Agent chat sidebar

The write views (`posts/edit`, `notes/edit`, `pages/edit`) host a side-panel agent chat using `@haklex/rich-agent-chat` + `@haklex/rich-agent-core`.

```
┌─────────────────────────────────────┬──────────────────┐
│  RichEditor                          │  Agent chat       │
│                                      │                   │
│                                      │                   │
└─────────────────────────────────────┴──────────────────┘
```

### Composition

```tsx
// src/components/editor/agent/AgentChatPanel.tsx
import { AgentChat, type AgentChatProps } from '@haklex/rich-agent-chat'
import { useAtomValue } from 'jotai'
import { selectedAgentModelAtom } from '~/atoms/agent'
import type { ShiroEditorHandle } from '~/app/rich-editor'

export function AgentChatPanel({ editorRef }: { editorRef: RefObject<ShiroEditorHandle> }) {
  const selectedModel = useAtomValue(selectedAgentModelAtom)
  return (
    <AgentChat
      editorRef={editorRef}
      modelId={selectedModel}
      onModelChange={/* setSelectedAgentModelAtom */}
    />
  )
}
```

The agent chat library exposes a stable `editorRef` API for applying suggestions / diffs. The admin side passes the `RichEditor`'s ref through.

### Re-apply

The 2026-04-05 spec (`agent-chat-reapply-design.md`) defines re-apply UX. Honor that spec on port — it lives at the chat-component boundary, not the admin shell.

### Toolbar integration

The metadata drawer in write views toggles agent chat panel visibility (`useState` on the page level, lifted to `atoms/agent.ts` if multiple components need it).

---

## Theme injection summary

| Editor | Theme prop | Source |
|---|---|---|
| haklex (`RichEditor`) | `theme: 'dark' \| 'light'` | `useUIStore.isDark` |
| Monaco | `theme: 'vs-dark' \| 'light'` | `useUIStore.isDark` |
| CodeMirror | `extensions: [oneDark]` via Compartment | `useUIStore.isDark` |
| xterm | `options.theme` mutation | `useUIStore.isDark` |
| emoji-mart | `theme: 'dark' \| 'light'` | `useUIStore.isDark` |

Each wrapper subscribes to `useUIStore` directly. No central theme bridge.

---

## Acceptance for spec 09

### P3 acceptance (snippets / template / drafts views need it)

1. `<MonacoEditor>` wraps `@monaco-editor/react` with the documented props and theme switching works.
2. `<MonacoDiff>` renders side-by-side diff of two strings.
3. `<CodeMirror>` mounts, edits, propagates `onChange`, and switches theme via Compartment.
4. The markdown extension bundle (slash menu, image popover, KaTeX) renders in the codemirror editor.
5. `<Xterm>` mounts and resizes via the FitAddon.
6. `<EmojiPicker>` renders with theme.

### P4 acceptance (write views)

1. `<RichEditor>` mounts haklex's `ShiroEditor` directly. No createRoot bridge in the codebase.
2. Image upload roundtrips through the file API.
3. Excalidraw snapshot upload works via the `saveExcalidrawSnapshot` callback.
4. `useDraft` autosaves to localStorage every ~1.5 s.
5. `<DraftRecoveryModal>` offers restore / discard on a returning user with stale localStorage content.
6. `<DraftListModal>` lists server-side draft history.
7. `<AgentChatPanel>` renders next to the editor and re-apply works per the 2026-04-05 spec.

---

## Open questions

- **Self-host monaco vs CDN.** Default CDN; revisit during P3 if offline-first becomes a requirement.
- **CM6 extension package boundaries.** Source has them in `src/components/editor/codemirror/extension.ts`; new repo can split into multiple files for clarity. Decide during port.
- **Monaco worker chunk size.** P0 vite config splits `monaco` into its own chunk. Verify chunk size budget during P3.
- **Agent model selection persistence.** Currently `atomWithStorage` per-app. Consider per-editor-instance if users want different models per content type. Revisit if real users complain.
