# Master-Detail Layout 设计规范

本文档描述 MX Admin 中 Master-Detail 布局的设计规范，适用于评论管理、草稿管理、专栏管理等列表-详情类页面。

## 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  Header (h-16)                                              │
│  border-b border-neutral-100 dark:border-neutral-900        │
├───────────────────┬─────────────────────────────────────────┤
│                   │                                         │
│   List Panel      │         Detail Panel                    │
│   (30%-35%)       │         (65%-70%)                       │
│                   │                                         │
│   bg-white        │         bg-neutral-50                   │
│   dark:bg-900     │         dark:bg-neutral-950             │
│                   │                                         │
├───────────────────┴─────────────────────────────────────────┤
│  (NSplit resize trigger - 可拖拽调整)                        │
└─────────────────────────────────────────────────────────────┘
```

## 组件使用

### 基本用法

```tsx
import {
  MasterDetailLayout,
  useMasterDetailLayout,
} from '~/components/layout'

const { isMobile } = useMasterDetailLayout()

<MasterDetailLayout
  showDetailOnMobile={showDetailOnMobile.value}
  defaultSize={0.3}
  min={0.2}
  max={0.4}
>
  {{
    list: () => <ListComponent />,
    detail: () => selectedItem ? <DetailComponent /> : null,
    empty: () => <EmptyState />,
  }}
</MasterDetailLayout>
```

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showDetailOnMobile` | `boolean` | `false` | 移动端是否显示详情面板 |
| `defaultSize` | `number` | `0.3` | 列表面板默认宽度比例 |
| `min` | `number` | `0.2` | 最小宽度比例 |
| `max` | `number` | `0.4` | 最大宽度比例 |
| `listBgClass` | `string` | `'bg-white dark:bg-neutral-900'` | 列表面板背景 |
| `detailBgClass` | `string` | `'bg-neutral-50 dark:bg-neutral-950'` | 详情面板背景 |

### Slots

- `list` - 左侧列表面板内容
- `detail` - 右侧详情面板内容（选中项时渲染）
- `empty` - 详情为空时的占位内容

---

## 列表面板 (List Panel)

### 结构

```
┌─────────────────────────────────┐
│ Filter Header (h-12)            │  ← 筛选器/标题 + 计数
│ border-b                        │
├─────────────────────────────────┤
│ Selection Bar (可选)            │  ← 批量选择栏
│ bg-neutral-50/50                │
├─────────────────────────────────┤
│                                 │
│ NScrollbar (flex-1 min-h-0)     │  ← 可滚动列表
│   └── ListItem                  │
│   └── ListItem                  │
│   └── ...                       │
│                                 │
├─────────────────────────────────┤
│ Pagination (可选)               │  ← 分页器
│ border-t                        │
└─────────────────────────────────┘
```

### 样式规范

```tsx
// 容器
<div class="flex h-full flex-col">

// 头部
<div class="flex h-12 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
  <span class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
    标题
  </span>
  <span class="text-xs text-neutral-400">
    {count} 个
  </span>
</div>

// 列表区域
<div class="min-h-0 flex-1">
  <NScrollbar class="h-full">
    ...
  </NScrollbar>
</div>

// 底部
<div class="border-t border-neutral-200 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
```

### 列表项样式

```tsx
// 基础列表项
<div
  class={[
    'flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3',
    'transition-colors last:border-b-0 dark:border-neutral-800/50',
    selected
      ? 'bg-neutral-100 dark:bg-neutral-800'
      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
  ]}
>
```

### 空状态

```tsx
<div class="flex flex-col items-center justify-center py-24 text-center">
  <InboxIcon class="mb-4 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
  <p class="text-sm text-neutral-500">暂无数据</p>
  <p class="mt-1 text-xs text-neutral-400">描述文字</p>
</div>
```

### 加载状态

```tsx
<div class="flex items-center justify-center py-24">
  <div class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
</div>
```

---

## 详情面板 (Detail Panel)

### 结构

