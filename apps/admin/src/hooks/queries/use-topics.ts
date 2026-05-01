import { computed, toValue } from 'vue'
import { toast } from 'vue-sonner'
import type { CreateTopicData, UpdateTopicData } from '~/api/topics'
import type { TopicModel } from '~/models/topic'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { topicsApi } from '~/api/topics'

import { queryKeys } from './keys'

/**
 * 专栏列表查询
 */
export const useTopicsQuery = (
  params?: MaybeRefOrGetter<{ page?: number; size?: number }>,
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.topics.list()),
    queryFn: () => topicsApi.getList(toValue(params)),
  })
}

/**
 * 单个专栏查询
 */
export const useTopicQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.topics.detail(toValue(id))),
    queryFn: () => topicsApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建专栏
 */
export const useCreateTopicMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTopicData) => topicsApi.create(data),
    onSuccess: () => {
      toast.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    },
  })
}

/**
 * 更新专栏
 */
export const useUpdateTopicMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTopicData }) =>
      topicsApi.update(id, data),
    onSuccess: (_, { id }) => {
      toast.success('修改成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
    },
  })
}

/**
 * 部分更新专栏
 */
export const usePatchTopicMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TopicModel> }) =>
      topicsApi.patch(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.list() })
    },
  })
}

/**
 * 删除专栏
 */
export const useDeleteTopicMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: topicsApi.delete,
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    },
  })
}
