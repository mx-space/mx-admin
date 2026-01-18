import type { Category, PostModel } from '~/models/post'

import { postsApi } from '~/api'
import { createMemoDataListFetchHook } from '~/hooks/use-memo-fetch-data-list'

export const useMemoPostList = createMemoDataListFetchHook<
  {
    id: string
    title: string
    slug: string
    category: Category
  },
  PostModel
>((page) =>
  postsApi.getList({
    page,
    size: 50,
    select: 'id title nid _id slug category categoryId',
  }),
)
