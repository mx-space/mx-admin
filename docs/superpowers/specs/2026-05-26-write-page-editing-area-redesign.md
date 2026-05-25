# Write Page Editing Area Redesign

**Date:** 2026-05-26
**Scope:** `apps/admin/src/views/write-page.tsx` — editing content area only (title, slug hint, subtitle, body, surrounding meta strip). The page header bar, aside meta panel, draft/recovery dialogs, and agent panel are explicitly out of scope and remain unchanged.

## Goal

Replace the form-flavored editing surface with a Notion/Linear-style document canvas. Reduce visual chrome, give writing primacy, hide non-essential controls behind hover and focus state.

## Why

Current editing area treats title, slug, subtitle, AI button, and format toggle as peer form fields, packed into ~120px of vertical chrome above the body. This signals "you are filling a form" rather than "you are writing a document." The redesign reorders the surface so the title functions as a document title (large, unbordered, no adjacent siblings) and pushes everything else into an opacity-0.55 strip or a hover-revealed slug pill.

## Scope: what changes

In `WritePage` (currently lines 807–1193 of `write-page.tsx`), the two large branches (`props.kind === 'page'` vs `else`) both render a similar header block above the body editor. This redesign rewrites that header block and unifies it across kinds.

**In scope:**
- Editing canvas header for all three kinds (`post`, `note`, `page`)
- Title input styling and sizing
- Slug visibility model
- Format toggle (`PageFormatToggle`) placement
- AI generate-title-slug button placement and visibility rules
- Draft status display inside the editing area
- Subtitle / summary / date hint placement per kind
- Editor body container width and vertical spacing
- Focus-driven dimming behavior

**Explicitly NOT in scope:**
- `HeaderBackButton`, draft tag chip, aside toggles, publish button in the top app-shell-height header bar — unchanged
- `AsidePanel` / `ContentSettingsPanel` / `PageSettingsPanel` — unchanged. Slug field already exists there; it remains the canonical edit point when the slug popover is not used
- `DraftListDialog`, `DraftRecoveryDialog`, `PageParseMarkdownDialog`, `PageLexicalDebugDialog` — unchanged
- Agent panel surface and toggle behavior — unchanged
- The `RichWriteSurface` / `RichEditorWithAgent` body editor internals — unchanged
- All data-fetching, mutation, autosave, route navigation, beforeUnload logic — unchanged

## New visual structure

Single unified layout for all three kinds:

