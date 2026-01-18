# RESTManager 迁移方案

本文档描述如何将剩余的 `RESTManager` 调用迁移到 `ofetch + Vue Query` 架构。

## 迁移模式

### 1. 基本替换规则

| 旧模式                                    | 新模式                                     |
| ----------------------------------------- | ------------------------------------------ |
| `RESTManager.api.xxx.get()`               | `xxxApi.getList()` 或 `useQuery`           |
| `RESTManager.api.xxx(id).get()`           | `xxxApi.getById(id)`                       |
| `RESTManager.api.xxx.post({ data })`      | `xxxApi.create(data)` 或 `useMutation`     |
| `RESTManager.api.xxx(id).put({ data })`   | `xxxApi.update(id, data)` 或 `useMutation` |
| `RESTManager.api.xxx(id).patch({ data })` | `xxxApi.patch(id, data)` 或 `useMutation`  |
| `RESTManager.api.xxx(id).delete()`        | `xxxApi.delete(id)` 或 `useMutation`       |

### 2. 导入替换

```typescript
// 删除
import { RESTManager } from '~/utils/rest'
import { RESTManager } from '~/utils'

// 添加 (根据需要)
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { xxxApi } from '~/api/xxx'
import { queryKeys } from '~/hooks/queries/keys'
```

### 3. 数据获取迁移

**场景 A: 简单的 onMounted 获取**

```typescript
// 旧
onMounted(async () => {
  const data = await RESTManager.api.master.get()
  user.value = data
})

// 新
onMounted(async () => {
  const data = await userApi.getMaster()
  user.value = data
})
```

**场景 B: 列表页面使用 useDataTableFetch**

```typescript
// 旧
import { useDataTableFetch } from '~/hooks/use-table'

const { data, pager, fetchDataFn, loading } = useDataTableFetch<Model>(
  (data, pager) => async (page, size) => {
    const res = await RESTManager.api.xxx.get({ params: { page, size } })
    data.value = res.data
    pager.value = res.pagination
  }
)

// 新
import { useDataTable } from '~/hooks/use-data-table'
import { queryKeys } from '~/hooks/queries/keys'

const { data, pager, isLoading: loading } = useDataTable<Model>({
  queryKey: (params) => queryKeys.xxx.list(params),
  queryFn: (params) => xxxApi.getList({ page: params.page, size: params.size }),
  pageSize: 20,
})
```

### 4. 数据变更迁移

**场景 A: 简单的 async 函数调用**

```typescript
// 旧
const handleDelete = async (id: string) => {
  await RESTManager.api.xxx(id).delete()
  message.success('删除成功')
  refresh()
}

// 新
const deleteMutation = useMutation({
  mutationFn: xxxApi.delete,
  onSuccess: () => {
    message.success('删除成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.xxx.all })
  },
})

const handleDelete = (id: string) => {
  deleteMutation.mutate(id)
}
```

**场景 B: 创建/更新操作**

```typescript
// 旧
const handleSubmit = async () => {
  if (id) {
    await RESTManager.api.xxx(id).put({ data: formData })
    message.success('修改成功')
  } else {
    await RESTManager.api.xxx.post({ data: formData })
    message.success('创建成功')
  }
}

// 新
const createMutation = useMutation({
  mutationFn: (data: any) => xxxApi.create(data),
  onSuccess: () => {
    message.success('创建成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.xxx.all })
  },
})

const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: any }) => xxxApi.update(id, data),
  onSuccess: () => {
    message.success('修改成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.xxx.all })
  },
})

const handleSubmit = () => {
  if (id) {
    updateMutation.mutate({ id, data: formData })
  } else {
    createMutation.mutate(formData)
  }
}
```

---

## 待迁移文件清单

### 优先级 1: Setting 页面 (5 文件)

