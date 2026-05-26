# CodeMirror Markdown Editor Port — Design Spec

**Date:** 2026-05-26
**Status:** Draft
**Owner:** Innei
**Touches:** `apps/admin/src/ui/codemirror/**`, `apps/admin/src/features/write/components/WriteRouteViewsContent.tsx`, `apps/admin/package.json`

## 1. Background & Goal

The current `refactor/admin-react-migration` branch replaced the legacy markdown writing surface with a plain `<TextArea>` placeholder at `apps/admin/src/features/write/components/WriteRouteViewsContent.tsx:1106`. The Vue admin (`master` branch) had a feature-rich CodeMirror 6 markdown editor with WYSIWYG block widgets, a floating selection toolbar, a slash-command menu, drag-and-drop image upload, and an editor settings store.

This port brings the full editor back to the React app while keeping it framework-clean (no Vue/Pinia residue) and isolated under a single feature module.

**Out of scope for this spec:**
- The `WriteEditor` facade (title + content + agent panel co-orchestration). The rich/Lexical path keeps its own `RichWriteSurface`; this spec only addresses the markdown content surface that replaces the `TextArea`.
- Integration of agent chat panel with markdown editor. Agent panel stays Lexical-only for now.
- Markdown import/export UI (already exists at `~/api/markdown.ts`).

## 2. User-Visible Behaviour

1. When `state.contentFormat !== 'lexical'`, the editor surface shows a CodeMirror 6 instance with syntax-highlighted markdown.
2. Two render modes available, toggled via `Mod+/` and via an editor settings popover:
   - **plain** (default): raw markdown text with syntax highlighting.
   - **wysiwyg**: same source, but block widgets render headings/lists/quotes/code/math/images/dividers/details inline. Source is still markdown — toggling never destroys content.
3. Floating toolbar appears on text selection (bold / italic / strikethrough / inline code / link / heading toggles / list toggles).
4. Typing `/` at the start of a line opens a slash menu with insert-block commands.
5. Drag-and-drop or paste of image files uploads via `filesApi.uploadFile(file, 'image')` and inserts `![](url)` at the cursor. Uploading state shows a placeholder image. Failure shows a toast and removes the placeholder.
6. Cursor `ArrowUp` at the first line invokes an optional `onArrowUpAtFirstLine` callback (used by the host to jump focus to title input).
7. Theme follows the global `useThemeMode().isDark` state.
8. Font selection (mono / serif) persists in localStorage per the editor settings.

## 3. Architecture

### 3.1 Target Directory Layout (`apps/admin/src/ui/codemirror/`)

```
src/ui/codemirror/
├── index.ts                       # public API (CodeMirrorEditor + types)
├── CodeMirrorEditor.tsx           # top-level React component (~120 LOC)
├── use-codemirror.ts              # hook owning EditorView lifecycle (~250 LOC)
├── editor-store.ts                # external store: editorView ref + uploadImageFile
├── upload-store.ts                # pending uploads map + subscribers
├── image-popover-state.ts         # popover anchor state
├── ImageDropZone.tsx              # React drop overlay (portal)
├── ImageEditPopover.tsx           # React popover anchored to image widget
├── extension.ts                   # Compartments + markdown language config
├── syntax-highlight.ts            # syntaxTheme (light + dark variants)
├── language-icons.ts              # pure lookup table
├── use-auto-theme.ts              # subscribes to themeMode → reconfigures theme compartment
├── use-auto-fonts.ts              # subscribes to settings → reconfigures fonts compartment
├── codemirror.css                 # editor styles
├── toolbar/
│   ├── FloatingToolbar.tsx        # selection-anchored toolbar (portal)
│   ├── Toolbar.tsx                # button strip
│   ├── EmojiPicker.tsx
│   ├── use-selection-position.ts  # tracks selection rect via plugin emitter
│   ├── keymap-extension.ts        # Mod-B/Mod-I/Mod-K bindings (pure CM6)
│   ├── markdown-commands.ts       # toggleBold/toggleItalic/insertLink/etc.
│   └── floating-toolbar.css
├── slash-menu/
│   ├── SlashMenu.tsx              # menu popover
│   ├── slash-menu-extension.ts    # detects "/" trigger via CM6 ViewPlugin
│   ├── slash-menu-items.ts        # command list data
│   ├── use-slash-menu.ts          # subscribes to extension state
│   └── slash-menu.css
├── wysiwyg/
│   ├── index.ts                   # composes block extensions
│   ├── block-registry.ts          # decoration helpers
│   ├── blockquote.ts · codeblock.ts · details.ts · divider.ts
│   ├── empty-line.ts · heading.ts · image.ts · inline.ts
│   ├── line-break.ts · list.ts · math.ts · measure.ts
└── universal/
    ├── constants.ts
    ├── editor-config.ts           # GeneralSettingSchema (renderMode, font, theme)
    ├── use-editor-setting.ts      # wraps storage hook
    ├── props.ts                   # shared editor prop types
    ├── editor.module.css
    └── index.css
```

