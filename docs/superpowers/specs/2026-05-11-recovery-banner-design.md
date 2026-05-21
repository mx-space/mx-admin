# Recovery Banner 设计

**Status**: design · 2026-05-11
**Scope**: 替 `RightPane` 之 `RecoveryModal` 为 inline banner（chip + 二 text-link，无 modal 弹遮）。仅文件三五，无 cross-module 牵连。
**Owners**: TBD

---

## 1 · 目标与决定

### 1.1 用户故事

- 用户：于 list 切文，若该文有未提交草稿，rightPane 顶部见一极简提示，可径择「恢复草稿」或「用已发布」；不弹遮罩、不打断 preview 之 reading flow。
- 开发者：删 `modals/RecoveryModal.tsx`，加 `banners/RecoveryBanner.tsx`；`RightPane` 之 dismiss-once-per-cursor 行为照旧。

### 1.2 决定（已批，brainstorm 答辩）

| 维 | 决定 |
|---|---|
| 形 | inline banner，非 modal |
| 位置 | `RightPaneInner` 之 scroll 内、`<TitleField>` 之上 |
| 样式 | C 式 · 极简 chip + 二 text-link，无背景无边 |
| Actions | 「恢复草稿」「用已发布」二 text-link（同 modal 之原 action）|
| Dismiss | **隐式**——切 cursor 即记，无 explicit `×`；二 action 均 hide 当前 banner |
| 记忆 | per-session per-cursor 一次（沿 `recoveryShown` ref Set）|
| 视觉 tone | lavender accent chip + inkSubtle meta + lavender text-link |

---

## 2 · 文件骨架

```
src/pages/posts/view/right/
├── banners/                          # 新建
│   ├── RecoveryBanner.tsx            # 新
│   └── RecoveryBanner.css.ts         # 新
├── modals/
│   └── RecoveryModal.tsx             # 删
├── RightPane.tsx                     # 改：import + render
└── RightPane.test.tsx                # 改：testid 与场景
```

无他文件改动；无 atom / store / api 牵涉。

---

## 3 · Component API

### `RecoveryBanner`

```tsx
export interface RecoveryBannerProps {
  /** 草稿之 updatedAt；用以渲染 relative time（"3m ago"）。null 则隐 meta 部 */
  lastEditedAt: Date | string | null
  /** 「恢复草稿」点击。当前 effective 已是 draft，无副作用；仅隐 banner */
  onUseDraft: () => void
  /** 「用已发布」点击。discard draft，隐 banner */
  onUsePublished: () => void
}

export const RecoveryBanner: FC<RecoveryBannerProps>
```

无 `open` / `onClose` prop —— banner 之 mount 与否由 parent (`RightPaneInner`) 据条件控制。隐藏即 unmount。

---

## 4 · 视觉规格（C 式）

```
  [◎ 草稿待处理]  · 3m ago     恢复草稿  |  用已发布
   └ chip            └ meta     └ link    sep  └ link
```

| token | 值（vanilla-extract，引 `themeContract.color`） |
|---|---|
| chip · bg | `surface3`（既是 Linear "popover / chip" 之既定 surface） |
| chip · ink | `primary`（lavender brand） |
| chip · radius | `themeContract.radius.pill`；若无 pill 则 `999px` hard-code |
| chip · padding | `2px 8px` |
| chip · fontSize | `12px` |
| meta · color | `inkTertiary` |
| link · color | `primary` |
| link · hover | `primaryHover` |
| sep `\|` · color | `hairlineTertiary` |
| 容器 gap | `themeContract.spacing.sm`（≈ 10px）|
| 容器 fontSize | `13px` |
| 容器 height | inherit（≈ 24px line-box） |
| 容器 background | transparent |
| 容器 border | none |

icon：`lucide-react` 之 `FileClock`，size=14、`color={themeContract.color.primary}`；与 chip text 同行。

> token 名以 `~/styles/tokens/color.ts` 之 `darkColor` 为准（`primary` / `primaryHover` / `surface3` / `inkTertiary` / `hairlineTertiary`）。本 spec 无加 token；若 `radius.pill` 缺，hard-code `999px` 即可，无 TODO。

---

## 5 · 行为与生命周期

### 5.1 显示条件（与现 modal 等价）

```ts
const shouldShow =
  Boolean(post) &&
  Boolean(draft) &&
  !recoveryShown.current.has(cursor)
```

`recoveryShown` 沿用现 `useRef<Set<string>>(new Set())`，per-session。

### 5.2 Mount 时机

`useEffect(cursor, post, draft)` 内：

```ts
if (post && draft && !recoveryShown.current.has(cursor)) {
  recoveryShown.current.add(cursor)
  setRecoveryVisible(true)
}
```

**注**：与现 modal 之 mount 时序完全一致，仅 state 名 `recoveryOpen` → `recoveryVisible`（语义更贴 banner）。

