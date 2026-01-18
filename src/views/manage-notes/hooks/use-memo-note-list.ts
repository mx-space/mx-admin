import type { NoteModel } from '@mx-space/api-client'

import { notesApi } from '~/api'
import { createMemoDataListFetchHook } from '~/hooks/use-memo-fetch-data-list'

export const useMemoNoteList = createMemoDataListFetchHook<
  { id: string; title: string; nid: number },
  NoteModel
>((page) =>
  notesApi.getList({
    page,
    size: 50,
    select: 'nid title _id id',
  }),
)
