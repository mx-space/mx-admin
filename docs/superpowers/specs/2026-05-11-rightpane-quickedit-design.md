# RightPane Quick-Edit 设计

**Status**: design · approved 2026-05-11
**Scope**: `src/pages/posts/view/right/` 之 RightPane 全面 refine — 由「只读预览」升至「inline 编辑 + Lexical 正文 + draft autosave + 手动 publish」之一体面板。`<PostHeader>` 抽为 compact / full 双 variant 共用件，`/posts/edit` 全屏页同源消费。
**Owners**: TBD（执行时填）

---

## 1 · 目标与决定

### 1.1 用户故事

- 读者：在文章列表选一行，右栏即见 title / category / tags / status / 正文，可滚可读
- 作者：右栏内点字段即改、点正文即写，全部 autosave 入 draft；改完点「提交」即发布；空间不够则「全屏 ⌘\\」入 `/posts/edit`

### 1.2 设计决定（已批）

| 维 | 决定 |
|---|---|
| 范围 | 全部字段 + 正文（title / slug / category / tags / summary / pin / copyright / isPublished / content） |
| 触发 | inline tap-to-edit（Linear/Notion 式） |
| 保存目标 | **draft（非 post）**；publish 须手动 |
| autosave | 全自动 debounce 10s；状态机 idle → pending → saving → saved → idle（error 分支可 retry） |
| 正文编辑器 | `@haklex/rich-kit-shiro` 之 `<ShiroEditor>`（与 admin-vue3 同栈） |
| 与 `/posts/edit` 边界 | 保留为「全屏」补；同源 hooks；`<PostHeader>` 共件双 variant |
| 布局 | A · Properties Panel（title + meta strip + key/val 列 + hairline + 正文） |
| Header 高 | `chrome.headerHeight`（44px）—— 与 list pane / FullLayout 共基线 |

---

## 2 · 文件骨架

```
src/pages/posts/view/right/
├── RightPane.tsx                      // 编排 + 状态分派
├── RightPane.css.ts
├── meta/
│   ├── TitleField.tsx                 // 大字体 inline 输入
│   └── MetaStrip.tsx                  // 状态点·分类·slug·查看链
├── props/
│   ├── PropsList.tsx                  // key/val 列容器
│   ├── PropRow.tsx                    // 通用行（key 88px）
│   ├── InlineField.tsx                // render/edit 切件契约
│   └── fields/
│       ├── SlugField.tsx
│       ├── TagsField.tsx              // <Combobox multiple freeSolo>
│       ├── CategoryField.tsx          // <Combobox> 单选
│       ├── SummaryField.tsx           // <Textarea> autosize
│       ├── PinField.tsx               // <Switch> + 条件 pinOrder
│       ├── CopyrightField.tsx         // <Switch>
│       └── StatusField.tsx            // <Switch> + toast
└── body/
    ├── BodyEditor.tsx                 // ShiroEditor 包，editorKey={postId}
    └── BodyEditor.css.ts

src/components/post-detail/header/     // 共用件，RightPane + /edit 同消费
├── PostHeader.tsx                     // 编排，按 variant 排序/裁剪
├── PostHeader.css.ts
├── SaveIndicator.tsx
├── DraftBadge.tsx
├── PublishMenu.tsx                    // split-btn (compact 单 / full split)
├── KebabMenu.tsx
├── parts/Breadcrumb.tsx               // 仅 full
└── modals/
    ├── RecoveryModal.tsx              // 编辑已发布 + 有 draft 时弹
    └── DiscardConfirmModal.tsx

src/components/editor/rich/
├── RichEditor.tsx                     // ShiroEditorBridge 之 React 镜像
├── EnrichmentLinkCard.tsx
├── EnrichmentLinkCardContext.tsx
├── NestedDocDialogEditor.tsx
└── setup-enrichment-linkcard.ts

src/components/ui/Combobox/            // P2 batch C 之 primitive，本设计随手补
├── index.tsx
├── Combobox.css.ts
└── Combobox.test.tsx

src/api/
├── drafts.ts                          // minimal: getByRef / create / update / delete
├── files.ts                           // minimal: upload(file, type)
└── enrichment.ts                      // resolve(url)

src/models/draft.ts                    // DraftModel + DraftRefType + PostSpecificData

src/hooks/queries/
├── useDrafts.ts                       // useDraftByRef / useCreateDraft / useDraftAutosave / usePublishDraft / useDiscardDraft
├── useEffectivePost.ts                // 派生 effective = post + draft override（per-field 合并）
└── usePosts.ts                        // 已存，复用 usePostPatch / usePostDelete

src/atoms/
├── draft.ts                           // 扩 postDraftDirtyMapAtom
└── posts.ts                           // 已存，无变

src/lib/
└── lexical-content.ts                 // decodeInitialValue（lexical / markdown / 损坏三路）
```

