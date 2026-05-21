# List Filter/Sort Bar 设计

**Status**: design · approved 2026-05-11
**Scope**: 于 `TwoColLayout` 之 list 列上方加 Linear 式 filter/sort 子头栏；抽 `ColumnHeader` 共用 primitive；`PostHeader` 改用之；Posts 视图首接此 bar，含 filter chip + filter popover + sort/display popover。
**Owners**: TBD（执行时填）

---

## 1 · 目标与决定

### 1.1 用户故事

- 用户：于 posts 列表上方一望即见现活筛选；点漏斗以筛、点 sliders 以排
- 开发者：他列表视图（categories、tags、comments 等）皆可挂同 primitive，仅自填 popover 内容

### 1.2 决定（已批）

| 维 | 决定 |
|---|---|
| 范围 | TwoColLayout 通用原语 + Posts 首消费者（同次落地） |
| 与现有全宽 `TwoColLayout.Header` | **并存**——上下叠加。全宽留页标题/actions；列内 sub-bar 仅 filter/sort + chips |
| API 形式 | 纯 slot；`TwoColLayout.ListHeader` 仅作位置容器 |
| 共用 primitive | 抽 `ColumnHeader`；PostHeader 与 ListSubHeader 同用 |
| Filter 字段 | 状态、分类、标签、置顶 |
| Sort/Options 字段 | sortBy + order + grouping + displayProps（Linear 式合一） |
| 持久化 | Jotai `atomWithStorage`（localStorage） |
| 左槽内容（Posts） | 现活 filter 之摘要 chip 列 |
| 右槽 | 二 IconButton：Funnel（filter）、SlidersHorizontal（sort/options） |
| 高度 | `chrome.headerHeight`（44px）——与 PostHeader / 全宽 Header 共基线 |

---

## 2 · 文件骨架

```
src/components/ui/ColumnHeader/
├── ColumnHeader.tsx              // compound：Root / Left / Center / Right / IconButton / Divider
├── ColumnHeader.css.ts
└── index.ts

src/layouts/TwoColLayout/
├── index.tsx                     // 加 ListHeader slot；listPaneStyle 改 column flex
└── TwoColLayout.css.ts

src/layouts/pages.tsx             // TwoColPage 加 listHeader prop

src/components/post-detail/header/
├── PostHeader.tsx                // 内部改用 ColumnHeader；外 props 不变
└── PostHeader.css.ts             // 删 root/slot/iconButton/divider；留业务专属

src/pages/posts/view/list/
├── ListSubHeader.tsx             // 组合 ColumnHeader + 二 popover + chips
├── FilterPopover.tsx             // 状态/分类/标签/置顶
├── SortPopover.tsx               // sortBy / order / grouping / displayProps
├── FilterChips.tsx               // 左槽派生 chip 列
├── ListSubHeader.css.ts
└── ListSubHeader.test.tsx        // popover 开关 / chip 加减 / reset

src/atoms/posts.ts                // 加 postsListFilterAtom + postsListSortAtom；display 中 showDrafts 弃，迁移至 filter.status

src/api/posts.ts                  // GetPostsParams 扩 status / tagIds / pin

src/components/ui/ColumnHeader/ColumnHeader.test.tsx
```

---

## 3 · ColumnHeader Primitive

### 3.1 API

```tsx
import { ColumnHeader } from '~/components/ui/ColumnHeader'

<ColumnHeader size="compact">
  <ColumnHeader.Left>...</ColumnHeader.Left>
  <ColumnHeader.Center>...</ColumnHeader.Center>   {/* 可省 */}
  <ColumnHeader.Right>...</ColumnHeader.Right>
</ColumnHeader>

<ColumnHeader.IconButton size="sm" aria-label="筛选" onClick={...}>
  <Funnel size={16} aria-hidden />
</ColumnHeader.IconButton>

<ColumnHeader.Divider />
```

### 3.2 Props

```ts
type Size = 'compact' | 'spacious'

interface ColumnHeaderProps extends HTMLAttributes<HTMLElement> {
  size?: Size                                       // 默认 'compact'
  children: ReactNode
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md'                                // sm = 28×28，md = 32×32
  'aria-label': string                              // 必
}
```

### 3.3 css.ts 要点（`ColumnHeader.css.ts`）