```
┌─ editor canvas (max-w-[42rem] centered, px-3, pt-12) ────────┐
│                                                              │
│  ┌─ meta strip (opacity-55, hover:opacity-100) ──────────┐  │
│  │  ● status text                          [format] [AI] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Title (text-3xl/30px, font-semibold, tracking-tight)        │
│  /posts/cat/foo-bar  ✎  ← slug hint (opacity-0 → 0.6 on      │
│                            title-area hover; click expands   │
│                            inline popover)                    │
│  Subtitle / summary / date (text-base text-neutral-500)      │
│                                                              │
│  ──── divider (border-neutral-100, my-8) ────                │
│                                                              │
│  Body (lexical or markdown surface, no own chrome)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Component breakdown

Extract three small subcomponents in the same file (kept inline; no separate files):

### `EditorMetaStrip`

Props:
- `status: 'new' | 'dirty' | 'saved' | 'published'`
- `statusText: string` (e.g. `'草稿 v3 · 2 分钟前'`, `'新建未保存'`, `'已发布'`)
- `canSwitchFormat: boolean`
- `format: 'lexical' | 'markdown'`
- `onToggleFormat: () => void`
- `aiButtonVisible: boolean`
- `aiButtonPending: boolean`
- `onAiGenerate: () => void`

Renders a flex row:
- Left: `<span>` colored dot (6×6, rounded-full) — `bg-neutral-300` for `new`, `bg-amber-500` for `dirty`, `bg-emerald-500` for `saved`, `bg-emerald-500` for `published`. Followed by `<span class="text-xs text-neutral-500">{statusText}</span>`.
- Right: two `<button>` ghost icons (24×24, rounded-md, `text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700`):
  - format toggle (`ArrowLeftRight` from `lucide-react`, only rendered when `canSwitchFormat`)
  - AI generate (`WandSparkles`, only rendered when `aiButtonVisible`, shows `Loader2` when pending)

Strip is wrapped in `<div class="opacity-55 transition-opacity duration-200 hover:opacity-100">`. Margin: `mb-6`.

Status mapping (computed in `WritePage`). Evaluate top to bottom; first match wins:

1. `draftMutation.isPending` → `dirty` / `'保存草稿中…'`
2. `draftDirtyRef.current && hasDraftAutosaveContent` → `dirty` / `'未保存改动'` (append ` · v{n}` if `availableDraft || draftMutation.data` exists)
3. `draftMutation.data || availableDraft` (with no pending dirty changes) → `saved` / `'草稿 v{n} · 保存于 {relative-time}'`
4. `isEditing` (no draft, content matches published) → `published` / `'已发布 · 同步于 {relative-time}'`
5. otherwise → `new` / `'新建未保存'`

`{n}` is the draft version from `draftMutation.data?.version ?? availableDraft?.version`. `{relative-time}` is computed from the corresponding `updatedAt`.

### `EditorTitleArea`

Props:
- `title: string`
- `onTitleChange: (v: string) => void`
- `placeholder: string`
- `required: boolean`
- `autoFocus: boolean`
- `slug: string`
- `slugHint: string` (the full URL excluding host, e.g. `/posts/tech/react-concurrent` or `/notes/146`)
- `onSlugChange: (v: string) => void`
- `slugEditable: boolean` (false for `note` when slug is auto-derived, etc.)
- `subtitle?: ReactNode` (already-styled subtitle/summary/date hint provided by parent)

Renders, in order:
1. **Title input** — plain `<input>` (do NOT use `TextInput` component, which forces border styling). Classes: `w-full bg-transparent border-0 outline-none px-0 py-2 text-3xl font-semibold tracking-tight text-neutral-950 placeholder:text-neutral-300 placeholder:font-medium dark:text-neutral-50 dark:placeholder:text-neutral-700`.
2. **Slug pill** (`SlugPill` subcomponent, see below) — only rendered when `slugEditable && slugHint` present.
3. **Subtitle slot** — renders `subtitle` prop directly.

Wrapped in `<div class="group">` so the slug pill can react to `group-hover:`.

### `SlugPill`

Props:
- `slug: string`
- `displayPath: string` (full path with leading `/`)
- `onChange: (v: string) => void`
- `onCopy?: () => void`
- `aiButtonVisible?: boolean`
- `onAiGenerate?: () => void`
- `aiPending?: boolean`

Renders an inline-flex pill:
- Default state: `opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity duration-150`
- Classes: `inline-flex items-center gap-1 mt-1.5 -ml-1 px-1.5 py-0.5 rounded-md text-xs font-mono text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900`
- Content: `<span>{displayPath}</span><Pencil class="size-3 opacity-0 group-hover/pill:opacity-100"/>`
- Click opens a `Popover` (Base UI) anchored to the pill containing:
  - Label: `Slug`
  - `TextInput` for editing the slug (mono, sized to value)
  - Optional copy button (if `onCopy`)
  - Optional `AI 生成` button (if `aiButtonVisible`)
- Popover closes on outside click and on Escape. Enter inside the slug input MUST `event.preventDefault()` and close the popover — without this, the surrounding `<form>` would submit the publish mutation.

The popover is a NEW small surface — use the existing `Modal`/`Drawer` pattern, but a popover anchored to the trigger. If Base UI's `Popover` primitive isn't yet wrapped in `src/ui`, add a minimal `Popover` wrapper in `src/ui/popover.tsx`.

### Subtitle slot per kind

Parent (`WritePage`) builds the `subtitle` node and passes it in:

- **`page`**: existing subtitle input, restyled as `<input class="w-full bg-transparent border-0 outline-none px-0 mt-1 text-base text-neutral-500 placeholder:text-neutral-300 dark:text-neutral-400 dark:placeholder:text-neutral-700" placeholder="副标题…">`. Optional; not required.
- **`note`**: no input. Render `<p class="mt-1 text-base text-neutral-500 dark:text-neutral-400">{defaultNoteTitle 已置为 title 的 placeholder}</p>` — actually, for note the title placeholder already shows the date, so subtitle slot returns `null` for note.
- **`post`**: hover-revealed summary placeholder. Render `<input class="w-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-transparent border-0 outline-none px-0 mt-1 text-base text-neutral-500 placeholder:text-neutral-300" placeholder="一句话简介…" value={state.summary} onChange={(e) => updateField('summary', e.target.value)}>`. Always rendered (so layout doesn't shift); just opacity-gated. When `state.summary` is non-empty, always visible (so the user sees what they typed).

## Body container

Replace the existing nested wrappers around `RichWriteSurface` / `TextArea` with a single wrapper. Width changes from `max-w-[60rem]` to `max-w-[42rem]` (about 672px, matching Notion's typical body width).

```
<div class="mx-auto w-full max-w-[42rem] px-3">
  <hr class="border-0 border-t border-neutral-100 dark:border-neutral-900 my-8"/>
  {state.contentFormat === 'lexical' ? <RichWriteSurface .../> : <TextArea .../>}
