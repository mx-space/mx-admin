import type { QueryClientConfig } from '@tanstack/vue-query'

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { persistQueryClient } from '@tanstack/query-persist-client-core'
import { QueryClient } from '@tanstack/vue-query'

import { BusinessError } from '~/utils/request'

// 全局错误处理
const handleQueryError = (error: unknown) => {
  const Message = window.message

  // 仅处理业务错误
  if (error instanceof BusinessError) {
    const messages = error.message.split(', ')
    messages.forEach((msg) => {
      Message.error(msg)
    })
  }

  // 在开发环境打印错误
  if (import.meta.env.DEV) {
    console.error('[Vue Query Error]', error)
  }
}

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // 数据过期时间：0，始终重新验证
      staleTime: 0,
      // 缓存时间：10分钟
      gcTime: 10 * 60 * 1000,
      // 重试策略
      retry: (failureCount, error) => {
        // 业务错误不重试
        if (error instanceof BusinessError) {
          return false
        }
        // 系统错误最多重试 2 次
        return failureCount < 2
      },
      // 重新聚焦时不自动刷新（后台管理系统特性）
      refetchOnWindowFocus: false,
      // 每次进入页面都重新获取数据
      refetchOnMount: true,
    },
    mutations: {
      // mutation 错误处理
      onError: handleQueryError,
    },
  },
}

export const queryClient = new QueryClient(queryClientConfig)

// 配置 localStorage 持久化
const localStoragePersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  },
  key: 'mx-admin-query-cache',
})

// 需要持久化的 query key 前缀
const PERSIST_QUERY_KEYS = ['ai']

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // 只持久化指定的 query keys
      const queryKey = query.queryKey
      if (!Array.isArray(queryKey) || queryKey.length === 0) {
        return false
      }
      return PERSIST_QUERY_KEYS.includes(queryKey[0] as string)
    },
  },
})

// 用于组件外部访问
export const getQueryClient = () => queryClient
