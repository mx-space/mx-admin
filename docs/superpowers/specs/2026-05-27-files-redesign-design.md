# /files Route Redesign

**Date:** 2026-05-27
**Branch context:** `refactor/admin-react-migration`
**Status:** Draft — pending user review

## Goal

Bring the three file-management routes (`/files`, `/files/orphans`, `/files/comment-images`) into visual and interaction parity with the rest of the admin (drafts, comments, projects). The current implementation is a single 1385-line monolith that uses a pill-tab source switcher, modal preview, `window.confirm`, and a top-mounted dropzone — none of which match the established master-detail pattern.

Primary driver per user: **UI redesign, visual and interaction**, not functional restructure. Two opportunistic functional additions are in scope:

- Client-side filename search on the list pane
- Image dimensions + mime type in the detail pane

## Non-goals

- Adding rename UI (API exists but stays unused)
- Merging the three sub-routes into a single explorer (rejected: keep each as its own route with its own master-detail page)
- Adding cross-source search / sort beyond what the list pane filter row supplies
- New backend endpoints — work strictly within current `~/api/files.ts` shape
- Replacing `react-resizable-panels` or `~/ui/layout/page-layout`’s `MasterDetailLayout` primitive

## Source structure

Three routes stay distinct. Each is a `MasterDetailLayout` page that owns its own state, query, and detail content. Sidebar entries unchanged.

| Route                  | List pane subject               | Filter row                                    | Selection             |
| ---------------------- | ------------------------------- | --------------------------------------------- | --------------------- |
| `/files`               | files by type (icon/avatar/image/file) | type chip strip (4 options)                   | single-select |
| `/files/orphans`       | orphan image candidates         | none (status is implicit "orphan")            | multi-select (batch delete) |
| `/files/comment-images`| comment uploads                 | status chip strip (all/active/pending/detached) | single-select |

`FilesRouteViews.tsx` keeps its three named exports, but each now resolves to a dedicated component file rather than three flavours of the same surface.

## Shared building blocks

Reuse what `drafts` and `comments` already do — do not reinvent.

- `MasterDetailLayout` from `~/ui/layout/page-layout`
- `FocusScope` + `useListKeyboard` from `~/ui/focus-scope` and `~/ui/list-actions`
- `ListRow` from `~/ui/list-actions/ListRow` for list rows
- `Scroll`, `Button`, `Checkbox`, `SelectField` from `~/ui/primitives`
- `CompactPagination` from `~/ui/data/compact-pagination`
- `confirmDialog` from `~/ui/feedback/confirm` (replace every `window.confirm`)
- Existing `BlurhashImage` + `decodeBlurhashToDataUrl` logic extracted to its own module

New shared modules created by this work:

- `features/files/components/FileThumbnail.tsx` — wraps `BlurhashImage`, single source of truth for blurhash + palette + fallback
- `features/files/components/FileListRow.tsx` — generic thumbnail row, parametrised over a `FileRowItem` adapter shape so all three routes share it
- `features/files/components/FileDetailPane.tsx` — scrollable image-first detail with pluggable metadata sections
- `features/files/components/FileDetailEmpty.tsx` — empty state when no selection
- `features/files/components/UploadDropOverlay.tsx` — page-pane overlay shown only while dragging
- `features/files/components/UploadProgressDock.tsx` — collapsible footer strip showing upload items
- `features/files/hooks/useFileUploader.ts` — extracted upload queue + xhr lifecycle (moved out of the surface component)
- `features/files/hooks/useFileSearch.ts` — case-insensitive substring filter over a list of `FileRowItem`s
- `features/files/utils/format.ts` — `formatBytes`, palette validators, mime-from-name fallback

`FilesRouteViewsContent.tsx` collapses from 1385 lines to a thin router that lazy-imports the three route components. Each route component must stay under the 500-line ceiling (and ideally under 300).

## Per-route specifics

### `/files` — Files by type

**State:** `fileType` (`icon | avatar | image | file`), `selectedName`, `searchQuery`. Synced to URL via `useSearchParams` (`?type=…&id=…&q=…`).

