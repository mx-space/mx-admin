import { BookOpen, Pin, ThumbsUp } from 'lucide-react'
import type { PostModel } from '~/models/post'

import { WEB_URL } from '~/constants/env'
import {
  ContentEntryListItem,
  ContentListStatusBadge,
} from '~/features/_shared/components/content-list-item'
import { SelectField } from '~/ui/primitives/select'
import { relativeTimeFromNow } from '~/utils/time'

export function PostRow(props: {
  categories: Array<{ label: string; value: string }>
  deleting: boolean
  onCategoryChange: (id: string, categoryId: string) => void
  onDelete: (id: string) => void
  onPublishChange: (id: string, isPublished: boolean) => void
  onSelectedChange: (checked: boolean) => void
  post: PostModel
  publishing: boolean
  selected: boolean
  updatingCategory: boolean
}) {
  const externalHref = `${WEB_URL}/posts/${props.post.category?.slug ?? props.post.categoryId}/${props.post.slug}`
  const isPublished = props.post.isPublished ?? false
  const title = props.post.title || '未命名文章'
  const editPath = `/posts/edit?id=${encodeURIComponent(props.post.id)}`

  return (
    <ContentEntryListItem
      checkboxLabel={`选择文章「${title}」`}
      deleteDisabled={props.deleting}
      deleteTitle="删除文章"
      editTitle="编辑文章"
      editTo={editPath}
      externalHref={externalHref}
      leading={
        props.post.pinAt ? (
          <Pin aria-hidden="true" className="size-3.5 text-orange-500" />
        ) : null
      }
      meta={
        <>
          {props.categories.length > 0 ? (
            <SelectField
              aria-label={`修改「${title}」分类`}
              disabled={props.updatingCategory}
              onValueChange={(value) =>
                props.onCategoryChange(props.post.id, value)
              }
              options={props.categories}
              triggerClassName="h-7 w-32 px-2 text-xs"
              value={props.post.categoryId}
            />
          ) : (
            <span>{props.post.category?.name ?? '未分类'}</span>
          )}
          {props.post.tags?.length ? (
            <span className="max-w-64 truncate">
              {props.post.tags.join('、')}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden="true" className="size-3" />
            {props.post.readCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp aria-hidden="true" className="size-3" />
            {props.post.likeCount ?? 0}
          </span>
          <time dateTime={props.post.createdAt}>
            {relativeTimeFromNow(props.post.createdAt)}
          </time>
        </>
      }
      onDelete={() => props.onDelete(props.post.id)}
      onPublishToggle={() => props.onPublishChange(props.post.id, !isPublished)}
      onSelectedChange={props.onSelectedChange}
      openTitle="打开文章"
      publishDisabled={props.publishing}
      publishLabel={isPublished ? '下架' : '发布'}
      selected={props.selected}
      status={
        <ContentListStatusBadge active={isPublished}>
          {isPublished ? '已发布' : '草稿'}
        </ContentListStatusBadge>
      }
      title={title}
      titleTo={editPath}
    />
  )
}