约束：每文件 ≤ 500 行；React 组件 ≤ 300 行；新单元各一职、可独测。

---

## 3 · `<RightPane>` 编排

```tsx
const RightPane = () => {
  const cursor = useAtomValue(postsListCursorAtom)
  const { data: post, isLoading, isError } = usePostDetail(cursor)
  const { data: draft } = useDraftByRef('post', cursor)

  if (!cursor) return <EmptyState title="选一篇文章以预览" />
  if (isLoading) return <LoadingState />
  if (isError || !post) return <ErrorState />

  return (
    <ShortcutScope id="posts.detail" kind="page">
      <div className={rightPaneStyle}>
        <PostHeader variant="compact" post={post} draft={draft} {...handlers} />
        <Scroll>
          <div className={rightBodyStyle}>
            <TitleField value={effective.title} onCommit={...} />
            <MetaStrip post={post} />
            <PropsList>
              <SlugField value={effective.slug} ... />
              <CategoryField value={effective.categoryId} ... />
              <TagsField value={effective.tags} ... />
              <SummaryField value={effective.summary} ... />
              <PinField value={effective.pinAt} order={effective.pinOrder} ... />
              <CopyrightField value={effective.copyright} ... />
              <StatusField value={effective.isPublished} ... />
            </PropsList>
            <Hairline />
            <BodyEditor key={post.id} initial={decodedInitial} onChange={autosave.commitBody} />
          </div>
        </Scroll>
        <RecoveryModal /> {/* portal-mounted, controlled by atom */}
        <DiscardConfirmModal />
      </div>
    </ShortcutScope>
  )
}
```

`effective.*` 由 `useEffectivePost(post, draft)` 派生：有 draft 字段则用 draft，否则用 post。

---

## 4 · 字段 inline 编辑契约

### 4.1 `<PropRow>`

```tsx
<PropRow label="Slug" hint="留空则自生" error={fieldError.slug}>
  <InlineField
    value={effective.slug}
    render={(v) => <span>{v || <Em>—</Em>}</span>}
    edit={({ value, onChange, onCommit, onCancel }) => (
      <Input autoFocus value={value} onChange={onChange}
             onBlur={onCommit} onEscape={onCancel} />
    )}
    onCommit={(next) => autosave.commit({ slug: next })}
  />
</PropRow>
```

### 4.2 行为律

| 事件 | 表现 |
|---|---|
| 点 `render` 区域 / Enter / Space | 入 edit 态、autoFocus |
| onBlur | commit |
| Esc | cancel（不入 buffer） |
| Tab | commit + 跳下一 PropRow |
| commit | 立即 cache 乐观更新；入 autosave buffer |
| PATCH 失败 | 回滚 cache + toast；字段标 error |

### 4.3 字段控件矩阵