**List pane:**

- Header (`h-12`): title + total count + `⤓ Upload` button + `↻ Refresh` button
- Filter strip: 4 type chips (icon/avatar/image/file), single-select, full-width container with `border-b`
- Search row: an outlined `<input>` that filters the loaded list client-side on filename substring. Empty input = no filter
- Scrollable list of `FileListRow`s (36×36 leading thumbnail, filename, metadata line: relative time, byte count if available)
- Drag-over the list pane reveals `UploadDropOverlay`
- Footer: `UploadProgressDock` if there are active/recent items; auto-hides 4 s after the last item resolves

**Detail pane:** Hero preview at the top (image natural-fit, max-height 50 vh), header strip with filename + copy URL + open new tab + delete. Below the image:

1. **Basics** — URL (monospace, copy-on-click), source type chip, relative + absolute `created`
2. **Image** — natural dimensions (read from `<img>.naturalWidth/Height` on load), mime (derived from filename extension when API doesn’t supply it), aspect ratio
3. **Appearance** — palette swatches, blurhash hash text in monospace

Non-image types (type `file`) hide section 2 and replace the hero with a generic file icon block.

### `/files/orphans` — Orphan image candidates

**State:** `page`, `selectedId`, `selectedIds[]`, `selectAllAcross`. URL sync: `?page=…&id=…`. Selection of "all across pages" only lives in component state — never URL — because it depends on a server-side count.

**List pane:**

- Header: title + total + `↻ Refresh`. When selection is non-empty, the row of count + `Delete selected (N)` / `Delete all (total)` / cleanup buttons drops down below the header as an action strip (current "selectionBar" pattern from drafts).
- A short copy block (`description` + `cleanupNote`) appears once at the top above the search row, not per page — keeps user oriented
- Search row: same client-side filename filter as `/files` (debounce 100 ms)
- Scrollable list: `FileListRow` adapted with a leading `Checkbox`. Each row shows filename, status chip if present, byte size, refType (or `(unbound)`), relative `createdAt`
- Footer: `CompactPagination`

**Detail pane:** Hero preview + sections:

1. **Status** — status chip, `detachedAt`, `uploadedBy`
2. **Reference** — `refType`/`refId` (or "(no reference)"), `readerId`
3. **Image** — byteSize, mimeType, dimensions, aspect
4. **Appearance** — palette + blurhash

Detail header actions: copy URL · open · delete (with `confirmDialog`).

### `/files/comment-images` — Comment uploads

**State:** `status` (filter), `page`, `selectedId`. URL sync: `?status=…&page=…&id=…`.

**List pane:**

- Header: title + total + `↻ Refresh`
- Filter strip: status chips (all / active / pending / detached) — chip strip replaces today’s `SelectField`, mirroring `/files` type chips
- Search row: client-side filename filter
- Scrollable list: `FileListRow` showing filename, status chip, byte size + mime, ref link, reader id, relative `createdAt`
- Footer: `CompactPagination`

**Detail pane:** Hero preview + sections:

1. **Status** — status chip, `detachedAt` if present
2. **Reference** — `refType`/`refId` linkable to the comment surface, `readerId`
3. **Image** — byteSize, mimeType, dimensions, aspect
4. **Appearance** — palette + blurhash

Detail header actions: copy URL · open · `jump to comment` (if `refType === 'comment'`) · delete.

## Upload UX

Lives only on `/files`. Two entry points:

1. **Header button** — `⤓ Upload` opens the existing hidden `<input type="file" multiple>`. Type validation matches the current `fileTypes.acceptImage` rule.
2. **Drag-anywhere** — the list pane registers `dragenter`/`dragover`/`dragleave`/`drop` at the top-level pane. While dragging, `UploadDropOverlay` shows a centered dashed border with copy "Drop to upload to <currentType>". On drop, files are queued through `useFileUploader`.

`useFileUploader`:

