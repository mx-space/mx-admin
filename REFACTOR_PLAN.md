# MX Admin React 重构计划

> 将 Vue 3 管理后台完整迁移至 React 技术栈

## 目标技术栈

| 类别       | 技术选型                                  |
| ---------- | ----------------------------------------- |
| 框架       | React 18+                                 |
| 路由       | React Router DOM v6                       |
| 全局状态   | Zustand                                   |
| 原子状态   | Jotai                                     |
| 服务端状态 | TanStack Query v5                         |
| 样式       | Tailwind CSS v3                           |
| UI 组件    | Headless UI + Radix UI (自建 Linear 风格) |
| 表单       | React Hook Form + Zod                     |
| 构建       | Vite                                      |
| 类型       | TypeScript                                |

## 项目规模

- **源码行数**: ~16,000 行
- **页面模块**: 21 个
- **组件数量**: 100+
- **全局 Store**: 4 个
- **自定义 Hook**: 10+

---

## 阶段规划

### Phase 0: 项目初始化 [预计 1 个会话]

#### 0.1 创建项目结构

```bash
# 在同级目录创建新项目
pnpm create vite mx-admin-react --template react-ts
cd mx-admin-react
```

#### 0.2 安装依赖

```bash
# 核心依赖
pnpm add react-router-dom zustand jotai @tanstack/react-query

# UI 相关
pnpm add tailwindcss postcss autoprefixer
pnpm add @headlessui/react @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-tabs
pnpm add clsx tailwind-merge class-variance-authority

# 表单
pnpm add react-hook-form @hookform/resolvers zod

# 工具
pnpm add date-fns @mx-space/api-client
pnpm add lucide-react  # 图标

# 编辑器 (后续阶段)
pnpm add @uiw/react-codemirror @codemirror/lang-markdown
pnpm add @monaco-editor/react

# 开发依赖
pnpm add -D @types/react @types/react-dom
pnpm add -D @tanstack/react-query-devtools
```

#### 0.3 目录结构

```
src/
├── app/                    # 应用入口
│   ├── App.tsx
│   ├── providers.tsx       # 全局 Providers 组合
│   └── router.tsx          # 路由配置
├── components/             # 可复用组件
│   ├── ui/                 # 基础 UI 组件 (Button, Input, Dialog...)
│   ├── editor/             # 编辑器组件
│   ├── layout/             # 布局组件
│   └── shared/             # 业务共享组件
├── features/               # 功能模块 (按页面划分)
│   ├── dashboard/
│   ├── posts/
│   ├── notes/
│   ├── comments/
│   ├── settings/
│   └── ...
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具库
│   ├── api.ts              # API 客户端封装
│   ├── utils.ts            # 工具函数
│   └── cn.ts               # className 合并工具
├── stores/                 # Zustand stores
├── atoms/                  # Jotai atoms
├── types/                  # TypeScript 类型
└── styles/                 # 全局样式
```

#### 0.4 配置文件

**tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Linear 风格色板
        primary: {
          DEFAULT: '#5E6AD2',
          hover: '#7C85DE',
          pressed: '#4E5BBF',
        },
        background: {
          DEFAULT: '#0D0D0D',
          secondary: '#1A1A1A',
          tertiary: '#262626',
        },
        border: {
          DEFAULT: '#2E2E2E',
          hover: '#3E3E3E',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#9CA3AF',
          tertiary: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

**vite.config.ts**

```typescript
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

### Phase 1: 基础架构 [预计 2 个会话]

#### 1.1 API 层封装

**文件**: `src/lib/api.ts`

基于 TanStack Query 封装 API 调用：

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      retry: 1,
    },
  },
})

// API 基础配置
const API_URL = import.meta.env.VITE_API_URL || ''

export async function fetcher<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}
```

#### 1.2 Zustand Stores

**文件**: `src/stores/user.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  user: UserModel | null
  token: string
  setUser: (user: UserModel) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: '',
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: '' }),
    }),
    { name: 'user-storage' },
  ),
)
```

**文件**: `src/stores/ui.ts`

```typescript
import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  isDark: boolean
  toggleSidebar: () => void
  toggleDark: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  isDark: true, // 默认暗色主题
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDark: () => set((s) => ({ isDark: !s.isDark })),
}))
```

#### 1.3 Jotai Atoms

**文件**: `src/atoms/index.ts`

```typescript
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// 编辑器偏好
export const editorModeAtom = atomWithStorage<'codemirror' | 'monaco'>(
  'editor-mode',
  'codemirror',
)

// 表单草稿 (自动保存)
export const postDraftAtom = atomWithStorage('post-draft', null)
export const noteDraftAtom = atomWithStorage('note-draft', null)

// UI 瞬时状态
export const commandPaletteOpenAtom = atom(false)
```

#### 1.4 Providers 组合

**文件**: `src/app/providers.tsx`

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'

import { queryClient } from '@/lib/api'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>{children}</JotaiProvider>
    </QueryClientProvider>
  )
}
```

---

### Phase 2: 路由与布局 [预计 2 个会话]

#### 2.1 路由配置

**文件**: `src/app/router.tsx`

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', lazy: () => import('@/features/dashboard') },

      // 文章模块
      { path: 'posts', lazy: () => import('@/features/posts/list') },
      { path: 'posts/edit/:id?', lazy: () => import('@/features/posts/edit') },
      {
        path: 'posts/category',
        lazy: () => import('@/features/posts/category'),
      },

      // 笔记模块
      { path: 'notes', lazy: () => import('@/features/notes/list') },
      { path: 'notes/edit/:id?', lazy: () => import('@/features/notes/edit') },
      { path: 'notes/topic', lazy: () => import('@/features/notes/topic') },

      // 评论
      { path: 'comments', lazy: () => import('@/features/comments') },

      // 页面
      { path: 'pages', lazy: () => import('@/features/pages/list') },
      { path: 'pages/edit/:id?', lazy: () => import('@/features/pages/edit') },

      // 说说
      { path: 'says', lazy: () => import('@/features/says/list') },
      { path: 'says/edit/:id?', lazy: () => import('@/features/says/edit') },

      // 项目
      { path: 'projects', lazy: () => import('@/features/projects/list') },
      {
        path: 'projects/edit/:id?',
        lazy: () => import('@/features/projects/edit'),
      },

      // 速记
      { path: 'recently', lazy: () => import('@/features/recently') },

      // 朋友
      { path: 'friends', lazy: () => import('@/features/friends') },

      // 数据分析
      { path: 'analyze', lazy: () => import('@/features/analyze') },

      // 设置
      { path: 'settings/:tab?', lazy: () => import('@/features/settings') },

      // 附加功能
      { path: 'snippets', lazy: () => import('@/features/snippets') },
      { path: 'webhooks', lazy: () => import('@/features/webhooks') },
      { path: 'markdown', lazy: () => import('@/features/markdown-helper') },

      // 维护
      {
        path: 'maintenance/cron',
        lazy: () => import('@/features/maintenance/cron'),
      },
      {
        path: 'maintenance/backup',
        lazy: () => import('@/features/maintenance/backup'),
      },
      {
        path: 'maintenance/log',
        lazy: () => import('@/features/maintenance/log'),
      },

      // AI
      { path: 'ai/summary', lazy: () => import('@/features/ai/summary') },
    ],
  },

  // 公开路由
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', lazy: () => import('@/features/auth/login') },
      { path: 'setup', lazy: () => import('@/features/auth/setup') },
    ],
  },
])
```

#### 2.2 AppLayout 组件