| 字段 | 控件 | 提交时机 |
|---|---|---|
| title | `<Input size=lg>` | onBlur |
| slug | `<Input>` | onBlur |
| tags | `<Combobox multiple freeSolo>` + `<Chips>` | 加/删即提 |
| category | `<Combobox>` 单选 | 选即提 |
| summary | `<Textarea autosize>` | onBlur |
| pin | `<Switch>` + 条件 `<Input number>` | 切即提 |
| copyright | `<Switch>` | 切即提 |
| isPublished | `<Switch>` 配 toast「已发布 / 转草稿」 | 切即提 |

### 4.4 `<Combobox>` primitive（P2 batch C 随手补）

`@base-ui/react/combobox` 已俱全部件（含 `chip` / `chips` / `chip-remove` / `clear` / `item-indicator` / `popup` / `portal`）。

新建 `src/components/ui/Combobox/`：
- `<Combobox>` + `<Combobox.Trigger size>` + `<Combobox.Input>` + `<Combobox.Popup>` + `<Combobox.List>` + `<Combobox.Item>` + `<Combobox.Chips>` + `<Combobox.Chip>` + `<Combobox.ChipRemove>` + `<Combobox.Clear>`
- `multiple` + `freeSolo`（自由输入新项）+ 自定 `filter`
- 与现 `<Select>` 同 spec、同 css 节奏
- 落 `_dev/primitives` 一节 + ≥ 6 vitest 案
- spec 03 标 「P2 batch C: Combobox shipped」

### 4.5 验证（zod）

```ts
const PostQuickEditSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100).optional().or(z.literal('')),
  summary: z.string().max(500).nullish(),
  tags: z.array(z.string().max(32)).max(20),
  pinOrder: z.number().int().min(0).optional(),
})
```
失败：commit 不入 buffer，PropRow 红边 + `<FormMessage>`，autosave 跳过此字段、其他照常。

---

## 5 · Lexical 正文接入

### 5.1 选 ShiroEditor

底层用 `@haklex/rich-kit-shiro` 之 `<ShiroEditor>`，**非裸 `<RichEditor>`**。Shiro 是 mx 站点之节点 schema 上集（alert / spoiler / katex / nested-doc / excalidraw / mention / 等），与后端 `contentFormat: 'lexical'` 之 JSON 完全对应。直用 `<RichEditor>` 则丢自定节点。

### 5.2 新依赖

```json
"@haklex/rich-kit-shiro": "0.4.0",
"@haklex/rich-editor-ui": "0.4.0",
"@haklex/rich-plugin-toolbar": "0.4.0",
"@haklex/rich-headless": "0.4.0",
"@lexical/markdown": "^0.44.0",
"@lexical/react": "^0.44.0",
"lexical": "^0.44.0"
```
所有 `@haklex/*` 同 0.4.0，遵 spec 09 之 pin 律。

### 5.3 `<RichEditor>` wrapper（`src/components/editor/rich/RichEditor.tsx`）

镜像 admin-vue3 之 `ShiroEditorBridge`，纯 React 19 实现，无 mountRichEditor 命令式包装：

```tsx
import { DialogStackProvider } from '@haklex/rich-editor-ui'
import { NestedDocDialogEditorProvider, nestedDocEditNodes, NestedDocPlugin }
  from '@haklex/rich-ext-nested-doc'
import { ExcalidrawConfigProvider, ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'

interface RichEditorProps {
  initialValue?: SerializedEditorState
  variant?: 'article' | 'comment' | 'note'
  autoFocus?: boolean
  placeholder?: string
  showToolbar?: boolean
  onChange?: (state: SerializedEditorState) => void
  onTextChange?: (markdown: string) => void
  onEditorReady?: (editor: LexicalEditor | null) => void
  imageUpload?: (file: File) => Promise<{ src: string }>
  className?: string
}

export const RichEditor: FC<RichEditorProps> = ({ showToolbar = true, ...rest }) => (
  <EnrichmentFetcherProvider value={fetchEnrichment}>
    <NestedDocDialogEditorProvider value={NestedDocDialogEditor}>
      <DialogStackProvider>
        <ExcalidrawConfigProvider saveSnapshot={saveExcalidrawSnapshot} apiUrl={API_URL}>
          <ShiroEditor
            {...rest}
            extraNodes={nestedDocEditNodes}
            header={showToolbar ? <ToolbarPlugin /> : undefined}
          >
            <NestedDocPlugin />
          </ShiroEditor>
        </ExcalidrawConfigProvider>
      </DialogStackProvider>
    </NestedDocDialogEditorProvider>
  </EnrichmentFetcherProvider>
)
```

