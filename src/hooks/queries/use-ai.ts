import { computed, toValue } from 'vue'
import type { AIModelListData, ProviderModel } from '~/api/ai'
import type { MaybeRefOrGetter } from 'vue'

import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { aiApi } from '~/api/ai'

import { queryKeys } from './keys'

/**
 * 获取所有 AI Provider 的模型列表
 * 数据会自动持久化到 localStorage
 */
export const useAIModelsQuery = (enabled?: MaybeRefOrGetter<boolean>) => {
  return useQuery({
    queryKey: queryKeys.ai.models(),
    queryFn: async () => {
      const response = await aiApi.getModels()
      const result: Record<string, ProviderModel[]> = {}
      for (const providerData of response) {
        if (providerData.models) {
          result[providerData.provider] = providerData.models
        }
      }
      return result
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
    enabled: computed(() => (enabled !== undefined ? toValue(enabled) : true)),
  })
}

/**
 * 获取单个 Provider 的模型列表
 */
export const useProviderModelsQuery = (
  data: MaybeRefOrGetter<AIModelListData | null>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) => {
  return useQuery({
    queryKey: computed(() => [
      ...queryKeys.ai.models(),
      'provider',
      toValue(data)?.providerId,
    ]),
    queryFn: async () => {
      const params = toValue(data)
      if (!params) return { models: [] as ProviderModel[], error: undefined }
      return aiApi.getModelList(params)
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: computed(
      () =>
        !!toValue(data)?.providerId &&
        (options?.enabled !== undefined ? toValue(options.enabled) : true),
    ),
  })
}

/**
 * 刷新 AI 模型缓存
 */
export const useRefreshAIModelsCache = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ai.models() })
  }
}

/**
 * 手动更新模型缓存
 */
export const useUpdateModelsCache = () => {
  const queryClient = useQueryClient()

  return (providerId: string, models: ProviderModel[]) => {
    const currentData =
      queryClient.getQueryData<Record<string, ProviderModel[]>>(
        queryKeys.ai.models(),
      ) || {}

    queryClient.setQueryData(queryKeys.ai.models(), {
      ...currentData,
      [providerId]: models,
    })
  }
}
