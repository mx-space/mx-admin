import { computed, toValue } from 'vue'
import type {
  CreateDraftData,
  GetDraftsParams,
  UpdateDraftData,
} from '~/api/drafts'
import type { DraftRefType } from '~/models/draft'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'

import { queryKeys } from './keys'

/**
 * 草稿列表查询
 */
export const useDraftsQuery = (params?: MaybeRefOrGetter<GetDraftsParams>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.drafts.list(toValue(params))),
    queryFn: () => draftsApi.getList(toValue(params)),
  })
}

/**
 * 单个草稿查询
 */
export const useDraftQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.drafts.detail(toValue(id))),
    queryFn: () => draftsApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 根据引用获取草稿
 */
export const useDraftByRefQuery = (
  refType: MaybeRefOrGetter<DraftRefType>,
  refId: MaybeRefOrGetter<string>,
) => {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.drafts.byRef(toValue(refType), toValue(refId)),
    ),
    queryFn: () => draftsApi.getByRef(toValue(refType), toValue(refId)),
    enabled: computed(() => !!toValue(refId)),
  })
}

/**
 * 获取草稿历史
 */
export const useDraftHistoryQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.drafts.history(toValue(id))),
    queryFn: () => draftsApi.getHistory(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建草稿
 */
export const useCreateDraftMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDraftData) => draftsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.lists() })
    },
  })
}

/**
 * 更新草稿
 */
export const useUpdateDraftMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDraftData }) =>
      draftsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.lists() })
    },
  })
}

/**
 * 删除草稿
 */
export const useDeleteDraftMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: draftsApi.delete,
    onSuccess: () => {
      window.message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all })
    },
  })
}

/**
 * 恢复历史版本
 */
export const useRestoreDraftVersionMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      draftsApi.restoreVersion(id, version),
    onSuccess: (_, { id }) => {
      window.message.success('恢复成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts.history(id) })
    },
  })
}