**文件**: `src/components/layout/app-layout.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom'

import { cn } from '@/lib/cn'
import { useUIStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'

import { Header } from './header'
import { Sidebar } from './sidebar'

export function AppLayout() {
  const { user, token } = useUserStore()
  const { sidebarCollapsed, isDark } = useUIStore()

  // 未登录重定向
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className={cn('bg-background min-h-screen', isDark && 'dark')}>
      <Sidebar collapsed={sidebarCollapsed} />
      <main
        className={cn(
          'transition-all duration-200',
          sidebarCollapsed ? 'ml-16' : 'ml-64',
        )}
      >
        <Header />
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

#### 2.3 Sidebar 组件

**文件**: `src/components/layout/sidebar.tsx`

侧边栏需要实现：

- Logo + 收起按钮
- 导航菜单组 (带图标)
- 当前路由高亮
- 收起状态下只显示图标

```tsx
const menuGroups = [
  {
    title: '内容',
    items: [
      { path: '/dashboard', icon: Home, label: '仪表盘' },
      { path: '/posts', icon: FileText, label: '博文' },
      { path: '/notes', icon: BookOpen, label: '手记' },
      { path: '/pages', icon: File, label: '页面' },
      { path: '/comments', icon: MessageSquare, label: '评论' },
    ],
  },
  {
    title: '数据',
    items: [
      { path: '/friends', icon: Users, label: '朋友' },
      { path: '/says', icon: Quote, label: '说说' },
      { path: '/recently', icon: Clock, label: '速记' },
      { path: '/projects', icon: Folder, label: '项目' },
    ],
  },
  {
    title: '系统',
    items: [
      { path: '/analyze', icon: BarChart, label: '分析' },
      { path: '/settings', icon: Settings, label: '设置' },
      { path: '/snippets', icon: Code, label: '配置' },
    ],
  },
]
```

---

### Phase 3: 基础 UI 组件库 [预计 3 个会话]

构建 Linear 风格的基础组件：

#### 3.1 Button

**文件**: `src/components/ui/button.tsx`

变体：`primary`, `secondary`, `ghost`, `danger`
尺寸：`sm`, `md`, `lg`

#### 3.2 Input / Textarea

**文件**: `src/components/ui/input.tsx`

- 标准输入框
- 带前缀/后缀
- 错误状态

#### 3.3 Dialog / Modal

**文件**: `src/components/ui/dialog.tsx`

基于 Radix Dialog，添加：

- 确认对话框
- 表单对话框

#### 3.4 Dropdown Menu

**文件**: `src/components/ui/dropdown.tsx`

基于 Radix DropdownMenu

#### 3.5 Table

**文件**: `src/components/ui/table.tsx`

- 可排序
- 可选择行
- 分页

#### 3.6 Tabs

**文件**: `src/components/ui/tabs.tsx`

基于 Radix Tabs

#### 3.7 Toast / Notification

**文件**: `src/components/ui/toast.tsx`

轻量通知系统

#### 3.8 Tooltip

**文件**: `src/components/ui/tooltip.tsx`

基于 Radix Tooltip

#### 3.9 Command Palette

**文件**: `src/components/ui/command.tsx`

仿 Linear 的 Cmd+K 命令面板

---

### Phase 4: 核心功能迁移 [预计 5-8 个会话]

按优先级迁移页面：

#### 4.1 登录/认证 [优先级: P0]

**文件**: `src/features/auth/login.tsx`

- 登录表单
- OAuth 集成
- Token 存储

#### 4.2 仪表盘 [优先级: P0]

**文件**: `src/features/dashboard/index.tsx`

- 统计卡片组件
- 数据获取 (TanStack Query)

```tsx
// 示例: 使用 TanStack Query
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetcher('/api/aggregate'),
  })
}
```

#### 4.3 文章管理 [优先级: P0]

**列表页**: `src/features/posts/list.tsx`

- 数据表格
- 筛选/排序
- 批量操作

**编辑页**: `src/features/posts/edit.tsx`

- 表单 (React Hook Form)
- Markdown 编辑器
- 分类/标签选择
- 自动保存 (Jotai)
- AI 辅助按钮

```tsx
// 示例: 文章列表 Query
export function usePostsList(params: PostsParams) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => fetcher(`/api/posts?${qs.stringify(params)}`),
  })
}