### 3.2 Module Responsibilities

#### `CodeMirrorEditor` (component)

```ts
interface CodeMirrorEditorProps {
  text: string
  onChange: (value: string) => void
  renderMode?: 'plain' | 'wysiwyg'  // overrides settings if provided
  onStateChange?: (state: EditorState) => void
  onArrowUpAtFirstLine?: () => void
  className?: string
  embedded?: boolean                 // when true, skips global editor-store registration
  autoFocus?: boolean
  unSaveConfirm?: boolean
  saveConfirmFn?: () => boolean
}
```

- Mounts a single `<div ref>` container.
- Delegates to `useCodeMirror`.
- Renders auxiliary overlays (`ImageDropZone`, `ImageEditPopover`, `FloatingToolbar`, `SlashMenu`) as siblings — each subscribes to `editor-store` for the current view.

#### `useCodeMirror` (hook)

- Owns `EditorView` instance via `useRef`.
- On mount: builds `EditorState` with the full extension stack (default keymap + markdown keymap + history + search + line numbers + active-line highlight + syntaxTheme + reconfigurable compartments + lineWrapping + updateListener).
- Attaches a `paste` listener on `view.dom` that detects `image/*` items in `clipboardData` and forwards each to `editor-store.uploadImageFile(file)` (skipped when `embedded=true`, same as drop).
- Registers/unregisters with `editor-store` (skipped if `embedded`).
- Watches `text` prop: if it diverges from `view.state.doc.toString()`, dispatches a single replacement (avoid feedback loops on user-driven changes by comparing strings first).
- Watches `renderMode`: dispatches `Compartment.reconfigure` for `wysiwyg`, `wysiwygMode`, and `slashMenu` compartments.
- Returns `{ containerRef, view }`.

#### `editor-store` (external store)

Replaces Pinia. Implementation:

```ts
type Snapshot = { editorView: EditorView | undefined }
let snap: Snapshot = { editorView: undefined }
const listeners = new Set<() => void>()

function emit() { snap = { ...snap }; listeners.forEach(l => l()) }

export function setEditorView(view: EditorView | undefined) {
  snap.editorView = view; emit()
}
export function getEditorView() { return snap.editorView }
export function subscribeEditor(l: () => void) { listeners.add(l); return () => listeners.delete(l) }

export function useEditorView(): EditorView | undefined {
  return useSyncExternalStore(subscribeEditor, () => snap.editorView, () => undefined)
}

export async function uploadImageFile(file: File): Promise<void> { /* port from master verbatim, swap toast for sonner, swap filesApi.upload for uploadFile */ }
export function setEditorValue(value: string) { /* dispatch replace */ }
export function focusEditor() { snap.editorView?.focus() }
```

The store is a single module-level singleton — there is only ever one active markdown editor at a time. When `embedded=true`, the editor opts out of registration (used by ancillary surfaces where two editors might coexist).

#### `upload-store` + `image-popover-state`

Already framework-agnostic in master. Copy verbatim, no React-specific changes needed. Already use a `Set<listener>` pattern compatible with `useSyncExternalStore`.

#### `ImageDropZone` (component)

- `useEditorView()` from store.
- On mount, attaches `drop/dragover/dragenter/dragleave` to `view.dom`. Cleans up on unmount or view change.
- Tracks `isDragging` via local `useState`.
- Renders a full-overlay portal (via `createPortal`) into the nearest scrollable parent (`.write-editor-scroll-container`), or falls back to `document.body`.

#### `ImageEditPopover` (component)

- Subscribes to `image-popover-state` for anchor position + current image syntax.
- Uses Base UI `Popover` primitive (consistent with rest of `ui/`).
- Edits image `alt` / `url` and dispatches a CM6 transaction to replace the markdown source.

#### `FloatingToolbar` + `Toolbar`

- `use-selection-position` is a CM6 ViewPlugin that emits selection rect updates via a tiny event emitter. React side subscribes through a hook that returns `{ rect, hasSelection }`.
- `FloatingToolbar` renders absolutely-positioned via portal when `hasSelection && rect`.
- `Toolbar` is a stateless button strip dispatching `markdown-commands.*` against the current view.
- `keymap-extension` and `markdown-commands` are pure CM6 — direct copy.

#### `SlashMenu`

- `slash-menu-extension.ts` is a CM6 ViewPlugin that detects `/` at line start, captures the trigger position, and emits state updates via an emitter.
- `use-slash-menu` returns `{ open, position, query, items, onSelect, onClose }`.
- `SlashMenu` renders a popover with filtered items; commands are pure CM6 transactions.

