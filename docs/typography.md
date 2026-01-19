# 字号规范

本文档定义了 MX Admin 项目的字号层级规范，确保整个应用的视觉一致性。

## 字号层级

| 用途 | Tailwind 类 | 大小 | 使用场景 |
|------|-------------|------|----------|
| 页面大标题 | `text-2xl` | 24px | 设置页用户名、主页面标题 |
| 区块标题 | `text-xl` | 20px | 用户配置页主标题 |
| 卡片/Modal 标题 | `text-lg` | 18px | 卡片标题、Modal 标题、确认对话框标题 |
| 次级标题 | `text-base` | 16px | 卡片内容标题、统计数字 |
| 正文/列表标题 | `text-sm` | 14px | 列表项标题、表单标签、正文、按钮文字 |
| 辅助文字 | `text-xs` | 12px | 元数据、时间戳、描述、标签、徽章 |

## 使用规则

### 禁止使用任意值字号

不要使用 `text-[Xpx]` 形式的任意值字号，如：
- `text-[10px]`
- `text-[11px]`
- `text-[13px]`
- `text-[14px]`
- `text-[15px]`

### 替换对照表

| 任意值 | 替换为 |
|--------|--------|
| `text-[10px]` | `text-xs` |
| `text-[11px]` | `text-xs` |
| `text-[12px]` | `text-xs` |
| `text-[13px]` | `text-sm` |
| `text-[14px]` | `text-sm` |
| `text-[15px]` | `text-sm` |
| `text-[20px]` | `text-xl` |

## 代码示例

```tsx
// 正确示例
<h1 className="text-2xl font-bold">页面标题</h1>
<h2 className="text-xl font-semibold">区块标题</h2>
<h3 className="text-lg font-medium">卡片标题</h3>
<p className="text-sm">正文内容</p>
<span className="text-xs text-neutral-500">时间戳或元数据</span>

// 错误示例 - 不要使用
<span className="text-[11px]">...</span>
<p className="text-[13px]">...</p>
```

## NaiveUI 组件字号配置

NaiveUI 组件的字号通过全局主题配置统一管理，配置位于 `src/utils/color.ts` 的 `componentThemeOverrides`：

| 组件 | Small | Medium | Large | 备注 |
|------|-------|--------|-------|------|
| DataTable | 12px | 14px | 14px | 表头 font-weight: 500 |
| Form | 12px | 14px | 14px | 标签和反馈信息 |
| Input | 12px | 14px | 14px | |
| Button | 12px | 14px | 14px | Tiny: 12px |
| Card | 14px | 14px | 14px | 标题: 16/18/18px |
| Tag | 12px | 12px | 14px | |
| Select | 12px | 14px | 14px | |
| Tabs | 12px | 14px | 14px | |

## 验证

可使用以下命令检查是否存在违规的任意值字号：

```bash
grep -r "text-\[\d\+px\]" src/
```

**例外情况**：CSS 变量形式的任意值是允许的，如 `text-[var(--sidebar-text)]`
