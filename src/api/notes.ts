import type { PaginateResult } from '~/models/base'
import type { NoteModel } from '~/models/note'

import { request } from '~/utils/request'

export interface GetNotesParams {
  page?: number
  size?: number
  select?: string
  sortBy?: string
  sortOrder?: number
  db_query?: Record<string, boolean>
}

export interface CreateNoteData {
  title: string
  text: string
  mood?: string
  weather?: string
  password?: string | null
  publicAt?: Date | null
  bookmark?: boolean
  location?: string | null
  coordinates?: { longitude: number; latitude: number } | null
  topicId?: string | null
  isPublished?: boolean
  meta?: Record<string, unknown>
  /** 关联的草稿 ID，发布时传递以标记草稿为已发布 */
  draftId?: string
}

export interface UpdateNoteData extends Partial<CreateNoteData> {}

// 用于 patch 操作的数据类型，允许将某些字段设为 null
export interface PatchNoteData {
  topicId?: string | null
  [key: string]: unknown
}

export const notesApi = {
  // 获取日记列表
  getList: (params?: GetNotesParams) =>
    request.get<PaginateResult<NoteModel>>('/notes', { params }),

  // 获取单篇日记
  getById: (id: string, params?: { single?: boolean }) =>
    request.get<NoteModel>(`/notes/${id}`, { params }),

  // 创建日记
  create: (data: CreateNoteData) => request.post<NoteModel>('/notes', { data }),

  // 更新日记
  update: (id: string, data: UpdateNoteData) =>
    request.put<NoteModel>(`/notes/${id}`, { data }),

  // 删除日记
  delete: (id: string) => request.delete<void>(`/notes/${id}`),

  // 更新部分字段
  patch: (id: string, data: PatchNoteData) =>
    request.patch<NoteModel>(`/notes/${id}`, { data }),

  // 更新发布状态
  patchPublish: (id: string, isPublished: boolean) =>
    request.patch<NoteModel>(`/notes/${id}/publish`, { data: { isPublished } }),

  // 获取专栏下的日记列表
  getByTopic: (topicId: string, params?: { page?: number; size?: number }) =>
    request.get<PaginateResult<Partial<NoteModel>>>(
      `/notes/topics/${topicId}`,
      { params },
    ),
}
