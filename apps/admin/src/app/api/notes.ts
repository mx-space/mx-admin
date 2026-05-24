import type { PaginateResult } from '~/app/models/base'
import type { NoteModel } from '~/app/models/note'

import { deleteJson, getJson, patchJson, postJson, putJson } from './http'

export type NoteSortKey =
  | 'createdAt'
  | 'modifiedAt'
  | 'mood'
  | 'title'
  | 'weather'
export type SortOrder = 'asc' | 'desc'

export interface GetNotesParams {
  page?: number
  size?: number
  sort_by?: NoteSortKey
  sort_order?: SortOrder
  topicId?: null | string
}

export interface CreateNoteData {
  bookmark?: boolean
  content?: string
  contentFormat?: 'lexical' | 'markdown'
  draftId?: string
  isPublished?: boolean
  location?: null | string
  meta?: Record<string, unknown>
  mood?: string
  password?: null | string
  publicAt?: Date | null
  slug?: string
  text: string
  title: string
  topicId?: null | string
  weather?: string
}

export interface PatchNoteData {
  [key: string]: unknown
  slug?: null | string
  topicId?: null | string
}

export function getNotes(params: GetNotesParams = {}) {
  return getJson<PaginateResult<NoteModel>>('/notes', {
    page: params.page,
    size: params.size,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    topicId: params.topicId ?? undefined,
  })
}

export function getNoteById(id: string, params?: { single?: boolean }) {
  return getJson<NoteModel>(`/notes/${id}`, {
    single: params?.single ? 'true' : undefined,
  })
}

export function createNote(data: CreateNoteData) {
  return postJson<NoteModel, CreateNoteData>('/notes', data)
}

export function updateNote(id: string, data: Partial<CreateNoteData>) {
  return putJson<NoteModel, Partial<CreateNoteData>>(`/notes/${id}`, data)
}

export function patchNote(id: string, data: PatchNoteData) {
  return patchJson<NoteModel, PatchNoteData>(`/notes/${id}`, data)
}

export function patchNotePublish(id: string, isPublished: boolean) {
  return patchJson<NoteModel, { isPublished: boolean }>(
    `/notes/${id}/publish`,
    {
      isPublished,
    },
  )
}

export function deleteNote(id: string) {
  return deleteJson<void>(`/notes/${id}`)
}
