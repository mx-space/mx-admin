import { createMemoDataListFetchHook } from 'hooks/use-memo-fetch-data-list'
import { RESTManager } from 'utils'

import type { NoteModel, PaginateResult } from '@mx-space/api-client'

export const useMemoNoteList = createMemoDataListFetchHook<
  { id: string; title: string; nid: number },
  NoteModel
>((page) =>
  RESTManager.api.notes.get<PaginateResult<NoteModel>>({
    params: {
      page,
      size: 50,
      select: 'nid title _id id',
    },
  }),
)
