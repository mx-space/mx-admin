import type { PaginateResult } from '~/models/base'
import type { NoteModel } from '~/models/note'
import type { PostModel } from '~/models/post'

import { request } from '~/utils/request'

export interface SearchParams {
  keyword: string
  page?: number
  size?: number
}

export const searchApi = {
  // 搜索博文
  searchPosts: (params: SearchParams) =>
    request.get<PaginateResult<PostModel>>('/search/post', { params }),

  // 搜索手记
  searchNotes: (params: SearchParams) =>
    request.get<PaginateResult<NoteModel>>('/search/note', { params }),
}
