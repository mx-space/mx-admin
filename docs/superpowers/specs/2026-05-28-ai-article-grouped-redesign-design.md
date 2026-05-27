# /ai/* Article-Grouped Pages Layout Redesign

**Date:** 2026-05-28
**Status:** Draft v2
**Scope:** `apps/admin/src/views/(system)/ai/{summary,translation,insights}/page.tsx`, `apps/admin/src/features/ai/` (shared article-grouped components, route views, and config), `apps/admin/src/ui/feedback/drawer.tsx` (reused), `apps/admin/src/ui/layout/page-layout.tsx` (small additive change). Tasks, translation-entries, and slug-backfill are **out of scope** (see §3).

## 1. Background

`/ai/*` consists of six routes today. All share a wrapper, `AiRouteViewContent`, that renders a `PageHeader` whose `actions` slot holds six tab buttons mirroring the sidebar. Below the wrapper, three of the six routes — **summary**, **translation**, **insights** — render `AiGroupedResourceSurface`, a single generic component instantiated by `SummariesSurface`, `TranslationsSurface`, `InsightsSurface`. The generic surface is article-grouped: a paged list of articles on the left, an article's items (summaries / translations / insights) on the right.

The generic surface re-implements its own list-pane header strip (title + count + search + refresh + per-surface action), competing with the page header above it. List rows expose raw article ids (meaningless to the user) and a colored "SmallBadge" for ref type that does not match the project's neutral palette. Detail items are shown as bordered cards with all action buttons always visible. Editing goes through `window.prompt` (summary, insights) or simple inline replacement (translation). The other three routes (tasks, translation-entries, slug-backfill) have their own bespoke shapes and are intentionally deferred.

Violations of the project's `admin-page-layout` convention on the three article-grouped routes:

- Top-level tabs as the structural navigator (the convention bans this; the sidebar already enumerates the routes).
- A "list-pane header" that duplicates information the `PageHeader` should own.
- A row layout (with id and color badge) and a detail layout (bordered cards, always-visible buttons) that look noticeably busier than comparable surfaces (drafts, comments, topics) following the convention.
- `window.prompt` editing — works, but is incongruous with the rest of the admin.

## 2. Goals

1. Drop the `AiRouteViewContent` wrapper from the summary, translation, and insights routes. Each route becomes a self-contained page rendering its own `AppPage` + `PageHeader` + `MasterDetailLayout`. (Other routes remain on the wrapper until their own follow-ups.)
2. Lift the list-pane "header strip" (search / refresh / per-surface action) into the page-level `PageHeader`, leaving the list pane focused on rows.
3. Restyle list rows after `master`'s `SummaryList`/`TranslationList`/`InsightsList`: type icon + title on row 1, neutral type badge + "N 条" on row 2. **Drop the raw article id.** Type badge uses subtle neutral tokens — no border, no accent color.
4. Restyle the detail pane after `master`'s `*DetailPanel`: article title link → divider → "{N} 条" section heading → item rows with hover-revealed delete and click-to-edit.
5. Replace `window.prompt` editing with a right-side slide-over `Drawer`. Drawer body composition varies per surface (summary = single textarea; insights = single textarea; translation = multi-field form). See §4.6.
6. Wire `FocusScope` + `useListKeyboard` at both list layers per route (outer article list, inner items list), matching the keyboard contract used by drafts/comments/topics.
7. Replace `CompactPagination` with infinite scroll (load-more on near-bottom), matching the `master` behavior. Debounce search by 300ms.
8. Express the shared shape once: a generic `ArticleGroupedRouteView<TItem>` consumes a per-surface `config`. Each of the three routes is a thin wrapper around `ArticleGroupedRouteView`.

## 3. Non-Goals

- Migrating the other three `/ai/*` routes (tasks, translation-entries, slug-backfill). They are deferred to a separate spec. The `AiRouteViewContent` wrapper, `AiGroupedResourceSurface`, `SummariesSurface`, `TranslationsSurface`, `InsightsSurface`, and friends are left untouched physically but **no longer referenced** by summary/translation/insights after this work.
- Backend API changes. Existing `getSummariesGrouped`, `getTranslationsGrouped`, `getInsightsGrouped`, `getSummaryByRef`, `getTranslationsByRef`, `getInsightsByRef`, plus per-surface task / update / delete endpoints, are reused as-is.
- Article editor / preview redesign. The "article title" link in the detail pane navigates to the existing article edit routes.
- Cross-page select-all, batch operations on items, command palette.
- Replacing `Drawer` with a nested split layout. Drawer is the chosen edit UX; nested split is explicitly rejected.
- Visual / theme overhaul. The page uses existing `~/ui/primitives/*` and Tailwind tokens.
- Deleting `AiGroupedResourceSurface` and friends in this PR — they remain dead code until the follow-up retires them.