```ts
import { recipe, style, styleVariants } from '@vanilla-extract/css'

export const rootRecipe = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: chrome.headerHeight,                    // 44px
    borderBottom: `1px solid ${themeContract.color.hairline}`,
    background: themeContract.color.canvas,
    flexShrink: 0,
  },
  variants: {
    size: {
      compact:  { paddingInline: '12px', gap: 4 },
      spacious: { paddingInline: '24px', gap: 8 },
    },
  },
  defaultVariants: { size: 'compact' },
})

export const leftStyle   = style({ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 })
export const centerStyle = style({ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 })
export const rightStyle  = style({ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 })

export const iconButtonRecipe = styleVariants({
  sm: { /* 28×28，hover bg surface2，focus-visible outline primaryFocus */ },
  md: { /* 32×32，同上 */ },
})

export const dividerStyle = style({
  width: 1, height: 16, background: themeContract.color.hairline, flexShrink: 0,
})
```

`iconButtonRecipe` 与 `dividerStyle` 由 `PostHeader.css.ts` 移入。

### 3.4 slot 模式

循 `TwoColLayout` 既有约定：以 `tagSlot` + `findSlot` 标 Left/Center/Right，无须 children 排序：

```tsx
const SLOT_KEY = '__column-header-slot'
type Slot = 'left' | 'center' | 'right'

const tagSlot = <P extends object>(C: ComponentType<P>, slot: Slot) => { ... }
```

### 3.5 测试

`ColumnHeader.test.tsx`：
- 三槽渲染顺序与 className 正确（即便 children 乱序）
- size variant 切换 paddingInline
- IconButton：focus-visible ring、disabled 不响 onClick、aria-label 必

---

## 4 · TwoColLayout 整合

### 4.1 slot

```tsx
// TwoColLayout/index.tsx
const ListHeaderImpl = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cx(listHeaderSlotStyle, className)} {...rest}>{children}</div>
)
const ListHeader = tagSlot(ListHeaderImpl, 'list-header')
```

`listHeaderSlotStyle`：仅 `flex: 'none'`——高与边由内 ColumnHeader 自决。

### 4.2 render

桌面与 mobile 二分支同插：

```tsx
// 桌面 / mobile 共
<div className={listPaneStyle} style={{ width: `${width}px` }}>
  {listHeader}                                // 可省，缺则原貌
  <Scroll>{list}</Scroll>
</div>
```

### 4.3 css 调

`listPaneStyle` 加 `flexDirection: 'column'`：

```ts
export const listPaneStyle = style({
  flex: 'none',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',                    // 新
  borderRight: ...,
  background: ...,
  '@media': { ... },
})
```

`<Scroll>` 既 `flex: 1, minHeight: 0`，自填余空。

### 4.4 TwoColPage prop

`src/layouts/pages.tsx`：

```tsx
interface TwoColPageProps {
  ...
  listHeader?: ReactNode                       // 新
}
{listHeader && <TwoColLayout.ListHeader>{listHeader}</TwoColLayout.ListHeader>}
```

### 4.5 export

`TwoColLayout` compound 加 `ListHeader`；index export 之。

---

## 5 · PostHeader 重构

外 props（`PostHeaderProps`）与 `data-testid` 不变；内部改：

```tsx
return (
  <ColumnHeader
    size={isFull ? 'spacious' : 'compact'}
    data-variant={variant}
    data-testid="post-header"
  >
    <ColumnHeader.Left>
      {isFull && onBack && (
        <ColumnHeader.IconButton size={iconSize} aria-label="返" onClick={onBack} data-testid="back-btn">
          <ArrowLeft size={16} aria-hidden />
        </ColumnHeader.IconButton>
      )}
      {isFull && <Breadcrumb title={title} />}
      {isFull && <DraftBadge ... />}
    </ColumnHeader.Left>

    <ColumnHeader.Center>
      {!isFull && <DraftBadge ... />}
      <SaveIndicator ... />
    </ColumnHeader.Center>

    <ColumnHeader.Right>
      {externalUrl && (isFull
        ? <a className={externalLinkFullStyle} ...>...</a>
        : <ColumnHeader.IconButton size="sm" aria-label="在站点查看" data-testid="external-link" ...>
            <ExternalLink size={16} aria-hidden />
          </ColumnHeader.IconButton>
      )}
      {!isFull && onJumpToFullscreen && (
        <ColumnHeader.IconButton size="sm" aria-label="全屏编辑" data-testid="fullscreen-btn" onClick={onJumpToFullscreen}>
          <Maximize2 size={16} aria-hidden />
        </ColumnHeader.IconButton>
      )}
      {isFull && onOpenHistory && (
        <ColumnHeader.IconButton size="md" aria-label="历史" data-testid="history-btn" onClick={onOpenHistory}>
          <History size={16} aria-hidden />
        </ColumnHeader.IconButton>
      )}
      {isFull && (
        <ColumnHeader.IconButton size="md" aria-label="移至回收站" data-testid="delete-btn-inline" onClick={onDelete}>
          <Trash2 size={16} aria-hidden />
        </ColumnHeader.IconButton>
      )}
      <KebabMenu ... />
      <ColumnHeader.Divider />
      <PublishMenu ... />
    </ColumnHeader.Right>
  </ColumnHeader>
)
```