#### `wysiwyg/*`

Every block file (`heading.ts`, `list.ts`, `image.ts`, etc.) is a pure CM6 `ViewPlugin` + `Decoration` + `WidgetType` setup. Zero Vue dependency. Direct copy. The only file that needs attention is `image.ts` if its widget construction imports anything that re-enters the React tree — verify during port.

#### `use-auto-theme` / `use-auto-fonts`

- `use-auto-theme`: `useEffect` watches `useThemeMode().isDark`, dispatches `extensionMap.theme.reconfigure(isDark ? syntaxTheme.dark : syntaxTheme.light)` on the current view.
- `use-auto-fonts`: same pattern over `general.setting.font`.

Both hooks accept the `view` and run effects when view or setting changes.

#### `universal/use-editor-setting`

```ts
// Replaces Vue useStorageObject. The current branch uses ~/hooks/use-local-storage-state.
export function useEditorConfig() {
  const [general, setGeneral] = useLocalStorageState('editor-general', defaultGeneralSetting, GeneralSettingSchema)
  return { general: { setting: general, set: setGeneral, reset: () => setGeneral(defaultGeneralSetting) } }
}
```

Schema retains keys: `renderMode: 'plain'|'wysiwyg'`, `font: 'mono'|'serif'`, plus any others master has.

### 3.3 Integration with WriteRouteViewsContent

Single edit at `apps/admin/src/features/write/components/WriteRouteViewsContent.tsx:1106-1114`:

```tsx
) : (
  <CodeMirrorEditor
    autoFocus={isEditing}
    className="min-h-136 rounded-none border-0 bg-transparent px-0 py-6"
    onChange={(value) => updateField('text', value)}
    text={state.text}
  />
)}
```

Drop the `TextArea` import. Lazy-load `CodeMirrorEditor` via `React.lazy` and wrap in `<Suspense fallback={<TextAreaFallback />}>` to keep the markdown bundle out of the initial page chunk (CodeMirror + extensions are ~150 KB gzipped).

### 3.4 Dependencies to Add (apps/admin/package.json)

Mirror master versions (already vetted):

```
@codemirror/commands       6.10.3
@codemirror/lang-markdown  6.5.0
@codemirror/language       6.12.3
@codemirror/language-data  6.5.2
@codemirror/search         6.7.0
@codemirror/state          6.6.0
@codemirror/theme-one-dark 6.1.3
@codemirror/view           6.42.1
@ddietr/codemirror-themes  1.5.2
@lezer/highlight           1.2.3
```

## 4. Data Flow

```
User types
  → CM6 EditorView.updateListener fires
  → updateListener calls onChange(view.state.doc.toString())
  → CodeMirrorEditor.onChange prop
  → WriteRouteViewsContent.updateField('text', value)
  → state.text updates
  → React re-renders CodeMirrorEditor with same text
  → useCodeMirror compares text vs view.state.doc.toString() — equal → no-op
```

External text change (draft restore, AI rewrite):

```
state.text changes externally
  → React re-renders
  → useCodeMirror compares — different → single dispatch replaces full doc
```

Image upload (drop or paste — both routes share the same store action):

```
User drops image (via ImageDropZone) OR pastes image (via paste handler in useCodeMirror)
  → handler calls editor-store.uploadImageFile(file)
  → editor-store.uploadImageFile inserts ![上传中...](__upload_id__) placeholder
  → addPendingUpload(id, base64) so widget can preview
  → image.ts widget renders base64 preview for placeholders matching __upload_*__
  → filesApi.uploadFile(file, 'image') resolves
  → store finds placeholder by string search, replaces with ![](result.url)
  → removePendingUpload(id)
```

Render-mode toggle:

```
Mod+/ pressed (or settings popover changes renderMode)
  → general.setting.renderMode flips
  → useCodeMirror effect dispatches Compartment.reconfigure for wysiwyg+wysiwygMode+slashMenu
  → CM6 re-renders with new decorations
  → scroll position preserved via EditorView.scrollIntoView on selection head
```

## 5. Error Handling

| Scenario | Handling |
|---|---|
| Upload fails | `sonner.toast.error('图片上传失败')`, placeholder removed (line removed entirely if it was the only content on that line), `setPendingUploadError(id)` then cleanup |
| Container ref null on mount | Hook returns early; no view created |
| `text` prop changes during unmount | `view.destroy()` guard before dispatch |
| Theme module not yet hydrated | Default to light theme |
| `view.dispatch` after `view.destroy()` | Guarded with `editorView.value && !view.dom.isConnected ? skip` |
| WYSIWYG widget construction throws | CM6 catches in its own boundary; widget falls back to source text |