| 文件                                  | RESTManager 调用数 | 涉及 API              |
| ------------------------------------- | ------------------ | --------------------- |
| `setting/tabs/security.tsx`           | 10                 | auth tokens, passkeys |
| `setting/tabs/auth.tsx`               | 7                  | auth, sessions        |
| `setting/tabs/system.tsx`             | 4                  | options/configs       |
| `setting/tabs/sections/oauth.tsx`     | 4                  | oauth clients         |
| `setting/tabs/sections/ai-config.tsx` | 4                  | ai configs            |

### 优先级 2: 核心功能页面 (8 文件)

| 文件                                       | RESTManager 调用数 | 涉及 API     |
| ------------------------------------------ | ------------------ | ------------ |
| `manage-posts/write.tsx`                   | 5                  | posts        |
| `manage-notes/write.tsx`                   | 5                  | notes        |
| `manage-pages/write.tsx`                   | 4                  | pages        |
| `manage-says/components/say-list-item.tsx` | 3                  | says         |
| `manage-files/index.tsx`                   | 4                  | files        |
| `login/index.tsx`                          | 3                  | user/auth    |
| `setup/index.tsx`                          | 6                  | setup/init   |
| `ai/summary.tsx`                           | 7                  | ai summaries |

### 优先级 3: Dashboard 组件 (6 文件)

| 文件                                        | RESTManager 调用数 | 涉及 API  |
| ------------------------------------------- | ------------------ | --------- |
| `dashboard/components/TopArticles.tsx`      | 2                  | aggregate |
| `dashboard/components/PublicationTrend.tsx` | 2                  | aggregate |
| `dashboard/components/TrafficSource.tsx`    | 2                  | aggregate |
| `dashboard/components/CommentActivity.tsx`  | 2                  | aggregate |
| `dashboard/components/TagCloud.tsx`         | 2                  | aggregate |
| `dashboard/components/CategoryPie.tsx`      | 2                  | aggregate |
| `dashboard/update-panel.tsx`                | 2                  | system    |

### 优先级 4: 分析和维护页面 (8 文件)

| 文件                                        | RESTManager 调用数 | 涉及 API |
| ------------------------------------------- | ------------------ | -------- |
| `analyze/index.tsx`                         | 2                  | analyze  |
| `analyze/components/analyze-data-table.tsx` | 3                  | analyze  |
| `analyze/components/guest-activity.tsx`     | 4                  | analyze  |
| `analyze/components/reading-rank.tsx`       | 3                  | activity |
| `maintenance/backup.tsx`                    | 7                  | backup   |
| `maintenance/cron.tsx`                      | 4                  | cron     |
| `maintenance/log-view/tabs/log-list.tsx`    | 4                  | logs     |
| `maintenance/pty/index.tsx`                 | 2                  | pty      |

### 优先级 5: Extra Features (11 文件)

| 文件                                                            | RESTManager 调用数 | 涉及 API        |
| --------------------------------------------------------------- | ------------------ | --------------- |
| `extra-features/webhook/index.tsx`                              | 8                  | webhooks        |
| `extra-features/subscribe/index.tsx`                            | 5                  | subscribe       |
| `extra-features/markdown-helper.tsx`                            | 3                  | markdown        |
| `extra-features/assets/template/tabs/email.tsx`                 | 4                  | email templates |
| `extra-features/snippets/composables/use-snippet-list.ts`       | 5                  | snippets        |
| `extra-features/snippets/composables/use-snippet-editor.ts`     | 4                  | snippets        |
| `extra-features/snippets/components/snippet-card.tsx`           | 2                  | snippets        |
| `extra-features/snippets/components/import-snippets-button.tsx` | 2                  | snippets        |
| `extra-features/snippets/components/update-deps-button.tsx`     | 2                  | snippets        |
| `extra-features/snippets/components/install-dep-xterm.tsx`      | 2                  | snippets        |

### 优先级 6: 其他 (7 文件)

