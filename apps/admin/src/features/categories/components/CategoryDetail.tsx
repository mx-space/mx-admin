import { useQuery } from '@tanstack/react-query'
import { Edit3, FolderOpen, Loader2, Trash2 } from 'lucide-react'
import type { CategoryModel } from '~/models/category'

import { getPosts } from '~/api/posts'
import { Button } from '~/ui/button'
import { Scroll } from '~/ui/scroll'

import { categoryDetailPostPageSize } from '../constants'
import { DetailHeader } from './DetailHeader'
import { EntitySummary } from './EntitySummary'
import { PostListSection } from './PostListSection'

export function CategoryDetail(props: {
  category: CategoryModel
  deleting: boolean
  onBack: () => void
  onDelete: (category: CategoryModel) => void
  onEdit: (category: CategoryModel) => void
}) {
  const postsQuery = useQuery({
    enabled: !!props.category.id,
    queryFn: () =>
      getPosts({
        categoryIds: [props.category.id],
        page: 1,
        size: categoryDetailPostPageSize,
        sort_by: 'createdAt',
        sort_order: 'desc',
      }).then((result) => result.data),
    queryKey: ['posts', 'category-detail', props.category.id],
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DetailHeader onBack={props.onBack} title="分类详情">
        <Button
          onClick={() => props.onEdit(props.category)}
          type="button"
          variant="subtle"
        >
          <Edit3 aria-hidden="true" className="size-4" />
          编辑
        </Button>
        <Button
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={props.deleting}
          onClick={() => props.onDelete(props.category)}
          type="button"
          variant="subtle"
        >
          {props.deleting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" className="size-4" />
          )}
          删除
        </Button>
      </DetailHeader>

      <Scroll className="min-h-0 flex-1" innerClassName="p-5">
        <EntitySummary
          countLabel={`${props.category.count} 篇文章`}
          icon={<FolderOpen aria-hidden="true" className="size-6" />}
          meta={props.category.slug}
          title={props.category.name}
        />
        <PostListSection
          emptyText="该分类下暂无文章"
          loading={postsQuery.isLoading}
          posts={postsQuery.data ?? []}
          title="该分类下的文章"
        />
      </Scroll>
    </div>
  )
}
