# `/markdown` Page Redesign

**Status:** Approved (spec)
**Date:** 2026-05-28
**Scope:** `apps/admin/src/views/(assets)/markdown/page.tsx` and `apps/admin/src/features/markdown/`
**Out of scope:** API changes, new categories endpoint, multi-route split, persisted import history, export presets.

---

## 1. Why

The current `/markdown` page is a flat two-column grid: an Import section on the left, an Export section on the right. The layout has three structural problems:

1. **Parsed rows are read-only.** When a `.md` file has a wrong `title`, a missing `slug`, or no `date`, the user must edit the source file and re-drop. This is the most frequent friction.
2. **No preview before import.** Users submit content blind. Mistakes (wrong file picked, wrong frontmatter, broken parse) surface only after import lands in CMS.
3. **Export competes for visual weight.** Export is four checkboxes plus a button — a low-frequency utility — but it occupies ~40% of the page width permanently. Import gets squeezed.

This redesign keeps the page as a single route (no sidebar growth), introduces a mini master-detail inside the Import section, and demotes Export to a bottom accordion. Editable rows and an in-line preview address (1) and (2). Repositioning Export addresses (3).

## 2. Goals & non-goals

**Goals**

- Make the Import flow safe to use without round-tripping to the source file: title / slug / date are editable, content is previewed before submission.
- Strengthen the drop zone (append mode, type rejection, duplicate-name skip).
- Demote Export visually without removing it; persist user's export config across visits.
- Match project visual conventions (`neutral`-only grays, typography scale from `docs/typography.md`, layout primitives from `apps/admin/src/ui/layout`).

**Non-goals**

- Editing tags or categories at import time (needs a categories API and combobox; deferred).
- Persisting parsed state across page reloads.
- Saving named export presets.
- Showing a sample-output preview for exports.
- Splitting Import and Export into separate routes.

## 3. Decisions captured from brainstorm

| # | Decision | Reason |
|---|----------|--------|
| D1 | Stay a single route. | Both flows are low-frequency; splitting would bloat the sidebar for marginal benefit. |
| D2 | Stacked layout with Export collapsed below Import. | Import is the primary surface; Export is a sometimes-tool. Visible-but-collapsed beats sibling column. |
| D3 | Editable scope = `title`, `slug`, `date`. | Solves ~90% of real friction; tags/categories require new API and richer UI. |
| D4 | Add markdown content preview pane bound to selection. | Lets users verify what they are about to import. |
| D5 | Drop zone supports append + dedupe by filename. | Current behavior replaces queue on every drop, which is destructive. |
| D6 | No top-level tabs / segmented controls. | Project layout convention forbids tabs as a primary structural device. |

## 4. Architecture

### 4.1 File layout

```
apps/admin/src/views/(assets)/markdown/page.tsx           (unchanged — re-exports view)
apps/admin/src/features/markdown/
├── components/
│   ├── MarkdownRouteViewContent.tsx                       (orchestrator; thinner)
│   ├── import/
│   │   ├── ImportSection.tsx                              (NEW — wraps top bar + body)
│   │   ├── ImportTopBar.tsx                               (NEW — type select + submit + clear)
│   │   ├── DropZone.tsx                                   (NEW — large + compact variants)
│   │   ├── FileQueueList.tsx                              (NEW — left 38% column)
│   │   ├── FileQueueItem.tsx                              (NEW — row)
│   │   └── ParsedPreviewPane.tsx                          (NEW — right 62%, edit + preview)
│   ├── export/
│   │   ├── ExportAccordion.tsx                            (NEW — collapsible shell)
│   │   ├── ExportOptionsGrid.tsx                          (NEW — 2-col options)
│   │   └── ExportTrigger.tsx                              (NEW — download button)
│   ├── ImportConfirmModal.tsx                             (kept; possibly re-styled later)
│   ├── Metric.tsx                                         (REMOVED — no longer used)
│   └── SectionHeader.tsx                                  (REMOVED — replaced by inline headers)
├── constants.ts                                           (unchanged)
├── types/markdown.ts                                      (unchanged shape; see §4.3)
├── utils/files.ts                                         (unchanged)
└── utils/format.ts                                        (unchanged)
```

`ImportSection` and `ExportAccordion` are siblings under `MarkdownRouteViewContent`. They share nothing except being on the same page; no cross-section state.

### 4.2 State location

State lives in `MarkdownRouteViewContent`:

```ts
const [importType, setImportType]               = useState<ImportType>(ImportType.Post)
const [parsedItems, setParsedItems]             = useState<ParsedItem[]>([])
const [files, setFiles]                         = useState<File[]>([])
const [selectedFilename, setSelectedFilename]   = useState<string | null>(null)
const [editedMetaByFilename, setEditedMetaByFilename] =
  useState<Record<string, Partial<ParsedItem['meta']>>>({})
const [parsing, setParsing]                     = useState(false)
const [importing, setImporting]                 = useState(false)
```