## 4. Architecture

### 4.1 Route shape

Three routes, three thin wrappers, one shared engine:

```
apps/admin/src/views/(system)/ai/summary/page.tsx
└─ default export → features/ai/routes/AiSummaryRouteView          (new)

apps/admin/src/views/(system)/ai/translation/page.tsx
└─ default export → features/ai/routes/AiTranslationRouteView      (new)

apps/admin/src/views/(system)/ai/insights/page.tsx
└─ default export → features/ai/routes/AiInsightsRouteView         (new)
```

Each wrapper instantiates the shared `ArticleGroupedRouteView<TItem>` with a per-surface `config`. The wrappers own only:

- The TS type parameter (`AISummary` / `AITranslation` / `AIInsights`).
- Imports of the API functions for their surface.
- The `config` object literal.

### 4.2 New component layout

```
apps/admin/src/features/ai/
├─ routes/
│  ├─ AiSummaryRouteView.tsx               [NEW] thin wrapper
│  ├─ AiTranslationRouteView.tsx           [NEW] thin wrapper
│  └─ AiInsightsRouteView.tsx              [NEW] thin wrapper
├─ components/
│  ├─ article-grouped/
│  │  ├─ ArticleGroupedRouteView.tsx       [NEW] page-level composition; owns query/state/url-sync
│  │  ├─ ArticleListPane.tsx               [NEW] borderless search + scrollable rows + infinite scroll
│  │  ├─ ArticleListRow.tsx                [NEW] ListRow consumer; icon + title + neutral badge + count
│  │  ├─ ArticleDetailPane.tsx             [NEW] article header link + "N 条" + item rows
│  │  ├─ ItemRow.tsx                       [NEW] inner row; ListRow consumer; lang badge + date + preview + hover delete
│  │  ├─ ArticleDetailEmptyState.tsx       [NEW] icon + "选择一篇文章"
│  │  ├─ refTypeMeta.ts                    [NEW] icon + labelKey + edit-route map
│  │  └─ types.ts                          [NEW] ArticleGroupedConfig<TItem>
│  └─ (existing AiRouteView / AiRouteViewContent / AiGroupedResourceSurface / SummariesSurface / TranslationsSurface / InsightsSurface)
│                                          unchanged for this spec; deleted later
└─ utils/ai.ts                             existing helpers (formatDateString, etc.) reused
```

### 4.3 The `ArticleGroupedConfig` contract

```ts
// features/ai/components/article-grouped/types.ts
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ArticleInfo, PaginationInfo } from '~/api/ai'
import type { HeaderAction } from '~/ui/layout/page-layout'
import type { TranslationKey } from '~/i18n/types'

export interface ArticleGroup<TItem> {
  article: ArticleInfo
  items: TItem[]
}

export interface ItemAction<TItem> {
  id: string                  // for menu/keyboard registry
  labelKey: TranslationKey
  icon?: LucideIcon
  destructive?: boolean
  run: (item: TItem) => Promise<unknown>
  confirm?: { messageKey: TranslationKey }
}

export interface ArticleGroupedConfig<TItem> {
  // scope/i18n
  scopeIdPrefix: string                          // e.g. 'ai-summary'
  pageTitleKey: TranslationKey                   // 'routes.aiSummary.title'
  totalCountKey: TranslationKey                  // 'ai.articleGrouped.totalCount'
  itemCountKey: TranslationKey                   // 'ai.articleGrouped.itemCount'
  searchPlaceholderKey: TranslationKey           // 'ai.summary.searchPlaceholder'
  emptyTitleKey: TranslationKey
  emptyDescriptionKey: TranslationKey
  detailEmptyTitleKey: TranslationKey
  detailEmptyDescriptionKey: TranslationKey
  inlineEmptyKey: TranslationKey                 // detail "暂无 X" when article has 0 items
  itemDeleteConfirmKey: TranslationKey

  // data
  groupedQueryKey: string                                                            // 'summaries' | 'translations' | 'insights'
  getGroupedPage: (params: { page: number; search?: string; size: number })
    => Promise<{ data: ArticleGroup<TItem>[]; pagination: PaginationInfo }>
  getItemsByRef: (refId: string)
    => Promise<{ article: { document: { title: string }; type: ArticleInfo['type'] } | null; items: TItem[] }>
  deleteItem: (id: string) => Promise<unknown>

  // generate
  generate: {
    labelKey: TranslationKey
    icon: LucideIcon
    /** When the surface needs a lang prompt, return a node rendered inside the drawer */
    promptForLang?: boolean                         // summary, translation: true; insights: false
    runTask: (input: { refId: string; lang?: string })
      => Promise<{ created: boolean; taskId: string }>
    taskTypeForQueue: 'Summary' | 'Translation' | 'Insights'
  }

  // page-level extra action (above PageHeader actions). e.g. "Translate All"
  pageActions?: (ctx: { invalidate: () => Promise<void> }) => HeaderAction[]

  // per-item action set surfaced via right-click menu + keyboard (Backspace = delete; Enter = open edit)
  extraItemActions?: (item: TItem) => ItemAction<TItem>[]

  // item preview text (for list row collapsed view) — single string
  getPreview: (item: TItem) => string

  // item lang (for badge)
  getLang: (item: TItem) => string
  getCreatedAt: (item: TItem) => string
  getId: (item: TItem) => string

  // drawer body — owns the field composition (textarea / multi-field / etc.)
  EditDrawerBody: React.ComponentType<{
    item: TItem
    onSubmit: (next: TItem) => Promise<void>
    onCancel: () => void
    submitting: boolean
  }>
}
```