### 5.1 PostHeader.css.ts 之删与留

| 删（移 ColumnHeader） | 留（业务专属） |
|---|---|
| `rootRecipe` | `externalLinkFullStyle` |
| `leftSlotStyle` / `centerSlotStyle` / `rightSlotRecipe` | `breadcrumbStyle` / `breadcrumbCrumbStyle` / `breadcrumbSepStyle` / `breadcrumbCurrentStyle` |
| `iconButtonRecipe` | `saveIndicatorStyle` / `saveDotRecipe` / `saveHistoryLinkStyle` |
| `dividerStyle` | `draftBadgeCompareBtnStyle` |
|  | `publishMenuRootStyle` / `publishSplitPrimaryStyle` / `publishSplitChevronStyle` / `publishCompactPrimaryStyle` / `publishCompactChevronStyle` |
|  | `menuListStyle` / `menuItemStyle` / `menuItemDangerStyle` / `menuSeparatorStyle` |

### 5.2 兼容

`RightPane.test.tsx` 之断言依 `data-testid` 与 button accessibility，应不受影响。如有 css 类断言，须改之。

---

## 6 · Posts ListSubHeader

### 6.1 atoms（`src/atoms/posts.ts`）

```ts
export type PostsListStatus = 'all' | 'published' | 'draft' | 'hidden'
export type PostsListPin = 'all' | 'pinned' | 'unpinned'
export type PostsListSortBy =
  | 'modifiedAt' | 'createdAt' | 'title' | 'readCount' | 'likeCount' | 'pinOrder'
export type SortOrder = 'asc' | 'desc'

export interface PostsListFilter {
  status: PostsListStatus
  categoryIds: string[]
  tagIds: string[]
  pin: PostsListPin
}
export interface PostsListSort {
  sortBy: PostsListSortBy
  order: SortOrder
}

const FILTER_DEFAULT: PostsListFilter = {
  status: 'all', categoryIds: [], tagIds: [], pin: 'all',
}
const SORT_DEFAULT: PostsListSort = {
  sortBy: 'modifiedAt', order: 'desc',
}

export const postsListFilterAtom = atomWithStorage<PostsListFilter>('posts.list.filter.v1', FILTER_DEFAULT)
export const postsListSortAtom = atomWithStorage<PostsListSort>('posts.list.sort.v1', SORT_DEFAULT)
```

### 6.2 display atom 之迁

`PostsListDisplayState.showDrafts` 删之；初次加载若旧值 `showDrafts === false`，则置 `filter.status = 'published'`、保用户预期。`grouping` / `displayProps` 留原 atom，由 SortPopover 同读写。

迁移以一次性 effect 实之：在 App 之 root 或 Posts 页 mount 时跑、设 `posts.list.display.migrated.v1` 之 flag 防再跑。

### 6.3 API 扩（`src/api/posts.ts`）

```ts
export interface GetPostsParams {
  page?: number
  size?: number
  select?: string
  sortBy?: string
  sortOrder?: number
  categoryIds?: string[]
  tagIds?: string[]                              // 新；后端不支则不入 query
  status?: 'published' | 'draft' | 'hidden'      // 新
  pin?: 'pinned' | 'unpinned'                    // 新
}
```

后端能力未明之字段以 capability flag 控（暂定常量 `BACKEND_CAPS`，TODO：与后端对齐后改 runtime probe）。未支字段：UI 控件 disabled + 工具提示「待后端支持」，filter atom 中该字段非默认时不入 query。

### 6.4 filter / sort 注 query