### 5.4 配套小件（亦从 admin-vue3 镜移）

- `EnrichmentLinkCard.tsx` + `EnrichmentLinkCardContext.tsx` + `setup-enrichment-linkcard.ts`
- `NestedDocDialogEditor.tsx`
- `saveExcalidrawSnapshot()` helper（用 `filesApi.upload`）
- `fetchEnrichment()` 用 `enrichmentApi.resolve(url)`

### 5.5 RightPane 之消费 `<BodyEditor>`

```tsx
<RichEditor
  key={post.id}                         // 切 cursor 时强 unmount/remount
  variant="article"
  showToolbar={false}                   // RightPane compact：toolbar 收入 floating
  initialValue={decoded}
  onChange={(state) => autosave.commitBody(JSON.stringify(state))}
  onTextChange={(md) => autosave.commitText(md)}   // 同步 text 字段
  imageUpload={uploadImage}
/>
```

### 5.6 Toolbar 显藏

| Variant | showToolbar | toolbar 来源 |
|---|---|---|
| RightPane (compact) | `false` | floating-toolbar / slash-menu（ShiroEditor 内自带） |
| /edit (full) | `true` | 顶 `<ToolbarPlugin />` 全出 |

### 5.7 Initial value 管线（`src/lib/lexical-content.ts`）

```ts
export function decodeInitialValue(post: PostModel): SerializedEditorState | null {
  if (!post.content) return null
  if (post.contentFormat === 'lexical') {
    try { return JSON.parse(post.content) as SerializedEditorState }
    catch { toast.warning('正文损坏，已重置'); return null }
  }
  // markdown：不预转，依 lexical 之 onTextChange 反向同步即可；初次入 editor 时若无 lexical content，
  // 用 $convertFromMarkdownString headless 一次（async via small worker-less helper），落 SerializedEditorState
  return convertMarkdownToInitialState(post.content)
}
```

### 5.8 编辑即升 lexical（无 modal）

旧 markdown post 首次正文 commit → `contentFormat='lexical'` 写入 draft；`text` 字段同步用 `onTextChange` 派生 markdown，保 list 预览 / SSR 兼容。SaveIndicator 旁悄悄一次 toast「已升级为 Lexical 编辑」per post per session，无 modal 拦截。

### 5.9 editorKey rerender trick

`<ShiroEditor initialValue>` 是 uncontrolled。切 cursor → post 变 → richContent 全换。须 `key={post.id}` 强制 unmount/remount 以防 lexical 内部 state 不同步。

---

## 6 · Draft autosave + 手动 publish

### 6.1 后端契约（已存 admin-vue3 之 drafts API）

| 端点 | 用途 |
|---|---|
| `GET /drafts/by-ref/:refType/:refId` | 取 post 之关联 draft |
| `POST /drafts` | 创 draft（含 typeSpecificData + content） |
| `PUT /drafts/:id` | 改 draft |
| `DELETE /drafts/:id` | 删 draft（弃改 / 提交后） |
| `GET /drafts/:id/history` | 历史版本（P3） |
| `POST /drafts/:id/restore/:version` | 恢复历史版本（P3） |

`DraftModel` 携：`typeSpecificData: PostSpecificData`（slug / categoryId / tags / summary / copyright / isPublished / pinAt / pinOrder）+ `content` + `contentFormat` + `text` + `version`。

