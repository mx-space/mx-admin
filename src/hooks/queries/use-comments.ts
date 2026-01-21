import { computed, toValue } from 'vue'
import { toast } from 'vue-sonner'
import type { GetCommentsParams, ReplyCommentData } from '~/api/comments'
import type { MaybeRefOrGetter } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { commentsApi } from '~/api/comments'

import { queryKeys } from './keys'

/**
 * 评论列表查询
 */
export const useCommentsQuery = (
  params?: MaybeRefOrGetter<GetCommentsParams>,
) => {
  const paramsValue = computed(() => toValue(params))
  return useQuery({
    queryKey: computed(() =>
      queryKeys.comments.list(paramsValue.value?.state, paramsValue.value),
    ),
    queryFn: () => commentsApi.getList(paramsValue.value),
  })
}

/**
 * 回复评论
 */
export const useReplyCommentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReplyCommentData }) =>
      commentsApi.reply(id, data),
    onSuccess: () => {
      toast.success('回复成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })
}

/**
 * 更新评论状态
 */
export const useUpdateCommentStateMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, state }: { id: string; state: number }) =>
      commentsApi.updateState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })
}

/**
 * 批量更新评论状态
 */
export const useBatchUpdateCommentStateMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, state }: { ids: string[]; state: number }) =>
      commentsApi.batchUpdateState(ids, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })
}

/**
 * 删除评论
 */
export const useDeleteCommentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: commentsApi.delete,
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })
}

/**
 * 批量删除评论
 */
export const useBatchDeleteCommentsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: commentsApi.batchDelete,
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })
}