Per-route wrappers supply this config. The shared `ArticleGroupedRouteView<TItem>` consumes it and owns query / state / URL sync.

### 4.4 PageHeader contract

`ArticleGroupedRouteView` renders:

```tsx
<AppPage>
  <PageHeader
    title={t(config.pageTitleKey)}
    description={
      total > 0
        ? t(config.totalCountKey, { count: total })
        : undefined
    }
    actions={[
      ...(config.pageActions?.({ invalidate }) ?? []),
      {
        kind: 'button',
        iconOnly: true,
        icon: RefreshCw,
        label: t('common.refresh'),
        onClick: refetch,
        disabled: isFetching,
      },
    ]}
  />
  <MasterDetailLayout ... />
</AppPage>
```

- Refresh is always the rightmost action, icon-only on desktop.
- `pageActions` is where translation injects its "Translate All" button.
- Description holds the cross-article total (e.g. "12 篇文章 · 共 38 条"). For the v1 we render the cheaper "N 条" only; multi-fact descriptions can come later.

### 4.5 List pane

```tsx
<MasterDetailLayout
  list={<ArticleListPane ... />}
  detail={selectedArticleId ? <ArticleDetailPane ... /> : <ArticleDetailEmptyState ... />}
  showDetailOnMobile={Boolean(selectedArticleId)}
/>
```

`ArticleListPane`:

- Outer container: `<FocusScope id={`${config.scopeIdPrefix}-articles`} className="flex h-full min-h-0 flex-col">`.
- Top strip (`h-12 border-b border-neutral-200`): a borderless search input. Implementation choice: a thin `BorderlessSearchInput` wrapper around `<input>` inside the file, with `Search` icon prefix (`size-4 text-neutral-400`). 300ms debounce before driving the query.
- Below: scroll region (`<Scroll className="flex-1">`). Inside:
  - `ArticleListRow` per article. Rows render via `ListRow` so they participate in the `FocusScope`'s keyboard nav.
  - Near-bottom `IntersectionObserver` triggers `fetchNextPage()` when `hasNextPage`. No `<CompactPagination />`.
  - Loader spinner while next page loads (`Loader2 size-4 mx-auto py-3`).
- Empty states:
  - No results + no search: large `Inbox` icon, `config.emptyTitleKey` + `config.emptyDescriptionKey`.
  - No results + active search: same icon, "没有找到匹配的文章" + "试试其他关键词" (shared keys).
- Selection state is owned by `ArticleGroupedRouteView` (`selectedArticleId`); the list calls `onSelect(article)`.

`ArticleListRow`:

