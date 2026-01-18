import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { notesApi, type CreateNoteData, type UpdateNoteData } from '~/api/notes'
import type { NoteModel } from '~/models/note'
import { queryKeys } from './keys'

/**
 * 日记列表查询
 */
export const useNotesQuery = (
  params?: MaybeRefOrGetter<{ page?: number; size?: number }>,
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.notes.list(toValue(params))),
    queryFn: () => notesApi.getList(toValue(params)),
  })
}

/**
 * 单篇日记查询
 */
export const useNoteQuery = (
  id: MaybeRefOrGetter<string>,
  options?: { single?: boolean },
) => {
  return useQuery({
    queryKey: computed(() => queryKeys.notes.detail(toValue(id))),
    queryFn: () => notesApi.getById(toValue(id), options),
    enabled: computed(() => !!toValue(id)),
  })
}

/**
 * 创建日记
 */
export const useCreateNoteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateNoteData) => notesApi.create(data),
    onSuccess: () => {
      window.message.success('发布成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() })
    },
  })
}

/**
 * 更新日记
 */
export const useUpdateNoteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteData }) =>
      notesApi.update(id, data),
    onSuccess: (_, { id }) => {
      window.message.success('修改成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() })
    },
  })
}

/**
 * 部分更新日记
 */
export const usePatchNoteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NoteModel> }) =>
      notesApi.patch(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() })
    },
  })
}

/**
 * 删除日记
 */
export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => {
      window.message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() })
    },
  })
}