Export state lives entirely inside `ExportAccordion`, persisted to `localStorage`. Orchestrator does not know about it.

### 4.3 Type changes

`ParsedItem` shape is unchanged. We add an internal-only helper:

```ts
// Apply user edits on top of parsed meta. Used in render and at submit time.
function mergeMeta(item: ParsedItem, edits: Partial<ParsedItem['meta']> | undefined) {
  return { ...item, meta: { ...item.meta, ...edits } }
}
```

There is no separate "edited item" type. The user's edits are an overlay map keyed by filename; the merged value is computed on demand.

### 4.4 Data flow

**Drop / select:**
1. `DropZone` receives `File[]`.
2. `MarkdownRouteViewContent.handleFiles(files, mode: 'replace' | 'append')` filters by extension (toast on reject), dedupes by filename against existing queue (toast on skip), then runs the existing `ParseMarkdownYAML` pipeline.
3. On success, append new parsed items to `parsedItems`. On desktop, if `selectedFilename` is null, set it to the first item so the preview pane is populated immediately. On phone, leave `selectedFilename` null and stay on the queue list — the user taps a row to navigate to the detail view.

**Edit:**
1. `ParsedPreviewPane` calls `onEdit(filename, partial)` when a field blurs.
2. Orchestrator merges into `editedMetaByFilename[filename]`.
3. Row gets an "edited" dot via `editedMetaByFilename[filename] !== undefined`.

**Submit:**
1. `ImportTopBar` calls `onSubmit()`.
2. Orchestrator validates: every item must have non-empty `title` and `slug` after merge. Items that fail get marked, the pane scrolls to the first, and a toast names the count.
3. `presentImportConfirm({ importType, itemCount })` modal.
4. On confirm, `importMarkdown({ type, data: parsedItems.map(it => mergeMeta(it, editedMetaByFilename[it.filename])) })`.
5. Success: toast, clear all state. Failure: toast, keep queue intact so the user can retry.

**Remove row:** removes from `parsedItems`, `files`, and `editedMetaByFilename`. If it was selected, fall back to first remaining; if none, return to empty state.

## 5. Layout

### 5.1 Desktop (≥1024px)

```
┌─ page header (h-app-shell, kept) ───────────────────────────────┐
│ <FileDown> Markdown   导入与导出 Markdown 文件                  │
├─────────────────────────────────────────────────────────────────┤
│ ImportTopBar (h-12)                                             │
│ ◉ Import to: [Post ▾]   已解析 3 文件 · 4.2k 字  [清空] [↑ 导入]│
├──────────────────────┬──────────────────────────────────────────┤
│ FileQueueList (38%)  │ ParsedPreviewPane (62%)                  │
│                      │                                          │
│ Files (3)        ✕   │ post-1.md · 1.4k 字       [重置编辑]    │
│ + 追加 .md           │                                          │
│ ● post-1.md       ▶  │ title  [_______________________________] │
│ ○ essay.md           │ slug   [post-1                    ] [⟳] │
│ ○ broken.md     ⚠    │ date   [2024-03-12 10:00            ▾]  │
│                      │                                          │
│                      │ ─── Preview ──────────────────────       │
│                      │ # Hello                                  │
│                      │ Body paragraphs rendered via             │
│                      │ MarkdownRender.                          │
├──────────────────────┴──────────────────────────────────────────┤
│ ▸ Export · 下载全站 Markdown                          3 启用    │
└─────────────────────────────────────────────────────────────────┘
```

Inner heights: `ImportTopBar` h-12, queue + pane fill remaining flex space, `ExportAccordion` collapsed = h-12, expanded grows downward.

### 5.2 Phone (<1024px)

- `ImportTopBar` shrinks to two lines: type+submit, then status row.
- Initial state: full-width drop zone, no queue.
- After parsing: queue list full-width; selecting a row navigates to a detail view (`ParsedPreviewPane` full-width with back arrow at top-left). Reuses the existing pattern from other master-detail pages.
- `ExportAccordion` body switches to single column; behavior unchanged.

### 5.3 Empty state

When `parsedItems.length === 0`:
- `ImportTopBar` shows only the type selector and a muted "选择要导入的目标后拖入文件" hint; submit button hidden.
- `FileQueueList` is hidden.
- `ParsedPreviewPane` is hidden.
- A large `DropZone` (h-44) fills the import body with copy: `拖入 .md 文件以开始 · 或点击选择`.
- `ExportAccordion` renders normally.