### 6.2 生命周期

```
载 post ─┬─ getByRef → null  ──▶ 显 published；首次 commit 才 lazy create draft
         │
         └─ getByRef → draft ──▶ 弹 RecoveryModal: 「恢复草稿 / 用已发布」
                                  ↓                       ↓
                            render draft 字段          draftsApi.delete
                            标 dirty=true              render published
```

### 6.3 状态机

```
idle ──commit──▶ pending(buffer) ──debounce 10s──▶ saving ──onSuccess──▶ saved(2s) ──▶ idle
                       ▲                                  │
                       │                                  └──onError──▶ error(retry?) ──manual──▶ saving
                  (再 commit 合并 buffer，重置 timer)
```

`useDraftAutosave(postId)` 单 hook，封以下：

```ts
interface DraftAutosave {
  commit(patch: Partial<PostSpecificData>): void
  commitBody(content: string): void           // lexical JSON
  commitText(text: string): void              // 同 onTextChange 之 md
  flush(): Promise<void>                      // 同步 flush（cursor 切走前钩）
  retry(): void                               // error 态手动 retry
  status: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
  lastSavedAt: string | null
  lastError: Error | null
}
```

实现：
- `bufferRef = { fields: {...}, content?: string, text?: string }` 累累合并
- timer 触 → 一次 PATCH（首次合 lazy `create`）
- `useMutation` `onMutate` 写乐观 cache、`onError` 回滚 + 入 `error`、`onSuccess` 切 `saved` → 2s 后 `idle`

### 6.4 提交流（手动）

```ts
const publish = async () => {
  const merged = { ...effective }   // post + draft override 之合
  const updated = await postsApi.patch(postId, merged)
  if (draftId) await draftsApi.delete(draftId)
  qc.setQueryData(postDetailQueryKey(postId), updated)
  qc.invalidateQueries({ queryKey: ['table', POSTS_LIST_KEY] })
  toast.success('已提交')
}
```

### 6.5 弃改流

```ts
const discard = async () => {
  if (draftId) await draftsApi.delete(draftId)
  qc.invalidateQueries({ queryKey: postDetailQueryKey(postId) })
  toast.success('已弃改')
}
```
弹 `<DiscardConfirmModal>` 二次确认「将弃 N 字段改 + 正文改」。

### 6.6 SaveIndicator / DraftBadge 视觉

| status | 文 | 灯 |
|---|---|---|
| `idle` | （隐） | — |
| `pending` / `saving` | 「草稿保存中…」 | 灰旋点 |
| `saved` | 「已存草稿于 Ns 前」 | 绿点（用 `RelativeTime`） |
| `error` | 「保存失败 · 重试」 | 红点 + clickable |

DraftBadge：当 `effective ≠ published`（per-field diff），title 旁挂 `• 未提交` chip；hover 弹 diff popover 列改动字段。

### 6.7 字段视觉差异

- 已发布字段在 PropRow 上呈淡灰
- draft override 字段呈正常 ink + 左 1px primary 边
- 「提交」按钮 disabled if `!dirty`

### 6.8 cursor 切护栏

- `pending` → 立即 `flush()`（同步 PATCH 不待 debounce）
- `saving` → 候 promise，复用现 mutation
- `error` → 不弹 modal，仅顶部红灯保留；buffer 在服务端前次 saved 仍在，无丢失

### 6.9 SocketBridge 共存

- `POST_UPDATED` 当前 cursor：若无 draft，直接 invalidate；若有 draft，仅 invalidate post cache、不动 draft
- `POST_DELETED` 当前 cursor：清 cursor + invalidate list + toast「已删除」
- `DRAFT_UPDATED`：本期不接，记 owe

### 6.10 atom 扩

```ts
// src/atoms/draft.ts (新增)
export const postDraftDirtyMapAtom = atom<Record<string, boolean>>({})
// 列表行可挂「• 未提交」点
```