// 示例: 更新文章 Mutation
export function useUpdatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) =>
      fetcher(`/api/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
```

#### 4.4 笔记管理 [优先级: P1]

类似文章，额外包含：

- 地理位置选择
- 心情/天气
- 专栏/话题

#### 4.5 评论管理 [优先级: P1]

- 评论列表
- 回复功能
- 状态切换 (审核/垃圾)

#### 4.6 设置页面 [优先级: P1]

- 用户信息
- 系统设置
- 安全设置
- OAuth 配置
- AI 配置

#### 4.7 其他模块 [优先级: P2]

- 页面管理
- 说说管理
- 项目管理
- 友链管理
- 速记管理
- 数据分析
- Snippets/云函数
- Webhooks
- 维护功能

---

### Phase 5: 编辑器组件 [预计 2 个会话]

#### 5.1 Markdown 编辑器

**文件**: `src/components/editor/markdown-editor.tsx`

基于 CodeMirror 6 或 Monaco：

```tsx
import CodeMirror from '@uiw/react-codemirror'

import { markdown } from '@codemirror/lang-markdown'

export function MarkdownEditor({ value, onChange }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[markdown()]}
      theme="dark"
      className="min-h-[400px]"
    />
  )
}
```

#### 5.2 编辑器工具栏

快捷操作：粗体、斜体、链接、代码块、图片等

#### 5.3 Monaco 编辑器包装

用于代码编辑 (Snippets/云函数)

---

### Phase 6: 高级功能 [预计 2 个会话]

#### 6.1 WebSocket 集成

实时更新通知

#### 6.2 自动保存

使用 Jotai + localStorage

#### 6.3 命令面板

Cmd+K 快捷操作

#### 6.4 终端模拟器

XTerm.js 集成 (维护页面)

---

### Phase 7: 测试与优化 [预计 2 个会话]

#### 7.1 组件测试

使用 Vitest + Testing Library

#### 7.2 E2E 测试

使用 Playwright

#### 7.3 性能优化

- Bundle 分析
- 懒加载优化
- Query 缓存调优

---

## 迁移映射表

### Vue → React 概念映射

| Vue 3            | React                         | 说明       |
| ---------------- | ----------------------------- | ---------- |
| `ref()`          | `useState()`                  | 响应式状态 |
| `reactive()`     | `useState()` / `useReducer()` | 对象状态   |
| `computed()`     | `useMemo()`                   | 计算属性   |
| `watch()`        | `useEffect()`                 | 副作用监听 |
| `onMounted()`    | `useEffect(() => {}, [])`     | 挂载回调   |
| `onUnmounted()`  | `useEffect` 返回清理函数      | 卸载清理   |
| `defineProps()`  | Props 类型定义                | 组件参数   |
| `defineEmits()`  | 回调函数 Props                | 事件发射   |
| `provide/inject` | `Context`                     | 依赖注入   |
| `v-model`        | `value` + `onChange`          | 双向绑定   |
| `v-if`           | `{condition && <Comp />}`     | 条件渲染   |
| `v-for`          | `.map()`                      | 列表渲染   |
| `<slot>`         | `children` / `render props`   | 插槽       |

### Pinia → Zustand 映射

```typescript
// Vue (Pinia)
export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const setUser = (u) => { user.value = u }
  return { user, setUser }
})

// React (Zustand)
export const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

### API 调用映射

```typescript
// Vue (RESTManager)
const { data } = await RESTManager.api.posts.get({ params })

// React (TanStack Query)
const { data } = useQuery({
  queryKey: ['posts', params],
  queryFn: () => fetcher('/api/posts', { params }),
})
```

---

## 执行清单 (Checklist)

### Phase 0: 项目初始化

- [ ] 创建新项目 `mx-admin-react`
- [ ] 安装所有依赖
- [ ] 配置 Tailwind CSS
- [ ] 配置 Vite 别名
- [ ] 创建目录结构
- [ ] 配置 TypeScript paths

### Phase 1: 基础架构

- [ ] 实现 API fetcher
- [ ] 创建 QueryClient
- [ ] 实现 useUserStore (Zustand)
- [ ] 实现 useUIStore (Zustand)
- [ ] 创建 Jotai atoms
- [ ] 组合 Providers

### Phase 2: 路由与布局

- [ ] 配置完整路由表
- [ ] 实现 AppLayout
- [ ] 实现 AuthLayout
- [ ] 实现 Sidebar
- [ ] 实现 Header
- [ ] 添加路由守卫

### Phase 3: UI 组件库

- [ ] Button 组件
- [ ] Input / Textarea 组件
- [ ] Select 组件
- [ ] Dialog 组件
- [ ] Dropdown 组件
- [ ] Table 组件
- [ ] Tabs 组件
- [ ] Toast 系统
- [ ] Tooltip 组件
- [ ] Card 组件
- [ ] Badge 组件
- [ ] Switch 组件
- [ ] Command Palette

### Phase 4: 核心功能

- [ ] 登录页面
- [ ] 仪表盘
- [ ] 文章列表
- [ ] 文章编辑
- [ ] 分类管理
- [ ] 笔记列表
- [ ] 笔记编辑
- [ ] 专栏管理
- [ ] 评论管理
- [ ] 设置页面

### Phase 5: 编辑器

- [ ] Markdown 编辑器
- [ ] 编辑器工具栏
- [ ] Monaco 编辑器包装
- [ ] 表情选择器

### Phase 6: 高级功能

- [ ] WebSocket 集成
- [ ] 自动保存
- [ ] 命令面板
- [ ] 终端模拟器

### Phase 7: 测试优化

- [ ] 单元测试配置
- [ ] 关键组件测试
- [ ] Bundle 优化
- [ ] 性能调优

---

## AI 执行指南

### 每个会话的工作模式

1. **开始前**: 阅读此文档，了解当前阶段
2. **执行时**: 每完成一个模块就测试验证
3. **结束时**: 更新 Checklist，记录进度

### 注意事项

1. **保持类型安全**: 所有组件和函数都要有 TypeScript 类型
2. **遵循 Linear 风格**: 暗色主题优先，简洁的设计语言
3. **组件隔离**: 每个组件单独文件，避免超过 300 行
4. **复用 API 模型**: 从 `@mx-space/api-client` 获取类型定义
5. **渐进式迁移**: 先搭骨架，再填充功能

### 单个组件迁移流程

```
1. 阅读 Vue 源码，理解功能
2. 创建 React 组件文件
3. 定义 Props 类型
4. 实现 UI 结构 (JSX)
5. 添加状态逻辑 (hooks)
6. 连接 API (TanStack Query)
7. 添加样式 (Tailwind)
8. 测试功能
```

---

## 时间估算

| 阶段     | 会话数    | 说明         |
| -------- | --------- | ------------ |
| Phase 0  | 1         | 项目初始化   |
| Phase 1  | 2         | 基础架构     |
| Phase 2  | 2         | 路由布局     |
| Phase 3  | 3         | UI 组件库    |
| Phase 4  | 5-8       | 核心功能     |
| Phase 5  | 2         | 编辑器       |
| Phase 6  | 2         | 高级功能     |
| Phase 7  | 2         | 测试优化     |
| **总计** | **19-22** | **完整迁移** |

每个"会话"约等于 AI 一次完整的上下文对话（~100k tokens）。

---

## 附录：关键文件参考

迁移时可参考的原项目文件：

- **路由配置**: `src/router/route.tsx`
- **API 封装**: `src/utils/rest.ts`
- **全局状态**: `src/stores/*.ts`
- **布局组件**: `src/layouts/`
- **表格 Hook**: `src/hooks/use-table.ts`
- **自动保存**: `src/hooks/use-auto-save.ts`
- **编辑器**: `src/components/editor/`
- **设置页面**: `src/views/setting/` (最复杂的页面之一)
- **文章编辑**: `src/views/manage-posts/write.tsx`
- **笔记编辑**: `src/views/manage-notes/write.tsx`

---

_文档版本: 1.0_
_创建日期: 2026-01-15_
