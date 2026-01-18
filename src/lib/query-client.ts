import { QueryClient, type QueryClientConfig } from '@tanstack/vue-query'

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
      // 数据过期时间：5分钟
      staleTime: 5 * 60 * 1000,
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
      // 重新挂载时不自动刷新
      refetchOnMount: false,
    },
    mutations: {
      // mutation 错误处理
      onError: handleQueryError,
    },
  },
}

export const queryClient = new QueryClient(queryClientConfig)

// 用于组件外部访问
export const getQueryClient = () => queryClient