- Queue: capped at 8 visible items, oldest aged out when capacity exceeds.
- Each item: `{ id, name, progress, status: 'uploading' | 'done' | 'error', error? }`
- Uses existing `uploadFileWithProgress` from `~/api/files`. XHR lifecycle, progress callback, error normalisation stay identical.
- After completion the hook fires `onSuccess(count)` so the page can `invalidateQueries`.

`UploadProgressDock` lives as a slim strip above pagination in the list pane. Collapsed: one line "↑ 2 uploading · ↓"; expanded: the per-item list with progress bars and the previous error messages.

## Detail pane behaviour

- Single component `FileDetailPane` accepts `{ item, sections, headerActions }`. Sections are an ordered array of `{ key, title, content }`. The three routes compose different sections, but the chrome (header, image hero, scroll container, section spacing, mobile back button) is identical.
- Hero behaviour: if the file is an image (heuristic: extension OR `acceptImage` from `fileTypes` OR mimeType startsWith `image/`), render `BlurhashImage` with `object-fit: contain` and max-height `min(50vh, 480px)`. Clicking the hero opens the full-bleed lightbox; the existing `ImagePreviewDialog` is extracted into `FilePreviewLightbox` reusable across routes.
- For non-image files: render a centred file-icon block in place of the hero, no lightbox.
- Detail header renders a back button on mobile (`useMediaQuery(DESKTOP_MEDIA_QUERY)` false) that calls back into the page-level `setShowDetailOnMobile(false)` / clears the URL `id`. `MasterDetailLayout` handles the slide animation but not the button itself; reuse `HeaderBackButton` from `~/ui/layout/header-back-button` like drafts and comments do.
- Copy URL uses navigator clipboard with toast feedback (existing `copyToClipboard` helper, extracted to `utils/clipboard.ts` shared with comments/drafts).

## Search row spec

`useFileSearch(items, query)` returns the filtered subset. Match is case-insensitive substring over filename and (where present) the `meta`/`reference` text. Query is debounced 100 ms with a `setTimeout` inside `useEffect`; the hook exposes the deferred query in addition to filtered items in case a caller wants to show a "searching for X…" hint. Empty input returns the original array reference (no allocation). Whitespace trimmed.

Search is **client-side only** — `/files` loads all of one type at once, `/files/orphans` and `/files/comment-images` only filter the current page. The empty-state copy when search returns 0 clearly says "no matches on this page" so users understand pagination still matters for orphan + comment-image routes.

## Keyboard & focus

Adopt the drafts pattern wholesale:

- `<FocusScope id="files-list">` wraps the list pane
- `useListKeyboard` with `actions: ListAction<FileRowItem>[]` provides j/k row nav, `Enter` to select detail, `x` to toggle the row checkbox (orphans), `d` for delete (with confirm)
- Search input owns `/` shortcut to focus
- Detail pane footer / scroll area is reachable with `Tab` from the list pane; `Esc` clears the selection and returns focus to the list

## Mobile

`MasterDetailLayout` collapses to a stack: selecting a row sets `showDetailOnMobile`, the detail-pane back button clears it. Upload drag handling is suppressed when `useMediaQuery(DESKTOP_MEDIA_QUERY)` is false (the drop overlay never renders, the pane-level drag listeners are not attached). The header `⤓ Upload` button stays on mobile — it opens the native file picker, which is the right pattern on touch.

## Confirm flow

Every `window.confirm(...)` call is replaced by `confirmDialog({ destructive: true, title, description })`. Confirm dialog awaits user decision before mutating. Affected sites:

- `/files`: delete file
- `/files/orphans`: delete single, batch delete (selected / all-across), cleanup-by-age
- `/files/comment-images`: delete comment upload

## File layout