| 文件                                       | RESTManager 调用数 | 涉及 API   |
| ------------------------------------------ | ------------------ | ---------- |
| `debug/events/index.tsx`                   | 2                  | events     |
| `debug/authn/index.tsx`                    | 5                  | authn      |
| `debug/serverless/index.tsx`               | 2                  | serverless |
| `shorthand/index.tsx`                      | 3                  | recently   |
| `reader/index.tsx`                         | 2                  | render     |
| `manage-notes/hooks/use-memo-note-list.ts` | 2                  | notes      |
| `manage-posts/hooks/use-memo-post-list.ts` | 2                  | posts      |

---

## 已有 API 服务文件

以下 API 文件已创建，可直接使用：

```
src/api/
├── aggregate.ts      # 统计聚合
├── categories.ts     # 分类和标签
├── comments.ts       # 评论
├── drafts.ts         # 草稿
├── links.ts          # 友链
├── notes.ts          # 日记
├── pages.ts          # 页面
├── posts.ts          # 文章
├── projects.ts       # 项目
├── says.ts           # 一言
├── system.ts         # 系统
├── topics.ts         # 专栏
└── user.ts           # 用户
```

## 需要新建的 API 文件

根据待迁移文件，可能需要创建以下 API：

```typescript
// src/api/auth.ts - 认证相关
export const authApi = {
  getTokens: () => request.get('/auth/token'),
  createToken: (data) => request.post('/auth/token', { data }),
  deleteToken: (id) => request.delete(`/auth/token/${id}`),
  getPasskeys: () => request.get('/passkey'),
  deletePasskey: (id) => request.delete(`/passkey/${id}`),
}

// src/api/options.ts - 配置相关
export const optionsApi = {
  getAll: () => request.get('/options'),
  patch: (data) => request.patch('/options', { data }),
  getSchema: () => request.get('/options/schema'),
}

// src/api/backup.ts - 备份相关
export const backupApi = {
  getList: () => request.get('/backup'),
  create: () => request.post('/backup'),
  download: (filename) => request.get(`/backup/${filename}`),
  delete: (filename) => request.delete(`/backup/${filename}`),
  rollback: (filename) => request.post(`/backup/rollback/${filename}`),
}

// src/api/analyze.ts - 分析相关
export const analyzeApi = {
  getList: (params) => request.get('/analyze', { params }),
  getAggregate: () => request.get('/analyze/aggregate'),
}

// src/api/snippets.ts - 代码片段相关
export const snippetsApi = {
  getList: (params) => request.get('/snippets', { params }),
  getById: (id) => request.get(`/snippets/${id}`),
  create: (data) => request.post('/snippets', { data }),
  update: (id, data) => request.put(`/snippets/${id}`, { data }),
  delete: (id) => request.delete(`/snippets/${id}`),
}

// src/api/webhooks.ts - Webhook 相关
export const webhooksApi = {
  getList: () => request.get('/webhooks'),
  create: (data) => request.post('/webhooks', { data }),
  update: (id, data) => request.put(`/webhooks/${id}`, { data }),
  delete: (id) => request.delete(`/webhooks/${id}`),
}
```

---

## 迁移步骤

对于每个文件，按以下步骤进行：

1. **检查 API**：确认对应的 API 服务文件是否存在，不存在则创建
2. **更新导入**：删除 `RESTManager` 导入，添加所需的 API 和 Vue Query 导入
3. **替换调用**：按照上述模式替换所有 `RESTManager` 调用
4. **类型检查**：运行 `pnpm tsc --noEmit` 确保无类型错误
5. **功能测试**：在浏览器中验证功能正常

## 注意事项

1. **message 的使用**：组件内使用 `useMessage()` 获取 message 实例，mutation 的 onSuccess 中使用 `window.message`
2. **pager 类型**：使用 `pager as any` 处理 Table 组件的类型不匹配
3. **queryClient**：需要 invalidate 缓存时，通过 `useQueryClient()` 获取
4. **错误处理**：业务错误由 Vue Query 的全局 onError 处理，无需手动 catch
