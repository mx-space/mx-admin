import { useQuery } from '@tanstack/react-query'
import { Tag } from 'lucide-react'
import type { TagModel } from '~/models/category'

import { getPostsByTag } from '~/api/categories'
import { Scroll } from '~/ui/primitives/scroll'

import { DetailHeader } from './DetailHeader'
import { EntitySummary } from './EntitySummary'
import { PostListSection } from './PostListSection'

export function TagDetail(props: { onBack: () => void; tag: TagModel }) {
  const postsQuery = useQuery({
    enabled: !!props.tag.name,
    queryFn: () => getPostsByTag(props.tag.name),
    queryKey: ['posts', 'tag-detail', props.tag.name],
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DetailHeader onBack={props.onBack} title="标签详情" />
      <Scroll className="min-h-0 flex-1" innerClassName="p-5">
        <EntitySummary
          countLabel={`${props.tag.count} 篇文章`}
          icon={<Tag aria-hidden="true" className="size-6" />}
          title={props.tag.name}
        />
        <PostListSection
          emptyText="暂无关联文章"
          loading={postsQuery.isLoading}
          posts={postsQuery.data ?? []}
          title={`「${props.tag.name}」关联的文章`}
        />
      </Scroll>
    </div>
  )
}