```
apps/admin/src/features/files/
├── components/
│   ├── FilesRouteViewsContent.tsx        # thin re-exports (kept)
│   ├── FilesByTypePage.tsx               # /files
│   ├── OrphanFilesPage.tsx               # /files/orphans
│   ├── CommentImagesPage.tsx             # /files/comment-images
│   ├── FileListRow.tsx
│   ├── FileDetailPane.tsx
│   ├── FileDetailEmpty.tsx
│   ├── FilePreviewLightbox.tsx
│   ├── FileThumbnail.tsx
│   ├── UploadDropOverlay.tsx
│   ├── UploadProgressDock.tsx
│   ├── filters/
│   │   ├── TypeChipStrip.tsx
│   │   └── StatusChipStrip.tsx
│   └── sections/
│       ├── DetailSectionBasics.tsx
│       ├── DetailSectionImage.tsx
│       ├── DetailSectionAppearance.tsx
│       ├── DetailSectionStatus.tsx
│       └── DetailSectionReference.tsx
├── hooks/
│   ├── useFileUploader.ts
│   └── useFileSearch.ts
├── utils/
│   ├── format.ts
│   ├── adapters.ts                       # FileItem / OrphanFile / CommentUploadFile -> FileRowItem
│   └── isImageMime.ts
├── constants.ts
└── routes/
    └── FilesRouteViews.tsx               # unchanged shape
```

Old `FilesRouteViewsContent.tsx` (1385 lines) is split across the above; nothing imports from it after the migration so the old surface deletes cleanly.

## Adapter shape

Each list source produces `FileRowItem`s through `utils/adapters.ts`. This keeps `FileListRow` source-agnostic.

```ts
interface FileRowItem {
  id: string
  name: string
  url: string
  thumbnailUrl?: string
  blurhash?: string | null
  palette?: { dominant?: string; swatches?: string[] } | null
  primary: string         // filename
  secondary?: string      // meta line ("128 KB · 2d ago")
  tertiary?: string       // ref / reader id when present
  status?: { label: string; tone: 'neutral' | 'warn' | 'danger' }
  createdAt?: string
}
```

The original API types (`FileItem`, `OrphanFile`, `CommentUploadFile`) stay; only the row consumes the adapter shape.

## Data flow

No changes to `~/api/files.ts`. Query keys remain `['files', 'by-type', type]`, `['files', 'orphans', {...}]`, `['files', 'comment-uploads', {...}]`. Invalidation strategy stays "after every successful mutation, invalidate the root `['files']` key".

`placeholderData: previous` retained for paged queries so the list does not flash empty on page change.

## Testing

- Unit: `useFileSearch` (filter correctness, empty input passthrough, debounce), `useFileUploader` (queue cap, status transitions, error normalisation), `adapters.ts` per source
- Component: `FileListRow` snapshot of three adapter shapes, `FileDetailPane` rendering each section combination
- Integration: existing playwright-style smoke (if present) re-pointed at new route components — confirm upload → grid refresh, orphan batch delete → list refresh, comment-image status filter → query refetch

## Migration plan

Done in one branch, in this order, to keep each commit shippable:

1. Introduce shared modules (`FileThumbnail`, `FileListRow`, `FileDetailPane`, hooks, utils) — no route changes, no consumers yet. Tests added with each.
2. Build `FilesByTypePage` against shared modules. Wire `FilesRouteViewsContent` to use it for the `files` source while still falling back to the old code for the other two sources. Visual review.
3. Build `OrphanFilesPage`. Replace `OrphanFilesPageContent` re-export.
4. Build `CommentImagesPage`. Replace `CommentImagesPageContent` re-export.
5. Delete dead code in `FilesRouteViewsContent.tsx`; the file becomes a 3-line re-export shim, then either kept as a tombstone or deleted depending on `routes.tsx` import path.
6. Final pass: lint changed files only, typecheck changed files only per CLAUDE.md guidance.

Each step is a separate commit with a clear focus.

## Risks

- Loading all `/files` of one type without pagination could be slow for large libraries. Out of scope for this redesign — the API already returns everything; if it becomes a problem we add server-side pagination separately.
- Image natural dimensions require waiting for `onLoad`. Falling back to "—" is acceptable while loading.
- "Select all across pages" is the only stateful operation that crosses the page boundary; it must be reset when the filter or status changes. Already covered by current effect that resets selection on `source` and `page` change — port it across.

## Open questions

None at time of writing. Sections explicitly out of scope:

- Rename UI
- Cross-route search
- Server-side sort
- New API fields beyond what already exists
