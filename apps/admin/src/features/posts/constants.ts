import type { PostSortKey } from './types/posts'

export const allCategoriesValue = '__all__'
export const postsPageSize = 20

export const postSortOptions: Array<{ label: string; value: PostSortKey }> = [
  { label: '创建时间', value: 'createdAt' },
  { label: '修改时间', value: 'modifiedAt' },
  { label: '置顶时间', value: 'pinAt' },
]
