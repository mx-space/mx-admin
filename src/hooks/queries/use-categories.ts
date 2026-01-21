import { computed, toValue } from 'vue'
import { toast } from 'vue-sonner'
import type {
  CreateCategoryData,
  GetCategoriesParams,
  UpdateCategoryData,
} from '~/api/categories'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { categoriesApi } from '~/api/categories'

import { queryKeys } from './keys'

/**
 * 分类列表查询
 */
export const useCategoriesQuery = (
  params?: MaybeRefOrGetter<GetCategoriesParams>,
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.categories.list()),
    queryFn: () => categoriesApi.getList(toValue(params)),
  })
}

/**
 * 标签列表查询
 */
export const useTagsQuery = () => {
  return useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: categoriesApi.getTags,
  })
}

/**
 * 标签关联文章查询
 */
export const usePostsByTagQuery = (tagName: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.tags.postsByTag(toValue(tagName))),
    queryFn: () => categoriesApi.getPostsByTag(toValue(tagName)),
    enabled: computed(() => !!toValue(tagName)),
  })
}

/**
 * 单个分类查询
 */
export const useCategoryQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.categories.detail(toValue(id))),
    queryFn: () => categoriesApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建分类
 */
export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryData) => categoriesApi.create(data),
    onSuccess: () => {
      toast.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

/**
 * 更新分类
 */
export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      categoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      toast.success('修改成功')
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() })
    },
  })
}

/**
 * 删除分类
 */
export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}
