import { computed, toValue } from 'vue'
import type { CreatePostData, UpdatePostData } from '~/api/posts'
import type { PostModel } from '~/models/post'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { postsApi } from '~/api/posts'

import { queryKeys } from './keys'

/**
 * 文章列表查询
 */
export const usePostsQuery = (
  params?: MaybeRefOrGetter<{ page?: number; size?: number }>,
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.posts.list(toValue(params))),
    queryFn: () => postsApi.getList(toValue(params)),
  })
}

/**
 * 单篇文章查询
 */
export const usePostQuery = (id: MaybeRefOrGetter<string>) => {
  return useQuery({
    queryKey: computed(() => queryKeys.posts.detail(toValue(id))),
    queryFn: () => postsApi.getById(toValue(id)),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建文章
 */
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePostData) => postsApi.create(data),
    onSuccess: () => {
      window.message.success('发布成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
    },
  })
}

/**
 * 更新文章
 */
export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostData }) =>
      postsApi.update(id, data),
    onSuccess: (_, { id }) => {
      window.message.success('修改成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
    },
  })
}

/**
 * 部分更新文章
 */
export const usePatchPostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PostModel> }) =>
      postsApi.patch(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
    },
  })
}

/**
 * 删除文章
 */
export const useDeletePostMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postsApi.delete,
    onSuccess: () => {
      window.message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
    },
  })
}