```ts
// hooks/queries/usePosts.ts
const filter = useAtomValue(postsListFilterAtom)
const sort = useAtomValue(postsListSortAtom)

return useTableQuery({
  key: POSTS_LIST_KEY,
  enabled,
  extraQueryKey: isSearching ? ['search', keyword] : ['list', filter, sort],
  queryFn: async (state) => {
    if (isSearching) { /* 略 */ }
    const params: GetPostsParams = {
      page: state.page,
      size: state.pageSize,
      select: POSTS_LIST_SELECT,
      sortBy: sort.sortBy,
      sortOrder: sort.order === 'asc' ? 1 : -1,
    }
    if (filter.categoryIds.length) params.categoryIds = filter.categoryIds
    if (BACKEND_CAPS.tagIds && filter.tagIds.length) params.tagIds = filter.tagIds
    if (BACKEND_CAPS.status && filter.status !== 'all') params.status = filter.status
    if (BACKEND_CAPS.pin && filter.pin !== 'all') params.pin = filter.pin
    const res = (await postsApi.getList(params)) as PaginateResult<PostModel>
    return { data: res.data, total: res.pagination.total }
  },
})
```

`buildListParams` 既有版可删，逻辑并入 `queryFn`。`extraQueryKey` 含 filter / sort 以触 cache 更替。

### 6.5 ListSubHeader

```tsx
// src/pages/posts/view/list/ListSubHeader.tsx
export const ListSubHeader = () => {
  const filter = useAtomValue(postsListFilterAtom)
  const sort = useAtomValue(postsListSortAtom)
  const hasFilter = !isFilterDefault(filter)
  const hasCustomSort = !isSortDefault(sort)

  return (
    <ColumnHeader>
      <ColumnHeader.Left><FilterChips /></ColumnHeader.Left>
      <ColumnHeader.Right>
        <Popover.Root>
          <Popover.Trigger render={
            <ColumnHeader.IconButton size="sm" aria-label="筛选" data-active={hasFilter} data-testid="filter-trigger">
              <Funnel size={16} aria-hidden />
            </ColumnHeader.IconButton>
          } />
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={popupStyle}><FilterPopover /></Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>

        <Popover.Root>
          <Popover.Trigger render={
            <ColumnHeader.IconButton size="sm" aria-label="显示选项" data-active={hasCustomSort} data-testid="sort-trigger">
              <SlidersHorizontal size={16} aria-hidden />
            </ColumnHeader.IconButton>
          } />
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={popupStyle}><SortPopover /></Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </ColumnHeader.Right>
    </ColumnHeader>
  )
}
```

### 6.6 FilterPopover

栏目（节段以 hairline 分）：

1. **状态**：四按钮组（all/published/draft/hidden）单选；点之即写 atom
2. **分类**：`<Combobox multiple>`，源 `useCategoryList`
3. **标签**：`<Combobox multiple freeSolo>`（自由输入；若 BACKEND_CAPS.tagIds 假，则 disabled + tooltip）
4. **置顶**：三按钮组（all/pinned/unpinned）单选
5. 底栏：「重置」按钮 → `set(filterAtom, FILTER_DEFAULT)`

### 6.7 SortPopover

1. **排序字段**：六单选（modifiedAt / createdAt / title / readCount / likeCount / pinOrder）
2. **顺序**：升降 toggle
3. hairline
4. **分组**：三单选（none / status / month）—— 写 `postsListDisplayAtom`
5. **字段展示**：五 checkbox（category / tags / readCount / likeCount / time）—— 写 `postsListDisplayAtom`
6. 底栏：「重置」按钮 → 二 atom 皆复默认

### 6.8 FilterChips（左槽）

派生：

```ts
const chips: { id: string; label: string; clear: () => void }[] = []
if (filter.status !== 'all')        chips.push({ id: 'status',     label: STATUS_LABEL[filter.status], clear: () => set(filterAtom, p => ({ ...p, status: 'all' })) })
if (filter.categoryIds.length > 0)  chips.push({ id: 'categories', label: `分类 (${filter.categoryIds.length})`, clear: () => set(filterAtom, p => ({ ...p, categoryIds: [] })) })
if (filter.tagIds.length > 0)       chips.push({ id: 'tags',       label: `标签 (${filter.tagIds.length})`,      clear: () => set(filterAtom, p => ({ ...p, tagIds: [] })) })
if (filter.pin !== 'all')           chips.push({ id: 'pin',        label: PIN_LABEL[filter.pin],                   clear: () => set(filterAtom, p => ({ ...p, pin: 'all' })) })
```

chip：圆角 pill + label + `×`；`<button aria-label="移除 X 筛选">`；hover 凸；无活时左槽空。

### 6.9 PostsView 接

```tsx
// src/pages/posts/view/index.tsx
<TwoColPage
  title={...}
  actions={...}
  listHeader={<ListSubHeader />}                // 新
  list={<PostsList />}
  selectedId={cursor}
  onSelectedIdChange={setCursor}
>
  <RightPane />
</TwoColPage>
```