- `ListRow` props:
  - `as="article"`, `role="row"`, `ariaCurrent={isDetailTarget}`, `dataId={article.id}`.
  - `onSelect` opens detail (also wired via `useListKeyboard`'s `actions: [{ id: 'open', key: 'Enter', run: ... }]`).
  - `menuItems`: omitted for now.
- Visual:
  ```
  [type-icon size-4 text-neutral-400] [title (truncate text-sm font-medium)]
  pl-6 mt-1.5 [type-badge] [{N} 条]
  ```
  - `type-badge` = `<span class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{label}</span>`. No border, no color tone.
  - `{N} 条` = `text-xs text-neutral-400`, key = `config.itemCountKey` (variants below).
- **No** raw article id rendered. **No** generate-task button on the row.

`refTypeMeta`:

```ts
import { FileText, StickyNote } from 'lucide-react'

export const refTypeMeta = {
  Post:     { icon: FileText,   labelKey: 'ai.refType.post',     editPath: (id: string) => `/posts/edit?id=${id}` },
  Note:     { icon: StickyNote, labelKey: 'ai.refType.note',     editPath: (id: string) => `/notes/edit?id=${id}` },
  Page:     { icon: FileText,   labelKey: 'ai.refType.page',     editPath: (id: string) => `/pages/edit?id=${id}` },
  Recently: { icon: FileText,   labelKey: 'ai.refType.recently', editPath: null },
} as const
```

`Recently` has no edit route in the React app; the detail header renders the title as a non-link `<div>` for that type.

### 4.6 Detail pane

`ArticleDetailPane` (rendered when `selectedArticleId` is non-null):

```
┌───────────────────────────────────────────────────────┐
│  {sectionTitle}                  [+ {generateLabel}]  │   h-12, border-b
├───────────────────────────────────────────────────────┤
│  [type-icon] [article title (Link)]                   │   p-4
│  ───────────────────────                              │   divider
│  {sectionTitle} ({N})                                 │   text-sm font-medium
│  ──── row ────                                        │
│  [lang-badge] [📅 MM-dd HH:mm]            [🗑 hover]  │
│  Preview text… (line-clamp-2)                         │
│  ──── row ────                                        │
│  …                                                    │
└───────────────────────────────────────────────────────┘
```

- Outer wrapper: `<FocusScope id={`${config.scopeIdPrefix}-items`} className="flex h-full min-h-0 flex-col">`.
- Header strip (`h-12 border-b`):
  - Left: mobile-only back button (`ArrowLeft size-8`) + section label (`t(config.detailSectionTitleKey)` — "摘要详情" / "翻译详情" / "精读详情").
  - Right: primary generate button. Label from `config.generate.labelKey`, icon from `config.generate.icon` (`Plus` is the default). Clicking opens the **same `Drawer`** in "generate" mode (see §4.7) — not a separate dialog.
- Body (`<Scroll className="flex-1">`, `p-4`):
  - Article header: `<Link to={refTypeMeta[type].editPath(articleId)}>` containing type-icon (`size-5 text-neutral-400`) + title (`text-base font-semibold`, hover `text-blue-600 dark:text-blue-400`). For `Recently`, render the composition as a plain `<div>`.
  - `h-px bg-neutral-100 dark:bg-neutral-800 my-4` divider.
  - "{sectionTitle} ({N})" heading: `text-sm font-medium text-neutral-700`, with `N` in `text-xs text-neutral-400`.
  - Items section, rendered with `-mx-4` to bleed to pane edges; rows separated by `border-b border-neutral-100`. Each row is an `ItemRow`.
  - When the article has zero items: `<InlineEmpty>` with `config.inlineEmptyKey` + secondary generate button.

`ItemRow`:

- `ListRow` (so it joins the `${config.scopeIdPrefix}-items` FocusScope keyboard nav).
- `dataId={config.getId(item)}`, `onSelect` → opens edit drawer.
- Actions wired via `useListKeyboard`:
  - `openEdit` (Enter, also default `onSelect` activation) → set `editingItemId`.
  - `deleteItem` (Backspace, with confirm via the imperative confirm modal) → `config.deleteItem(id)`.
  - Plus any entries from `config.extraItemActions(item)` — surfaced in right-click menu only (no extra keyboard shortcuts in v1 to avoid clashes).
- Visual:
  - Top line: lang badge (`rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 px-2 py-0.5 text-xs font-medium`, value = `config.getLang(item).toUpperCase()`) + date (`text-xs text-neutral-400` with `Calendar size-3` prefix, `safeFormat 'MM-dd HH:mm'`).
  - Right edge of top line: trash icon (`size-3.5`) inside a `size-7` rounded button. Hidden by default (`opacity-0`), revealed on `group-hover` and when the row has `data-focused`/`data-selected`. Click stops propagation and triggers the delete action via the confirm modal.
  - Bottom line: `line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300` of `config.getPreview(item)`.

`ArticleDetailEmptyState`:

- Centered. `size-16 rounded-full bg-neutral-100 dark:bg-neutral-800` container with `config.detailEmptyIcon` (defaults to `Sparkles size-8 text-neutral-400`).
- `text-base font-medium text-neutral-900` from `config.detailEmptyTitleKey`.
- `text-sm text-neutral-500` from `config.detailEmptyDescriptionKey`.

### 4.7 Edit drawer

A single `<Drawer>` instance is shared for both **edit** and **generate** flows:

- **Edit mode:** `open = editingItemId !== null`. Drawer body = `<config.EditDrawerBody item={…} ... />`.
- **Generate mode:** `open = generating === true`. Drawer body = a small `<GeneratePromptBody>` that:
  - When `config.generate.promptForLang` is `true`: renders a `<TextInput>` for the target language code (default `'zh'`). On submit, calls `config.generate.runTask({ refId, lang })`.
  - Otherwise: renders only a short description and the primary "Generate" button. Calls `config.generate.runTask({ refId })`.
  - Either way, on success `useAiTaskQueue.trackTask({...})` registers a task subscription so the queue toast surfaces progress.

The drawer's chrome (title, header actions, body container, footer) lives in `ArticleGroupedRouteView`; the per-surface variation is only the `EditDrawerBody` component. The three concrete bodies:

**`SummaryEditBody`** — single textarea.
- Layout: "摘要内容" label → `<textarea rows={8}>` → "预览" label → read-only preview pane → "元信息" block.
- Submit: `aiApi.updateSummary(item.id, { summary })`.

**`InsightsEditBody`** — single textarea.
- Layout: "精读内容" label → `<textarea rows={10}>` → "预览" (rendered through `MarkdownRender` — insights is markdown today) → "元信息" block, including the `isTranslation` boolean and `sourceLang` if applicable.
- Submit: `aiApi.updateInsights(item.id, { content })`.

**`TranslationEditBody`** — multi-field form.
- Layout, top-to-bottom:
  - "标题" → `<TextInput>` bound to `title`
  - "副标题" → `<TextInput>` bound to `subtitle`
  - "摘要" → `<textarea rows={3}>` bound to `summary`
  - "正文" → `<textarea rows={10}>` bound to `text` (Markdown plaintext for v1; rich editor migration deferred — see §11)
  - "元信息" block, including `lang`, `sourceLang`, `aiProvider`, `aiModel`, `createdAt`.
- Submit: `aiApi.updateTranslation(item.id, { title, subtitle, summary, text })`. Fields are sent only when changed.

Drawer chrome:
- `side="right"`, `widthClassName="w-[min(90vw,32rem)]"` (≈ 512px). Translation needs more room than summary/insights but the difference isn't large; one width fits all.
- `title`:
  - Edit mode: `t(config.editTitleKey)` + small lang sub-label.
  - Generate mode: `t(config.generate.labelKey)`.
- `headerActions`: Cancel (subtle) + Save/Generate (primary, disabled while submitting). Drawer's built-in close (X) is kept.
- Keyboard: Esc closes (`Drawer` builtin); `⌘+Enter` triggers submit when focus is inside the body.

On submit success, invalidate `['ai', config.groupedQueryKey]` and `['ai', `${groupedQueryKey}-by-ref`, refId]`. On error, keep the drawer open and `sonner.error` the message.

### 4.8 PageHeader: icon-only action variant

`PageHeader` today (in `apps/admin/src/ui/layout/page-layout.tsx`) supports two action `kind`s: `button` (label + icon) and `custom` (raw node). For refresh-style affordances we need an icon-only button on desktop that still preserves the accessible label.

**Change:** add optional `iconOnly?: boolean` to the `button` kind. When set:

- Mobile branch: unchanged (already icon-only at `size-9`).
- Desktop branch: render the `size-9` square icon button instead of the labeled `h-9 gap-1.5 px-3` button. Tooltip carries the label via `title={action.label}`.

This avoids forcing each consumer to fall back to `kind: 'custom'` for what is functionally a labeled button.

## 5. Data flow

### 5.1 Query keys and shapes

Per surface, two queries — one infinite list, one per-article detail:

```
Summary
  list:   useInfiniteQuery(['ai', 'summaries',    'grouped',     { search }], getSummariesGrouped)
  detail: useQuery(        ['ai', 'summaries',    'by-ref',  refId],          getSummaryByRef)

Translation
  list:   useInfiniteQuery(['ai', 'translations', 'grouped',     { search }], getTranslationsGrouped)
  detail: useQuery(        ['ai', 'translations', 'by-ref', refId],           getTranslationsByRef)

Insights
  list:   useInfiniteQuery(['ai', 'insights',     'grouped',     { search }], getInsightsGrouped)
  detail: useQuery(        ['ai', 'insights',     'by-ref', refId],           getInsightsByRef)
```

`useInfiniteQuery` shape:

- `queryFn: ({ pageParam = 1 }) => config.getGroupedPage({ page: pageParam, search, size: groupedPageSize })`
- `getNextPageParam: (last) => last.pagination.hasNextPage ? last.pagination.currentPage + 1 : undefined`
- `select: (data) => data.pages.flatMap(p => p.data)` — consumer reads a flat list
- `total = data.pages[0]?.pagination.total ?? 0` — displayed in `PageHeader.description`.

Splitting list from detail avoids stale state when items are added/edited from the drawer; the list query no longer needs to include inline item arrays for the selected article (though the grouped endpoint still returns them; the detail pane just doesn't rely on them).

### 5.2 State ownership

State lives in `ArticleGroupedRouteView`:

```ts
const [searchParams, setSearchParams] = useSearchParams()
const [search, setSearch]                       // debounced 300ms before driving the query
const [selectedArticleId, setSelectedArticleId] // null when none
const [editingItemId, setEditingItemId]         // null when drawer closed
const [generating, setGenerating]               // boolean — Generate drawer open
const [showDetailOnMobile, setShowDetailOnMobile]
```

URL sync (replace-history):

- `?id=<articleId>` ⇔ `selectedArticleId`.
- Opening the drawer (edit or generate) does **not** add to the URL — drawer state is ephemeral.
- `?search=` is **not** synced (matches drafts/comments convention).

### 5.3 Mutations

Per surface, three mutation hooks instantiated inside `ArticleGroupedRouteView`:

| Action          | Mutation fn                                  | Invalidates                                                                     |
|-----------------|----------------------------------------------|---------------------------------------------------------------------------------|
| Generate task   | `config.generate.runTask({ refId, lang? })`  | `['ai', 'tasks']`, `['ai', groupedQueryKey, 'by-ref', refId]`                    |
| Update item     | (provided by `EditDrawerBody.onSubmit`)      | `['ai', groupedQueryKey, 'by-ref', refId]`                                       |
| Delete item     | `config.deleteItem(id)`                      | `['ai', groupedQueryKey, 'by-ref', refId]`, `['ai', groupedQueryKey]` (list)     |

Task-queue tracking (`useAiTaskQueue`) wires the create-task progress as today, with `type: config.generate.taskTypeForQueue`.

`extraItemActions` (per-surface) — invoked from the right-click menu. Each is wrapped in a generic `useMutation` whose `onSuccess` calls `queryClient.invalidateQueries({ queryKey: ['ai'] })` to be safe (action handlers may touch tasks, items, or both). v1 surfaces:

- **Translation:** `retranslate` — `aiApi.createTranslationTask({ refId, targetLanguages: [lang] })`.
- **Insights:** `translate` (asks for target lang via an inline mini-prompt inside the menu's submit; if non-trivial, fall back to opening the generate drawer with a prefilled lang field), `retranslate` / `regenerate` depending on `isTranslation`.

For v1 to keep behavior parity with master, "translate" on insights opens the generate drawer with a lang text field (consistent with how summary's "generate" works). The `window.prompt` flavor from the current React surface is dropped.

## 6. FocusScope keyboard contract

Two scopes per route, both bound via `useListKeyboard`:

### 6.1 `{scopeIdPrefix}-articles` (outer list)

```ts
useListKeyboard<ArticleInfo>({
  scopeId: `${config.scopeIdPrefix}-articles`,
  items: articles,
  getId: (a) => a.id,
  resetOn: [search],
  actions: [
    { id: 'open', key: 'Enter', run: (a) => setSelectedArticleId(a.id) },
  ],
})
```

- `j` / `k` / `↑` / `↓` / `Home` / `End` for focus traversal.
- `Enter` opens the detail.
- No `Backspace` (articles are not deleted).
- No multi-select / checkbox in v1.

### 6.2 `{scopeIdPrefix}-items` (inner items list)

```ts
useListKeyboard<TItem>({
  scopeId: `${config.scopeIdPrefix}-items`,
  items,
  getId: config.getId,
  resetOn: [selectedArticleId],
  actions: [
    { id: 'edit',   key: 'Enter',     run: (it) => setEditingItemId(config.getId(it)) },
    { id: 'delete', key: 'Backspace', run: (it) => confirmAndDelete(it) },
    ...(config.extraItemActions?.(item) ?? []).map(/* not bound to keys in v1 */),
  ],
})
```

- Pointer-down inside the detail pane switches the active scope to `*-items`; clicking back switches back. Standard `FocusScope` semantics.
- `Backspace` calls the imperative confirm modal and then the delete mutation.
- Right-click context menu surfaces `delete` + `extraItemActions` via `buildMenuItemsFromActions`.

### 6.3 Drawer scope

The drawer does **not** create a focus scope. Its existing `Drawer` already traps focus and handles Esc.

## 7. i18n

Shared keys (under `ai.articleGrouped`):

```
ai.articleGrouped.totalCount       "{count} 条"
ai.articleGrouped.itemCount        "{count} 条"
ai.articleGrouped.emptyTitle       "暂无 AI {kind}"          // {kind} from per-surface key
ai.articleGrouped.searchEmptyTitle "没有找到匹配的文章"
ai.articleGrouped.searchEmptyHint  "试试其他关键词"
ai.articleGrouped.inlineEmpty      "暂无 {kind}"
ai.articleGrouped.confirmDelete    "确定要删除这条 {kind} 吗？"
ai.refType.post                    "文章"
ai.refType.note                    "笔记"
ai.refType.page                    "页面"
ai.refType.recently                "速记"
common.refresh                     "刷新"
```

Per-surface keys:

```
# summary
ai.summary.pageTitle               (= routes.aiSummary.title, reuse)
ai.summary.detailSectionTitle      "摘要详情"
ai.summary.listSectionTitle        "摘要列表"
ai.summary.searchPlaceholder       "输入文章标题关键词"
ai.summary.editTitle               "编辑摘要"
ai.summary.generateLabel           "生成摘要"
ai.summary.emptyTitle              "选择一篇文章"
ai.summary.emptyDescription        "从左侧列表选择文章查看 AI 摘要"
ai.summary.editLabel.content       "摘要内容"
ai.summary.editLabel.preview       "预览"
ai.summary.editLabel.meta          "元信息"

# translation  (analogous keys: pageTitle, detailSectionTitle, listSectionTitle,
                searchPlaceholder, editTitle, generateLabel, emptyTitle,
                emptyDescription, plus edit labels for title/subtitle/summary/text/meta)

# insights    (analogous keys: pageTitle, detailSectionTitle, listSectionTitle,
                searchPlaceholder, editTitle, generateLabel, emptyTitle,
                emptyDescription, edit labels for content/preview/meta)

# task-queue toast keys, refType keys, ai.action.* keys — reused from existing resources.
```

The existing `ai.surface.*`, `ai.grouped.*`, `ai.page.*`, `ai.empty.itemSelect`, etc. keys remain consumed by the not-yet-migrated `/ai/*` routes (tasks, entries, slug) and stay in the resource file until those routes migrate.

## 8. Accessibility

- All rows participate via `ListRow`, which sets `role="row"`, `aria-selected`, `aria-current`, and keyboard activation per the focus-scope spec.
- Trash button on item rows has `aria-label={t('ai.action.delete')}` and is reachable via Tab inside the row. Hover-only visibility does not affect focus-visible visibility.
- `Drawer` already provides `role="dialog"`, `aria-modal`, focus trap, Esc to close, and labelled-by from the title.
- Refresh button: when fetching, set `aria-busy="true"` and `disabled`. Spin animation is decorative; busy state exposed via aria.
- Mobile back button in the detail header gets `aria-label={t('common.back')}`.
- The borderless search input gets an explicit `aria-label={t(config.searchPlaceholderKey)}` since the visual label is absent.

## 9. Visual tokens

- All grays use `neutral` (project rule).
- Type badge in list row: `bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400` — no border, no accent color.
- Lang badge in item row: `bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 rounded-full px-2 py-0.5 text-xs font-medium` (carry-over from master; the page's only accent).
- Article title link hover: `text-blue-600 dark:text-blue-400`.
- Selected row: `data-selected:bg-neutral-100 dark:data-selected:bg-neutral-800/60` (matches `DraftRow`).
- Header heights: page header / list-pane search strip / detail-pane header all `h-12` (= `APP_SHELL_HEADER_HEIGHT_CLASS`).

## 10. Implementation plan

Single-shot implementation. All three routes migrated together, no incremental PR split.

Order of work:

1. **Foundations**
   - Add `iconOnly` flag to `PageHeader`'s `kind: 'button'` action (`apps/admin/src/ui/layout/page-layout.tsx`); update its tests.
   - Add files under `features/ai/components/article-grouped/`: `types.ts`, `ArticleGroupedRouteView.tsx`, `ArticleListPane.tsx`, `ArticleListRow.tsx`, `ArticleDetailPane.tsx`, `ItemRow.tsx`, `ArticleDetailEmptyState.tsx`, `refTypeMeta.ts`, `BorderlessSearchInput.tsx`.
2. **Per-surface bodies and route views**
   - `features/ai/routes/AiSummaryRouteView.tsx` + `SummaryEditBody.tsx`.
   - `features/ai/routes/AiTranslationRouteView.tsx` + `TranslationEditBody.tsx` (with `config.pageActions` for "Translate All").
   - `features/ai/routes/AiInsightsRouteView.tsx` + `InsightsEditBody.tsx` (with `extraItemActions` for translate/retranslate/regenerate, reusing the generate drawer for the lang-prompt translate action).
3. **i18n keys** added to `apps/admin/src/i18n/resources/zh-CN.ts` and `en-US.ts` for the three surfaces and the shared `ai.articleGrouped.*` / `ai.refType.*` / `common.refresh` groups.
4. **Route swaps**: change the default exports of `views/(system)/ai/{summary,translation,insights}/page.tsx` to the three new route views.
5. **Cleanup of dead code in the same change**: delete `AiRouteView`, `AiRouteViewContent`, `AiGroupedResourceSurface`, `SummariesSurface`, `TranslationsSurface`, `InsightsSurface`, and any helpers that only those files used (`features/ai/constants.ts` entries for `aiSurfaceTabs`, `getInitialAiSurface`, etc.) **only if** the remaining `/ai/*` routes (tasks, translation-entries, slug-backfill) no longer reference them. If those routes still depend on `AiRouteViewContent` / its tab bar, leave that file in place for the follow-up spec to retire.
6. **Checks** (scoped to changed files only, per project convention):
   - `pnpm -C apps/admin exec tsc --noEmit --pretty false`
   - `pnpm -C apps/admin lint` on the touched files
   - Manual smoke: open each of `/ai/summary`, `/ai/translation`, `/ai/insights`; exercise search debounce, infinite scroll, article-select, item-select, edit drawer save, delete with confirm, generate drawer (with and without lang prompt), translation "Translate All", insights "translate" action, mobile back, j/k/Enter/Backspace keyboard.

A follow-up spec — out of scope for this work — migrates the remaining `/ai/*` routes (tasks, translation-entries, slug-backfill) to their own layouts and finishes retiring the wrapper.

## 11. Risks and open questions

- **Risk: detail re-fetch latency.** Splitting list from detail adds one request per article selection. Mitigation: react-query caches per-ref results; the grouped list already returns inline items, so we can prime the per-ref cache when selecting from the list (`queryClient.setQueryData(['ai', groupedQueryKey, 'by-ref', refId], { article, items })` if the grouped response carries them). Spec marks this as an optimization, not a requirement.
- **Risk: borderless `TextInput` styling.** `TextInput` has border tokens baked in. Choice in this spec: ship a small purpose-built `BorderlessSearchInput` in `article-grouped/` rather than fighting overrides.
- **Risk: translation edit drawer field richness.** Today translation items can include `content` (a rich Lexical state) and `contentFormat`. v1 only edits the flat `text` field via textarea. Rich-editor parity is deferred — out of scope; flagged here so the follow-up has context. Saving via this drawer never modifies `content`.
- **Risk: insights `translate` action UX.** Master uses a separate dialog with `NSelect`; current React uses `window.prompt`. v1 reuses the generate drawer with a lang text input. If lang input feels too unrestricted, the follow-up replaces it with a select tied to a project lang list.
- **Open: do we surface a "Cancel running task" affordance on the article header when a task for that article is in-flight?** Today the global task queue handles cancellation; v1 inherits that and does not add per-article cancel.
- **Open: should `?search=` persist in the URL?** Drafts doesn't, comments doesn't. v1 follows the convention. Reopen if the user wants share-links.
- **Open: deletion of articles vs items.** The convention `admin-page-layout` says list selection mutations should reset cleanly; the spec uses `useListKeyboard`'s `resetOn` to satisfy this. No article-level deletion is offered (no API for it on these surfaces).