## 6. Components

### 6.1 `ImportTopBar`
Props: `importType`, `onImportTypeChange`, `parsedCount`, `totalChars`, `canSubmit`, `submitting`, `onSubmit`, `onClear`.
Renders type select, status text, clear (subtle, only when has data), primary submit (with count).

### 6.2 `DropZone`
Props: `mode: 'large' | 'compact'`, `disabled`, `onFiles(files: File[])`.
- Large: h-44, full body, used in empty state.
- Compact: h-10, sits at the top of `FileQueueList`. Same drag handlers.
- Both: click → hidden `<input type=file multiple accept=".md,.markdown">`; dragOver/Leave toggles accent classes; drop normalizes `dataTransfer.files`.
- Type rejection is the zone's responsibility: filter to `.md` / `.markdown`, toast the count of rejected files.

### 6.3 `FileQueueList`
Props: `items: ParsedItem[]`, `selectedFilename`, `editedSet: Set<string>`, `failedSet: Set<string>`, `onSelect`, `onRemove`, `onClear`.
- Header row (h-10): `Files (N)` · clear button (subtle).
- Compact `DropZone` below the header.
- Scrollable list, single-select via `useListKeyboard` from `~/ui/list-actions` (Up/Down/Home/End).
- Row content: status dot, filename truncated, fail chip if applicable, edited dot if applicable, remove button on hover.

### 6.4 `ParsedPreviewPane`
Props: `item: ParsedItem`, `edited: Partial<Meta> | undefined`, `failed: boolean`, `onEdit(partial)`, `onResetEdits`.
- Header (h-10): filename, body char count, "重置编辑" subtle button (only when `edited` exists).
- If `failed`: replace fields and preview with a centered error block ("解析失败: <reason>") and a single "移除此条" button.
- Otherwise: three labeled fields (`title`, `slug`, `date`) and a preview region.
- Slug has a `⟳` icon button that regenerates from the current title via `slugify`-ish logic (or just `title.toLowerCase().replace(...)`; reuse existing helper if present).
- Preview region: `<MarkdownRender>` wrapped in a max-h-[50vh] scroll container; renders `item.text`.

### 6.5 `ExportAccordion`
Props: none (self-contained; reads/writes `localStorage`).
- Header row (h-12): caret · `Export` · subtitle · `N 启用` chip on the right.
- Click anywhere on the header toggles. `aria-expanded` mirrors state. Toggle persisted to `localStorage('markdown.export.open')` (default closed).
- Body: `ExportOptionsGrid` + `ExportTrigger` at the bottom-right.
- Options config persisted to `localStorage('markdown.export.config')`. On mount, hydrate from storage; on change, write through.

### 6.6 `ExportOptionsGrid`
Props: `value: ExportConfig`, `onChange(next)`.
- `grid grid-cols-2 gap-x-6 gap-y-3` on desktop, `grid-cols-1` on phone.
- Each option: `<Checkbox>` + a stacked label / description pair. Cells do not carry a border or panel background; the accordion body already provides the container.

### 6.7 `ExportTrigger`
Props: `config`, `onDone()`.
- Owns its own `exporting` flag.
- On click: call `exportMarkdown(...)` and `saveBlob`. Toast on success/failure.

## 7. Visual tokens

| Element | Class |
|---|---|
| Page background | `bg-white dark:bg-neutral-950` |
| Section divider | `border-neutral-200 dark:border-neutral-800` |
| Hovered row | `hover:bg-neutral-50 dark:hover:bg-neutral-900` |
| Selected row | `bg-neutral-100 dark:bg-neutral-800` |
| Accent (drag-over, edited dot, ⟳) | `text-blue-500 / border-blue-500 / bg-blue-50 dark:bg-blue-950/40` |
| Success status (ok dot) | `bg-emerald-500` |
| Danger (fail chip, missing field outline) | `text-red-500 / border-red-500` |
| Micro section header text | `text-xs uppercase tracking-wide text-neutral-500` |
| Row filename | `text-sm` |
| Field label | `text-xs text-neutral-500` |
| Tabular counts | `text-xs tabular-nums text-neutral-400` |

All grays use `neutral`. No arbitrary font sizes — only the scale from `docs/typography.md`.

## 8. Loading, empty, error states

| Trigger | UI |
|---|---|
| Parsing files | `DropZone` (whichever variant is mounted) shows an overlay row with a spinner and "解析中…" |
| Importing | Submit button shows spinner inline; rest of UI stays interactive but the button is `aria-disabled` |
| Exporting | `ExportTrigger` button shows spinner; checkboxes remain interactive |
| All files fail to parse | Toast (red); state resets to empty |
| Some files parse, some fail | Failed rows show `⚠` chip; selecting one shows the failure pane (no edit form, no preview) |
| Import API failure | Toast (red); queue + edits are preserved so user can retry |
| Submit with missing `title`/`slug` | Toast ("N 文件缺 title/slug"); affected rows get red border; pane scrolls to first failure |
| Type-rejected file dropped | Toast (warn) with the rejected count and the offending extensions |
| Duplicate filename appended | Toast (info) listing skipped names |

