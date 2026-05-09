import type {
  SearchDocumentAdminListParams,
  SearchDocumentAdminListResponse,
  SearchIndexRebuildOneResult,
  SearchIndexRebuildResult,
} from '~/models/search-index'

import { request } from '~/utils/request'

const encode = (v: string) => encodeURIComponent(v)

export const searchIndexApi = {
  /** Trigger a global rebuild. `force=true` clears the table before rebuilding. */
  rebuildAll: (force = false) =>
    request.post<SearchIndexRebuildResult>('/search/rebuild', {
      params: force ? { force: true } : undefined,
    }),

  /** Rebuild index rows for a single (refType, refId). */
  rebuildOne: (refType: string, refId: string) =>
    request.post<SearchIndexRebuildOneResult>(
      `/search/rebuild/${encode(refType)}/${encode(refId)}`,
    ),

  /** Paginated listing of admin index rows. */
  listDocuments: (params: SearchDocumentAdminListParams = {}) => {
    const query: Record<string, string | number> = {}
    if (params.refType) query.refType = params.refType
    if (params.lang) query.lang = params.lang
    if (params.keyword) query.keyword = params.keyword
    if (params.page) query.page = params.page
    if (params.size) query.size = params.size
    return request.get<SearchDocumentAdminListResponse>(
      '/search/admin/documents',
      { params: query },
    )
  },
}