</div>
```

Surface and textarea inner classes remain transparent / borderless as today.

## Focus dimming

When the body editor has DOM focus (`document.activeElement` is inside the body wrapper) for ≥ 5 seconds with no mouse movement, fade the meta strip, slug pill, and subtitle slot to `opacity-20`. Any `mousemove` within the editor canvas or focus leaving the body restores `opacity-100` (or strip's default `opacity-55`).

Implementation: a small `useEditorFocusDim()` hook in the same file. Returns a `dimmed: boolean`. Top-level canvas attaches `mousemove` listener (throttled to 1/200ms). Hook tracks `focusin`/`focusout` and a debounced timer.

Acceptable to ship without this in a first pass — flag it as a follow-up if implementation cost is high. If shipping later, leave the hook scaffolding in place but always return `false`.

## Removed / changed elements

Elements that are removed from the editing area:

| Element | Current location | New location |
|---|---|---|
| URL prefix span (`WEB_URL/posts/cat/`) | Inline above title | Inside slug popover when expanded |
| Slug `<input>` | Inline below title | Inside slug popover when expanded; canonical input remains in aside meta panel |
| Inline AI button (next to slug) | Inline | Top meta strip (right side, ghost icon) |
| `PageFormatToggle` (next to title) | Title row | Top meta strip (right side, ghost icon) |
| Copy URL button (page kind) | Inline next to slug | Inside slug popover |
| Subtitle input (page kind) | Below slug row | Below title, restyled |
| AI hint button (post/note inline) | Replaced by central placement | Top meta strip |

## Affected types

No model changes. `WriteFormState` and all mutations unchanged. Only DOM structure and styling change.

## Kind-specific behavior summary

| Aspect | post | note | page |
|---|---|---|---|
| Title placeholder | `'输入标题...'` | `defaultNoteTitle` (e.g. `'2026 年 5 月 26 日 · 第 146 天'`) | `'输入标题...'` |
| Title required | yes | no | yes |
| Slug pill | shown when `state.slug` or hover | hidden (note slug is optional + uncommon) | shown when `state.slug` or hover |
| Slug required | yes | no | yes |
| Subtitle slot | hover-revealed `summary` input | `null` | always-visible `subtitle` input |
| AI button (in strip) | when `!state.title.trim() || !state.slug.trim()` and `state.text.trim()` | when `state.text.trim()` | when `!state.slug.trim()` and `state.text.trim()` |
| Format toggle (in strip) | when `canSwitchEditorType` | when `canSwitchEditorType` | when `canSwitchEditorType` |

## Accessibility & keyboard

- Title `<input>` retains `autoFocus` when not editing (creating new) and when editing (loading existing).
- Slug pill is a `<button>`; Enter / Space opens popover. Popover focuses the slug input on open. Escape closes.
- Format / AI icon buttons are real `<button>` with `aria-label` and `title`.
- Status text in meta strip is a `<span>` (not a button) — purely informational.
- All ghost icons retain visible focus ring (`focus-visible:ring-1 focus-visible:ring-neutral-400`).

## Loading & empty states

- `detailQuery.isLoading` continues to render `<WriteSkeleton>` in place of the canvas (unchanged).
- When no content yet: title input shows placeholder, slug pill is hidden (no slug, nothing to hover-reveal), subtitle slot for post is opacity-0 placeholder, divider still renders, body shows its own placeholder.

## Open implementation notes

- `Popover` primitive: if not yet present in `src/ui`, add a thin wrapper around Base UI's `Popover` (`@base-ui-components/react/popover`) with project-standard styling. Reference existing modal/drawer wrappers for conventions.
- Relative-time formatting: use existing `formatDateTime` helper for absolute; add `formatRelativeTime` if not present, or inline a small helper.
- All current `useEffect`s in `WritePage` (autosave, beforeUnload, draft recovery, route draft application, navigation guard) remain untouched.
- The two large branches (`page` vs `note/post`) collapse into one shared layout. The only branching now lives in props passed to `EditorTitleArea` (title placeholder, required, subtitle node, slug pill shown).

## Validation criteria

Manual visual checks (no automated test required for this change):

1. New post: open, title focused, type a title → title in 30px semibold; no other visible chrome above. Hover title area → slug pill appears in muted mono. Click pill → popover with slug input. Type → state updates. Click outside → popover closes.
2. Existing post with content: meta strip shows `草稿 v… · saved …` with emerald dot. Hover strip → opacity full. Move mouse away → opacity 0.55.
3. Page kind: subtitle input visible below title; format toggle and slug pill behave same as post.
4. Note kind: title placeholder shows date; no slug pill; no subtitle input; meta strip and body behave normally.
5. Body width is ~672px (max-w-[42rem]) on desktop, scrolls fine on mobile.
6. Aside meta panel (toggle from header) still shows and edits slug identically to before.
7. All existing dialogs and the agent panel open and behave identically.
8. No regressions in autosave, beforeUnload prompts, recovery dialog, or navigation guard.

## Out of scope but noted

These would be worth doing next but are not part of this spec:
- Page header bar redesign (path button, command palette, etc.)
- Aside meta panel layout polish
- Draft list / recovery dialog visual refresh
- Cover image / icon support above title (Notion-style)
- Slash command palette for inserting metadata from inside the body
