import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { pagesApi, type CreatePageData, type UpdatePageData } from '~/api/pages'
import { queryKeys } from './keys'

/**
 * 页面列表查询
 */
export const usePagesQuery = (
  params?: MaybeRefOrGetter<{ page?: number; size?: number }>,
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.pages.list(toValue(params))),
    queryFn: () => pagesApi.getList(toValue(params)),
  })
}

/**
 * 单个页面查询
 */
export const usePageQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.pages.detail(toValue(id))),
    queryFn: () => pagesApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建页面
 */
export const useCreatePageMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePageData) => pagesApi.create(data),
    onSuccess: () => {
      window.message.success('创建成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.lists() })
    },
  })
}

/**
 * 更新页面
 */
export const useUpdatePageMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePageData }) =>
      pagesApi.update(id, data),
    onSuccess: (_, { id }) => {
      window.message.success('修改成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.lists() })
    },
  })
}

/**
 * 删除页面
 */
export const useDeletePageMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: pagesApi.delete,
    onSuccess: () => {
      window.message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.lists() })
    },
  })
}
