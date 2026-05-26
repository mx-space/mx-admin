import { BookOpen, Pin, ThumbsUp } from 'lucide-react'
import type { PostModel } from '~/models/post'

import { WEB_URL } from '~/constants/env'
import {
  ContentEntryListItem,
  ContentListStatusBadge,
} from '~/features/_shared/components/content-list-item'
import { relativeTimeFromNow } from '~/utils/time'

import { buildPostMenuItems } from './buildPostMenuItems'

export interface PostMenuCategoryOption {
  id: string
  name: string
}

export function PostRow(props: {
  categories: PostMenuCategoryOption[]
  onCategoryChange: (id: string, categoryId: string) => void
  onDelete: (id: string) => void
  onPinToggle: (id: string, isPinned: boolean) => void
  onPublishChange: (id: string, isPublished: boolean) => void
  onSelectedChange: (checked: boolean) => void
  post: PostModel
  selected: boolean
}) {
  const post = props.post
  const externalHref = `${WEB_URL}/posts/${post.category?.slug ?? post.categoryId}/${post.slug}`
  const isPublished = post.isPublished ?? false
  const title = post.title || '未命名文章'
  const editPath = `/posts/edit?id=${encodeURIComponent(post.id)}`

  const menuItems = () =>
    buildPostMenuItems(
      post,
      {
        externalHref,
        onCategoryChange: (categoryId) =>
          props.onCategoryChange(post.id, categoryId),
        onDelete: () => props.onDelete(post.id),
        onEdit: () => {
          window.location.hash = `#${editPath}`
        },
        onPinToggle: (next) => props.onPinToggle(post.id, next),
        onPublishToggle: (next) => props.onPublishChange(post.id, next),
      },
      props.categories,
    )

  return (
    <ContentEntryListItem
      checkboxLabel={`选择文章「${title}」`}
      editTitle="编辑文章"
      editTo={editPath}
      externalHref={externalHref}
      leading={
        post.pinAt ? (
          <Pin aria-hidden="true" className="size-3.5 text-orange-500" />
        ) : null
      }
      menuItems={menuItems}
      meta={
        <>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {post.category?.name ?? '未分类'}
          </span>
          {post.tags?.length ? (
            <span className="max-w-64 truncate">{post.tags.join('、')}</span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden="true" className="size-3" />
            {post.readCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp aria-hidden="true" className="size-3" />
            {post.likeCount ?? 0}
          </span>
          <time className="ml-auto" dateTime={post.createdAt}>
            {relativeTimeFromNow(post.createdAt)}
          </time>
        </>
      }
      onSelectedChange={props.onSelectedChange}
      openTitle="打开文章"
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
