import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import type { PostModel } from '~/models/post'

import { WEB_URL } from '~/constants/env'
import { relativeTimeFromNow } from '~/utils/time'

export function PostListRow(props: { post: PostModel }) {
  const externalHref = `${WEB_URL}/posts/${props.post.category?.slug ?? props.post.categoryId}/${props.post.slug}`

  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-4 py-3 last:border-b-0 dark:border-neutral-800">
      <Link
        className="min-w-0 flex-1"
        title="编辑文章"
        to={`/posts/edit?id=${props.post.id}`}
      >
        <p className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {props.post.title || '未命名文章'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <time dateTime={props.post.createdAt}>
            {relativeTimeFromNow(props.post.createdAt)}
          </time>
          <span>{props.post.readCount ?? 0} 阅读</span>
        </div>
      </Link>
      <a
        className="inline-flex size-8 shrink-0 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
        href={externalHref}
        rel="noreferrer"
        target="_blank"
        title="打开文章"
      >
        <ExternalLink aria-hidden="true" className="size-4" />
      </a>
    </div>
  )
}