## 9. Accessibility

- `DropZone` is `<button>`-like: `role="button"`, `tabIndex={0}`, Enter/Space opens file dialog. `aria-busy` while parsing.
- `FileQueueList` is a `<ul role="listbox">`; each item `role="option"` + `aria-selected`. Keyboard nav via Up/Down/Home/End/Enter (reuse `~/ui/list-actions/useListKeyboard`).
- Three edit fields are real `<label htmlFor>` + `<input>` pairs. Required fields use `aria-required="true"` and `aria-invalid` when validation fails.
- `ExportAccordion` header is a `<button aria-expanded>` with `aria-controls` pointing at the body's `id`. Body is rendered conditionally (not just visually hidden).

## 10. Internationalisation

New translation keys (under `markdown.*`, added to both `zh-cn` and `en`):

| Key | zh-cn | en |
|---|---|---|
| `markdown.subtitle` (rewritten) | 导入与导出 Markdown 文件 | Import and export Markdown |
| `markdown.import.empty` | 拖入 .md 文件以开始 · 或点击选择 | Drop `.md` files to begin, or click to pick |
| `markdown.import.append` | + 追加文件 | + Append files |
| `markdown.import.appendHint` | 点击或拖放追加 | Click or drop to append |
| `markdown.import.skipDup` | 已跳过同名文件: {names} | Skipped duplicate files: {names} |
| `markdown.import.fileTypeReject` | 仅支持 .md / .markdown，已忽略 {count} | Only .md / .markdown supported; ignored {count} |
| `markdown.import.missingFields` | {count} 文件缺 title 或 slug | {count} files are missing title or slug |
| `markdown.import.preview` | 预览 | Preview |
| `markdown.import.resetEdits` | 重置编辑 | Reset edits |
| `markdown.import.regenSlug` | 由 title 重生 slug | Regenerate slug from title |
| `markdown.import.failPane.title` | 解析失败 | Parse failed |
| `markdown.import.removeRow` | 移除此条 | Remove this item |
| `markdown.export.openHint` | 下载全站 Markdown | Download site Markdown |
| `markdown.export.enabledCount` | {count} 启用 | {count} on |

Existing keys (`markdown.type.*`, `markdown.export.options.*`, `markdown.import.parsing`, `markdown.import.parsedCount`, etc.) are reused as-is.

## 11. Testing

Aim for focused tests, not exhaustive ones. Reuse the project's existing test infra.

- `ImportSection` (integration): drop two files → both parse → edit `title` on the second → submit → `importMarkdown` is called with the edited title in the payload.
- `DropZone`: drop one `.md` and one `.txt` → only the `.md` lands; rejection toast fires once.
- `FileQueueList` keyboard: Up/Down moves selection; Enter is a no-op (selection is on focus).
- `ExportAccordion`: opens, toggling a checkbox writes through to `localStorage`; reload (re-mount) restores the same config.
- `ParsedPreviewPane`: missing `title` blocks submit; `aria-invalid` set; toast count reflects.

Visual regression / Playwright is not in scope here.

## 12. Migration

- Delete `Metric.tsx` and `SectionHeader.tsx` from `features/markdown/components/` once their references are gone.
- The route entry (`apps/admin/src/views/(assets)/markdown/page.tsx`) is unchanged in surface; only the inner component tree is replaced.
- The API surface (`importMarkdown`, `exportMarkdown`) is unchanged.
- `MarkdownRouteView.tsx` becomes a thin re-export of `MarkdownRouteViewContent` (already is).

## 13. Risks & open questions

- **Slug regenerator helper** — none currently lives in `features/markdown/utils`. Either reuse a slug helper from elsewhere in the codebase or add a small one (lowercase, hyphenate, strip non-ASCII). Decision deferred to implementation; pick the lightest option.
- **`MarkdownRender` styling inside a scroll container** — `apps/admin/src/ui/primitives/markdown-render.tsx` is already used in drafts; confirm it has no implicit `height: 100%` assumptions before wrapping it in a `max-h-[50vh]` scroller. If it does, add an outer wrapper rather than overriding internals.
- **Append behavior on duplicate filenames inside the same drop** — if the user drags `foo.md` and `foo.md` (same name, different paths) in one drop, the second is skipped silently within that drop. We toast once with the count, not once per duplicate.
