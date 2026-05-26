import { FileText, Plus } from 'lucide-react'

import { ButtonLink } from '~/ui/primitives/button'

export function PostsEmpty(props: { keyword: string }) {
  const hasSearch = Boolean(props.keyword)

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <FileText aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {hasSearch ? '没有匹配的文章' : '暂无文章'}
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {hasSearch ? '调整关键词后重新搜索。' : '还没有创建任何文章。'}
      </p>
      {!hasSearch ? (
        <ButtonLink className="mt-4" to="/posts/edit" variant="subtle">
          <Plus aria-hidden="true" className="size-4" />
          创建第一篇文章
        </ButtonLink>
      ) : null}
    </div>
  )
}
