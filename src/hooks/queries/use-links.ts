import { computed, toValue } from 'vue'
import { toast } from 'vue-sonner'
import type {
  CreateLinkData,
  GetLinksParams,
  UpdateLinkData,
} from '~/api/links'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { linksApi } from '~/api/links'

import { queryKeys } from './keys'

/**
 * 友链列表查询
 */
export const useLinksQuery = (params?: MaybeRefOrGetter<GetLinksParams>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.links.list(toValue(params))),
    queryFn: () => linksApi.getList(toValue(params)),
  })
}

/**
 * 友链状态计数查询
 */
export const useLinkStateCountQuery = () => {
  return useQuery({
    queryKey: queryKeys.links.stateCount(),
    queryFn: linksApi.getStateCount,
  })
}

/**
 * 单个友链查询
 */
export const useLinkQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.links.detail(toValue(id))),
    queryFn: () => linksApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建友链
 */
export const useCreateLinkMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLinkData) => linksApi.create(data),
    onSuccess: () => {
      toast.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
    },
  })
}

/**
 * 更新友链
 */
export const useUpdateLinkMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLinkData }) =>
      linksApi.update(id, data),
    onSuccess: (_, { id }) => {
      toast.success('修改成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.links.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.links.stateCount() })
    },
  })
}

/**
 * 审核友链
 */
export const useAuditLinkMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, state }: { id: string; state: number }) =>
      linksApi.updateState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
    },
  })
}

/**
 * 删除友链
 */
export const useDeleteLinkMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: linksApi.delete,
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
    },
  })
}

/**
 * 检查友链健康状态
 */
export const useCheckLinkHealthMutation = () => {
  return useMutation({
    mutationFn: linksApi.checkHealth,
    onSuccess: () => {
      toast.success('检查完成')
    },
  })
}