### 5.3 Action 处理

| Action | 副作用 | banner |
|---|---|---|
| 「恢复草稿」 | 无（effective 已是 draft） | hide |
| 「用已发布」 | `discard.mutate({draftId})` + toast | hide（即便 mutate 异步未完，UI 即隐） |
| 切 cursor | — | natural unmount（仅 mount 于当前 cursor 之 effect） |

「恢复草稿」之 no-op 沿 modal 现有逻辑（见 `RightPane.tsx:319-321`）。

### 5.4 onPublish 之兼容

现 `onPublish` 成功后 `setRecoveryOpen(false)`（line 195）。改名同步：`setRecoveryVisible(false)`。语义等价。

---

## 6 · Lifecycle 对照表（modal vs banner）

| 时刻 | modal（现行） | banner（新） |
|---|---|---|
| 切到有 draft 之文 | modal 弹（一次） | banner mount |
| 用户 ✕ / Esc / backdrop click | dismiss | **N/A**（无 explicit dismiss） |
| 点 「恢复草稿」 | modal close | banner unmount |
| 点 「用已发布」 | discard + close | discard + banner unmount |
| 切他文再回 | 不弹（ref 已记） | 不显（ref 已记） |
| 发布成功 | `recoveryOpen=false` | `recoveryVisible=false` |
| draft 中途消失 | modal 仍可显（孤儿态） | banner 据 condition 自然隐 |

---

## 7 · 测试

### 7.1 新 `RecoveryBanner` unit test（component-level）

- 渲二 button + 一 chip + meta 文
- `onUseDraft` 点击触发 handler
- `onUsePublished` 点击触发 handler
- `lastEditedAt=null` 时无 meta 文

### 7.2 `RightPane.test.tsx` 更新

- 删：`recovery-modal` data-testid 之断言
- 加：`recovery-banner` data-testid 之断言（mount on cursor switch with draft）
- 加：切 cursor 再切回，banner 不再显
- 留：「用已发布」触 discard mutation 之断言（path 经 banner 而非 modal）

### 7.3 data-testid 约定

| 元素 | testid |
|---|---|
| banner 容器 | `recovery-banner` |
| 「恢复草稿」 | `recovery-banner-use-draft` |
| 「用已发布」 | `recovery-banner-use-published` |

旧 `recovery-modal` / `recovery-use-draft` / `recovery-use-published` 全删（无他处引用，已确认）。

---

## 8 · 变更范围

| 文件 | 增/改/删 | 说明 |
|---|---|---|
| `src/pages/posts/view/right/banners/RecoveryBanner.tsx` | + | 新组件 |
| `src/pages/posts/view/right/banners/RecoveryBanner.css.ts` | + | 样式 |
| `src/pages/posts/view/right/modals/RecoveryModal.tsx` | = | **保留**——`EditPage` (fullscreen) 仍用 modal；仅 `RightPane` (preview) 改用 banner |
| `src/pages/posts/view/right/RightPane.tsx` | ~ | import 换、state 名换、render 位置移 |
| `src/pages/posts/view/right/RightPane.test.tsx` | ~ | testid + 场景 |

无 spec / store / atom 改动。

---

## 9 · 风险与边界

- **「用已发布」之 mutate 失败**：banner 已隐，user 见 toast error。是否回滚 banner？——**否**。同 modal 现行（modal close 后 mutation 失败仅 toast，不重弹）。一致即可。
- **ref Set 之 session 局限**：刷新 page，记忆失。同 modal 现行——非新 risk。
- **draft 中途消失之孤儿态 modal**：banner 不存此问题（mount 条件含 draft）。算 minor 改善。

---

## 10 · 非范围 (Out of Scope)

- 不动 `DiscardConfirmModal`（确认弃改之 modal 仍是 modal——破坏性 action 该有阻断）。
- 不动 delete 之 modal（同上）。
- 不动 `PostHeader` 之 `DraftBadge`（仍是「• 未提交」之 tag，与 banner 信息互补，不冗余）。
- 不重命名 `recoveryShown` ref（含义未变）。

---

## 11 · 落地次序（拟）

1. 写 `RecoveryBanner.tsx` + css.ts + unit test
2. `RightPane.tsx` 替 import / render / state name
3. 删 `modals/RecoveryModal.tsx`
4. `RightPane.test.tsx` 改 testid 与场景
5. `pnpm typecheck` + `pnpm lint src/pages/posts/view/right/**` （仅改动文件）

---

## Changelog

- 2026-05-11 · 初稿，brainstorm 答辩定 C 式 + 隐式 dismiss
- 2026-05-11 · 落地。修正：`RecoveryModal.tsx` 不删（`EditPage` 仍消费）。RightPane preview 改 banner，EditPage fullscreen 仍 modal。9/9 测试过
