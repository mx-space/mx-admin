import { computed, toValue } from 'vue'
import type { MetaPresetQueryParams } from '~/api/meta-presets'
import type {
  CreateMetaPresetDto,
  MetaPresetField,
  UpdateMetaPresetDto,
} from '~/models/meta-preset'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { metaPresetsApi } from '~/api/meta-presets'

import { queryKeys } from './keys'

/**
 * Meta 预设列表查询
 */
export const useMetaPresetsQuery = (
  params?: MaybeRefOrGetter<MetaPresetQueryParams>,
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.metaPresets.list()),
    queryFn: () => metaPresetsApi.getAll(toValue(params)),
    select: (res: any) =>
      (Array.isArray(res) ? res : (res?.data ?? [])) as MetaPresetField[],
  })
}

/**
 * 单个 Meta 预设查询
 */
export const useMetaPresetQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.metaPresets.detail(toValue(id))),
    queryFn: () => metaPresetsApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建 Meta 预设
 */
export const useCreateMetaPresetMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMetaPresetDto) => metaPresetsApi.create(data),
    onSuccess: () => {
      window.message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.metaPresets.all })
    },
  })
}

/**
 * 更新 Meta 预设
 */
export const useUpdateMetaPresetMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMetaPresetDto }) =>
      metaPresetsApi.update(id, data),
    onSuccess: (_, { id }) => {
      window.message.success('修改成功')
      queryClient.invalidateQueries({
        queryKey: queryKeys.metaPresets.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.metaPresets.list() })
    },
  })
}

/**
 * 删除 Meta 预设
 */
export const useDeleteMetaPresetMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: metaPresetsApi.delete,
    onSuccess: () => {
      window.message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.metaPresets.all })
    },
  })
}

/**
 * 批量更新排序
 */
export const useUpdateMetaPresetOrderMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => metaPresetsApi.updateOrder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.metaPresets.list() })
    },
  })
}