## 6. Testing Strategy

- **Unit:** `editor-store.test.ts` — upload happy path + failure path with mocked `uploadFile`; subscriber notifications.
- **Unit:** `use-codemirror.test.tsx` — mount, text prop sync (external change replaces doc; internal change does not re-dispatch), unmount cleanup.
- **Component:** `CodeMirrorEditor.test.tsx` — render plain vs wysiwyg, `Mod+/` toggle, `ArrowUp` callback at first line.
- **Component:** `ImageDropZone.test.tsx` — drop event triggers store upload (jsdom file drop simulation).
- **Smoke:** `WriteRouteViewsContent.test.tsx` (existing or new) — replacing TextArea, typing updates `state.text`.

Use happy-dom + vitest (already in repo).

## 7. Migration Steps (sequencing)

1. Add CodeMirror dependencies to `apps/admin/package.json`; `pnpm install`.
2. Create `ui/codemirror/universal/` (constants, schema, settings hook, CSS). No CM6 dependency yet — just config plumbing.
3. Copy framework-agnostic files: `extension.ts`, `syntax-highlight.ts`, `language-icons.ts`, `upload-store.ts`, `image-popover-state.ts`, all of `wysiwyg/*`, `toolbar/keymap-extension.ts`, `toolbar/markdown-commands.ts`, `slash-menu/slash-menu-extension.ts`, `slash-menu/slash-menu-items.ts`. Adjust imports.
4. Implement `editor-store.ts` (React-native external store).
5. Implement `use-codemirror.ts`.
6. Implement `CodeMirrorEditor.tsx` (mount-only first, no overlays).
7. Wire into `WriteRouteViewsContent.tsx` — verify plain mode round-trips.
8. Add `use-auto-theme` + `use-auto-fonts`. Verify theme switching.
9. Add `ImageDropZone` + `ImageEditPopover`. Verify upload flow.
10. Add `FloatingToolbar` + `Toolbar`. Verify selection rect tracking.
11. Add `SlashMenu`. Verify trigger detection and command insertion.
12. Enable WYSIWYG: register `wysiwyg/index.ts` compartment. Verify `Mod+/` toggle.
13. Add tests per Section 6.

Each step ends with `pnpm -C apps/admin exec tsc --noEmit --pretty false` + `pnpm -C apps/admin lint` scoped to changed files.

## 8. Risks & Open Questions

- **Bundle size:** CM6 + wysiwyg widgets adds ~150 KB gzip. Mitigated by `React.lazy` on the editor and Vite's automatic code-splitting.
- **WYSIWYG widget React boundary:** none of the master widgets render React components inside `WidgetType.toDOM` — they build raw DOM. Verify during step 12 that `image.ts` doesn't reach for Vue's `h()` (master uses pure DOM; quick grep confirmed).
- **Floating toolbar position with scroll:** master tracks selection rect against the viewport via `getBoundingClientRect()`. Need to verify behavior inside the admin's nested scroll container (`Scroll` component). May need to anchor portal into the scroll container rather than document.body.
- **`unSaveConfirm` plumbing:** master's `useSaveConfirm` hook tracks dirty state and warns on navigation. Current React branch uses TanStack Query mutations; the existing draft system in `WriteRouteViewsContent` may already cover this. **Decision:** skip `useSaveConfirm` in this port — the host page already manages dirty state via `state.text` vs `initialText` comparison. Accept the prop for future re-use but do nothing with it.
- **Multiple editor instances:** singleton `editor-store` assumes one editor. If a draft modal ever mounts a second editor, it must use `embedded={true}` to opt out. Document this in `CodeMirrorEditor.tsx` JSDoc.

## 9. Acceptance Criteria

- [ ] `WriteRouteViewsContent.tsx:1106` no longer references `TextArea` for markdown mode.
- [ ] Typing markdown in the editor updates `state.text` on every keystroke.
- [ ] `Mod+/` toggles between plain and WYSIWYG modes; toggle persists via localStorage.
- [ ] Selecting text shows the floating toolbar; clicking bold inserts `**` markers.
- [ ] Typing `/` at a line start opens the slash menu; selecting "Heading 1" inserts `# `.
- [ ] Dragging an image file into the editor uploads via `filesApi.uploadFile`, shows a base64 preview during upload, and replaces with the final `![](url)` on success.
- [ ] Theme follows `useThemeMode().isDark`.
- [ ] No Vue or Pinia imports anywhere under `ui/codemirror/`.
- [ ] All new tests pass (`pnpm -C apps/admin exec vitest run ui/codemirror`).
- [ ] `pnpm -C apps/admin lint` and `pnpm -C apps/admin exec tsc --noEmit` pass for changed files.
- [ ] Production build succeeds (`pnpm build`).
