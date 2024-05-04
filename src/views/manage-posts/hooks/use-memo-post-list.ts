import { RESTManager } from '~/utils'
import { createMemoDataListFetchHook } from '../../../hooks/use-memo-fetch-data-list'
import type { Category, PostModel } from '~/models/post'

export const useMemoPostList = createMemoDataListFetchHook<
  {
    id: string
    title: string
    slug: string
    category: Category
  },
  PostModel
>((page) =>
  RESTManager.api.posts.get({
    params: {
      page,
      size: 50,
      select: 'id title nid _id slug category categoryId',
    },
  }),
)