---

## 7 · `<PostHeader>` 共件 · compact / full 双 variant

### 7.1 契约

```tsx
interface PostHeaderProps {
  post: PostModel | null
  draft: DraftModel | null
  variant: 'compact' | 'full'
  onPublish: () => void
  onDiscard: () => void
  onDelete: () => void
  onOpenHistory?: () => void
  onJumpToFullscreen?: () => void   // 仅 compact 用
  onBack?: () => void                // 仅 full 用
  saveStatus: AutosaveStatus
  lastSavedAt: string | null
}
```

### 7.2 子件

- `SaveIndicator(variant)` — 紧 = 灯 + 短字 ｜ 宽 = 灯 + 时间戳 + 「查史」link
- `DraftBadge(variant)` — 紧 = chip-only ｜ 宽 = chip + 改动数 + 「比对」btn
- `PublishMenu(variant)` — 紧 = 单按钮 + ▾ ｜ 宽 = split-btn 「提交并查看」+「仅存草稿 / 弃改」
- `KebabMenu(variant)` — variant 决条目集
- `Breadcrumb` — 仅 full

### 7.3 两 variant 差异表

| 元 | `compact`（RightPane） | `full`（/edit） |
|---|---|---|
| 高 | `chrome.headerHeight` (44) | `chrome.headerHeight` (44) |
| 内距 | `0 12px` | `0 24px` |
| 间距 | `gap: 4` | `gap: 8` |
| icon-button size | `sm` (28) | `md` (32) |
| 文字详略 | 短字 | 全文 + 时间戳 |
| Breadcrumb | 隐 | 显 `文章 / 编辑「<title>」` |
| 返 | 隐 | 显 `<ArrowLeft>` + 「返」 |
| 外链 | icon-only | icon + 「在站点查看」label |
| 全屏 ⌘\\ | icon `<Maximize2>` 显 | 隐 |
| 删除 | kebab 内 | inline 「移至回收站」icon-btn |
| 历史 | kebab 内 | inline 「历史」按钮 |
| 提交 | 「提交」单按钮 + ▾ | split：`提交并查看` ‖ `▾`（仅存草稿 / 弃改） |
| kebab `<MoreHorizontal>` | 6 项（复制 ID/path / 在列表选中 / 历史 / 移至回收站） | 3 项（复制类） |

### 7.4 高度一致律

`PostHeader.css.ts` 用 `chrome.headerHeight` import，绝不写硬码 px；与 list pane / FullLayout / setup chrome 同基线。

### 7.5 RightPane 用法

```tsx
<PostHeader variant="compact" post={post} draft={draft} {...handlers} />
```

### 7.6 /edit 用法

```tsx
<FullLayout>
  <FullLayout.Header>
    <PostHeader variant="full" post={post} draft={draft} {...handlers} />
  </FullLayout.Header>
  <FullLayout.Body>{/* 全屏 PropsList + BodyEditor 双栏 */}</FullLayout.Body>
</FullLayout>
```

---

## 8 · 顶部 actions 与快捷键

### 8.1 RightPane 之 ShortcutScope

`<ShortcutScope id="posts.detail" kind="page">` 包 RightPane，注册：

| 键 | 行为 |
|---|---|
| `e` / `i` | 入 BodyEditor，lexical focus |
| `⌘+s` | 强 `flush()` draft |
| `⌘+enter` | publish |
| `⌘+\\` | 跳 `/posts/edit?id=...` |
| `⌘+shift+backspace` | 删除（弹 confirm modal） |
| `Esc`（聚于 inline edit） | cancel |
| `Tab`（聚于 inline edit） | commit + 跳下一 PropRow |

### 8.2 删除流

kebab 「移至回收站…」 → `<Modal>` 二次确认（含 title 输入解锁）→ `usePostDelete` → 清 cursor + invalidate list + toast「已删除」。