```
┌─────────────────────────────────┐
│ Header (h-12)                   │  ← 返回按钮(mobile) + 标题 + 操作
│ border-b                        │
├─────────────────────────────────┤
│                                 │
│ NScrollbar (flex-1 min-h-0)     │  ← 可滚动内容
│   └── Content                   │
│       (max-w-3xl mx-auto p-6)   │     内容居中限宽
│                                 │
├─────────────────────────────────┤
│ Footer (可选)                   │  ← 操作区/输入框
│ border-t                        │
└─────────────────────────────────┘
```

### 样式规范

```tsx
// 容器
<div class="flex h-full flex-col bg-white dark:bg-black">

// 头部
<div class="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
  <div class="flex items-center gap-3">
    {/* Mobile 返回按钮 */}
    {isMobile && (
      <button class="-ml-2 flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100">
        <ArrowLeftIcon class="h-5 w-5" />
      </button>
    )}
    <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
      详情标题
    </h2>
  </div>
  <div class="flex items-center gap-1">
    {/* 操作按钮 */}
  </div>
</div>

// 内容区域
<NScrollbar class="min-h-0 flex-1">
  <div class="mx-auto max-w-3xl space-y-6 p-6">
    ...
  </div>
</NScrollbar>
```

### 操作按钮

```tsx
const ActionButton = (props: { icon: any; onClick: () => void; label: string }) => (
  <NTooltip>
    {{
      trigger: () => (
        <button
          onClick={props.onClick}
          class="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <props.icon class="h-4 w-4" />
        </button>
      ),
      default: () => props.label,
    }}
  </NTooltip>
)

// 危险操作按钮
class="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500"
```

### 空状态

```tsx
<div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
  <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
    <Icon class="size-8 text-neutral-400" />
  </div>
  <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
    选择一个项目
  </h3>
  <p class="text-sm text-neutral-500 dark:text-neutral-400">
    从左侧列表选择查看详情
  </p>
</div>
```

---

## 子列表样式

详情面板内的子列表（如专栏下的文章列表）使用简洁的行样式，不使用卡片。

```tsx
// 子列表项
<div class="group flex items-center justify-between border-b border-neutral-100 px-0 py-2.5 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800/50 dark:hover:bg-neutral-800/30">
  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-2">
      <span class="shrink-0 font-mono text-xs text-neutral-400">
        #123
      </span>
      <span class="truncate text-sm text-neutral-900 dark:text-neutral-100">
        标题
      </span>
      <span class="shrink-0 text-xs text-neutral-400">
        时间
      </span>
    </div>
  </div>
  <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
    {/* 操作按钮 */}
  </div>
</div>
```

---

## 颜色规范

| 用途 | Light | Dark |
|------|-------|------|
| 列表面板背景 | `bg-white` | `dark:bg-neutral-900` |
| 详情面板背景 | `bg-neutral-50` | `dark:bg-neutral-950` |
| 边框 | `border-neutral-200` | `dark:border-neutral-800` |
| 次要边框 | `border-neutral-100` | `dark:border-neutral-800/50` |
| 选中项背景 | `bg-neutral-100` | `dark:bg-neutral-800` |
| 悬停背景 | `hover:bg-neutral-50` | `dark:hover:bg-neutral-800/30` |
| 主要文字 | `text-neutral-900` | `dark:text-neutral-100` |
| 次要文字 | `text-neutral-500` | `dark:text-neutral-400` |
| 辅助文字 | `text-neutral-400` | `dark:text-neutral-500` |

---

## 响应式行为

### Desktop (≥1024px)
- 使用 `NSplit` 分栏布局
- 列表和详情同时显示
- 可拖拽调整比例

### Mobile/Tablet (<1024px)
- 全屏切换模式
- 默认显示列表
- 选中项目后滑动切换到详情
- 详情头部显示返回按钮

```tsx
const { isMobile } = useMasterDetailLayout()

const handleSelect = (item) => {
  selectedId.value = item.id
  if (isMobile.value) {
    showDetailOnMobile.value = true
  }
}

const handleBack = () => {
  showDetailOnMobile.value = false
}
```

---

## 应用页面

- `/comments` - 评论管理
- `/drafts` - 草稿管理
- `/notes/topic` - 专栏管理