### 6.10 空数据态

`PostsList` 既有 `keyword` empty 文案扩之：

```tsx
const hasFilter = !isFilterDefault(useAtomValue(postsListFilterAtom))
const emptyTitle = keyword.trim()
  ? `「${keyword}」无结果`
  : hasFilter
    ? '无符合筛选之结果'
    : '尚无文章'
const emptyAction = hasFilter
  ? <Button onClick={() => set(filterAtom, FILTER_DEFAULT)}>重置筛选</Button>
  : null
```

---

## 7 · 边缘事

### 7.1 a11y

- 二 IconButton 各具 `aria-label`
- 活态：`data-active={hasFilter}` / `data-active={hasCustomSort}`，css 加 `color: ink` + `background: surface2` 以示之
- popover 内表单字段以 `<label>` 关联；按钮组 `role="radiogroup"` + `aria-checked`
- chip 之 `<button>` 具 `aria-label="移除 X 筛选"`
- 键盘：popover 内 Tab 循环、`Esc` 关之，Base UI 已处

### 7.2 mobile

- TwoColLayout mobile 分支同插 listHeader
- popover Base UI 自处定位，触屏点 trigger 即开
- 高 44 不变

### 7.3 持久化迁移

- 二新 key：`posts.list.filter.v1` / `posts.list.sort.v1`
- `postsListDisplayAtom`（key `posts.list.display.v1`）字段迁移：删 `showDrafts`；旧值 `false` → 一次性置 `filter.status = 'published'`
- 迁移 flag：`posts.list.display.migrated.v1`，于 PostsView mount 之 effect 内查/写
- 后改 schema 须升 v2 + 迁移 shim

### 7.4 后端能力 fallback

未支字段：

| 字段 | UI | query |
|---|---|---|
| `tagIds` | Combobox disabled + tooltip「待后端」 | 不入 |
| `status` | 状态按钮组 disabled（保 'all' 单按钮可点） | 不入 |
| `pin` | 置顶按钮组 disabled | 不入 |

`BACKEND_CAPS` 暂为 `src/constants/backend-caps.ts` 之常量，含 `tagIds: false, status: false, pin: false` 之初值。后端确认支后改 true，或改 runtime probe。本次以常量起步。

### 7.5 Popover 与 kbar

filter/sort popover 用 Base UI Popover，不与 kbar 冲；popover 开时 kbar 仍可由全局快捷键唤出。

---

## 8 · 测试

| 件 | 测项 |
|---|---|
| `ColumnHeader.test.tsx` | 三槽渲染顺序、size variant 切换 paddingInline、IconButton focus/hover/disabled、Divider 渲染 |
| `TwoColLayout`（既有 test 扩） | listHeader slot 在桌面 / mobile 两分支皆现于列表上方；缺 slot 时原貌 |
| `PostHeader`（既有 RightPane.test 间接覆盖） | testid 与 a11y label 不破；`data-variant` 维持 |
| `ListSubHeader.test.tsx` | popover 开关、状态切换写 atom、chip 加减、空 chip 列、reset 按钮 |
| `PostsList`（既有 test 扩） | 空态文案三态：搜索 / 筛选 / 全无；筛选态 reset 按钮可清 |
| 持久化迁移 unit | 旧 `showDrafts: false` 升后填 `filter.status = 'published'`；flag 防再跑 |
| E2E（既有 posts journey 扩） | filter 状态切换驱动列表；sort 切换驱动顺序；刷新后保留 |

---

## 9 · 实施顺序（P0 范围）

1. `ColumnHeader` primitive + 单测
2. `TwoColLayout.ListHeader` slot + `TwoColPage` prop
3. `PostHeader` 改用 ColumnHeader（删冗余 css）；既有测试通过
4. atoms：`postsListFilterAtom` + `postsListSortAtom` + display 迁移
5. `BACKEND_CAPS` 常量
6. `usePostsList` 注 filter/sort 入 query
7. `FilterPopover` / `SortPopover` / `FilterChips` / `ListSubHeader`
8. `PostsView` 接 `listHeader` prop
9. `PostsList` 空态扩
10. 测试 + E2E

## 10 · P1 后议（不属本次）

- chip 点之即开对应 popover（v1 仅清除）
- URL search params 同步（用户选 localStorage，URL 后议）
- 跨视图复用：将 `ListSubHeader` 抽至 `src/components/list/`，由 categories / tags / comments 等共用
- `BACKEND_CAPS` 改 runtime probe

---

## Changelog

- 2026-05-11 · 初稿，brainstorm 通过