---

## 9 · 边界、validation、错误恢复

### 9.1 字段验证（zod）

见 §4.5。失败仅阻此字段 commit，其他字段照常。

### 9.2 Network 失败

| 场景 | 处理 |
|---|---|
| draft autosave 失败 | SaveIndicator 红 + 「重试」link；buffer 不清 |
| publish 失败 | toast + 按钮回 enabled，draft 不删 |
| 删除失败 | toast，cursor 不动 |
| AUTH_FAILED | 全局 `<AuthErrorBridge />` 已托底 |
| 404 / 403 | RightPane 显 `<Empty>`「文章已删除 / 无权访问」+ 回列表 btn |

### 9.3 Recovery modal 时机

仅在「post 已存且有 draft」之 cursor 切入时弹一次。`useRef recoveryShownForPost: Set<id>` per session 避重复弹。

### 9.4 SocketBridge 行为

见 §6.9。

### 9.5 大文档 / 性能

- markdown → lexical 首次转换（>50KB）可能慢 → `<Suspense>` + skeleton；记 owe「decode worker」P3
- Lexical 自带 undo/redo 局正文，不与 RightPane 状态打通；字段层 undo 暂不做（owe）

### 9.6 跨会话 dirty 持久化

依现 draft 落服务端，本地不另存。AUTH_FAILED 时 buffer 丢失可接受（属 P3 改进）。

---

## 10 · Owe 清单（不在本 spec scope）

- DRAFT_UPDATED socket 通道
- 历史版本 modal（getHistory + restoreVersion）
- 字段级 undo（lexical 自带正文 undo，字段层无）
- markdown → lexical 转换 worker（大文档异步化）
- 跨会话 dirty 本地持久化
- AI agent 集成（admin-vue3 之 `<RichEditorWithAgent>`，本期 RightPane 不纳；/edit full 亦缓）
- `<DiffModal>` 实做（DraftBadge 之「比对」按钮，初版可仅 toast「N 字段改」）

---

## 11 · 测试覆盖（vitest，目标 ≥ 12 案）

- `useDraftAutosave` 状态机：commit → pending → saving → saved；error → retry
- `decodeInitialValue` 三路：lexical / markdown / 损坏
- cursor 切护栏：pending flush；saving 候 promise
- `<PostHeader variant>` 两 variant 之子件可见性矩阵（compact 不显 breadcrumb / full 不显全屏 btn）
- `<PostHeader>` 用 `chrome.headerHeight` 而非硬码（assertion via getComputedStyle）
- recovery modal 不重复弹（per session per post）
- `<Combobox>` ≥ 6 案（single / multi / freeSolo / chip remove / clear / filter）
- `<InlineField>` Esc cancel / onBlur commit / Tab 跳行

---

## 12 · 执行顺序（提示 — 实施时归入 plan）

1. `<Combobox>` primitive（独立 PR）
2. drafts / files / enrichment 三 API + DraftModel
3. `useDraftAutosave` + 状态机 + tests
4. `<RichEditor>` ShiroEditor wrapper + Provider 栈
5. `<PostHeader>` 共件 compact 实现
6. RightPane 重写：编排 + InlineField + 字段集
7. RightPane 接 `<BodyEditor>` + 接 `useDraftAutosave`
8. `RecoveryModal` + `DiscardConfirmModal`
9. `/posts/edit` 全屏页接 `<PostHeader variant="full">`
10. SocketBridge 微调（POST_UPDATED 之 draft-aware invalidation）
11. e2e smoke + 文档收尾

---

## 13 · STATUS 联动

完成后于 `docs/superpowers/specs/2026-05-06-react-migration/STATUS.md` changelog 加一行；若涉 spec 03（Combobox）/ spec 09（Editors）/ spec 11（Views migration · posts/view）之进度变更，亦同步更新对应行之 Notes 字段。
