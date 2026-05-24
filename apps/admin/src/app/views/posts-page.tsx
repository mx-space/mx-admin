import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  ExternalLink,
  FileText,
  Pencil,
  Pin,
  Plus,
  Search,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { PostModel } from '~/app/models/post'

import { WEB_URL } from '~/app/constants/env'
import { relativeTimeFromNow } from '~/app/utils/time'

import { deletePost, getPosts, patchPost, searchPosts } from '../api/posts'
import { Button, ButtonLink } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { Panel } from '../ui/panel'
import { TextInput } from '../ui/text-field'

const pageSize = 20

export function PostsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(readPage(searchParams.get('page')))
  const [keywordInput, setKeywordInput] = useState(
    searchParams.get('keyword') ?? '',
  )
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (keyword) nextParams.set('keyword', keyword)
    setSearchParams(nextParams, { replace: true })
  }, [keyword, page, setSearchParams])

  const postsQuery = useQuery({
    queryFn: () =>
      keyword
        ? searchPosts({ keyword, page, size: pageSize })
        : getPosts({
            page,
            size: pageSize,
            sort_by: 'createdAt',
            sort_order: 'desc',
          }),
    queryKey: ['posts', 'list', page, pageSize, keyword],
  })

  const posts = postsQuery.data?.data ?? []
  const pagination = postsQuery.data?.pagination

  const invalidatePosts = async () => {
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  const publishMutation = useMutation({
    mutationFn: (payload: { id: string; isPublished: boolean }) =>
      patchPost(payload.id, { isPublished: payload.isPublished }),
    onSuccess: invalidatePosts,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async () => {
      toast.success('文章已删除')
      await invalidatePosts()
    },
  })

  const summary = useMemo(() => {
    if (!pagination) return keyword ? `搜索：${keyword}` : '按创建时间倒序'
    return keyword
      ? `搜索：${keyword}，共 ${pagination.total} 篇`
      : `共 ${pagination.total} 篇`
  }, [keyword, pagination])

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  return (
    <div className="space-y-4">
      <Panel
        description="文章列表、发布状态和外部访问入口。"
        title={
          <span className="inline-flex items-center gap-2">
            <FileText aria-hidden="true" className="size-4" />
            文章
          </span>
        }
      >
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-neutral-800">
          <form className="flex max-w-xl flex-1 gap-2" onSubmit={onSearch}>
            <label className="relative min-w-0 flex-1">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
              />
              <TextInput
                controlClassName="h-9 pl-9 focus:border-neutral-400 focus:ring-0 dark:focus:border-neutral-600"
                onChange={setKeywordInput}
                placeholder="搜索标题或正文"
                value={keywordInput}
              />
            </label>
            <Button type="submit" variant="subtle">
              搜索
            </Button>
            {keyword ? (
              <Button
                onClick={() => {
                  setKeywordInput('')
                  setKeyword('')
                  setPage(1)
                }}
                type="button"
                variant="subtle"
              >
                清除
              </Button>
            ) : null}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {summary}
            </p>
            <ButtonLink to="/posts/edit">
              <Plus aria-hidden="true" className="size-4" />
              新建文章
            </ButtonLink>
          </div>
        </div>

        <div className="min-h-[32rem]">
          {postsQuery.isLoading && posts.length === 0 ? (
            <PostsSkeleton />
          ) : postsQuery.isError ? (
            <PostsError onRetry={() => void postsQuery.refetch()} />
          ) : posts.length === 0 ? (
            <PostsEmpty keyword={keyword} />
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {posts.map((post) => (
                <PostRow
                  deleting={deleteMutation.isPending}
                  key={post.id}
                  onDelete={(id) => {
                    if (window.confirm(`确定删除「${post.title}」？`)) {
                      deleteMutation.mutate(id)
                    }
                  }}
                  onPublishChange={(id, isPublished) =>
                    publishMutation.mutate({ id, isPublished })
                  }
                  post={post}
                  publishing={publishMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              第 {pagination.page} 页
            </span>
            <CompactPagination
              onPageChange={setPage}
              onPageSizeChange={() => undefined}
              page={page}
              pageCount={pagination.totalPages}
              pageSize={pageSize}
              pageSizes={[pageSize]}
            />
          </div>
        ) : null}
      </Panel>
    </div>
  )
}

function PostRow(props: {
  deleting: boolean
  onDelete: (id: string) => void
  onPublishChange: (id: string, isPublished: boolean) => void
  post: PostModel
  publishing: boolean
}) {
  const externalHref = `${WEB_URL}/posts/${props.post.category?.slug ?? props.post.categoryId}/${props.post.slug}`
  const isPublished = props.post.isPublished ?? false

  return (
    <article className="grid gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center dark:hover:bg-neutral-900/50">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {props.post.pinAt ? (
            <Pin aria-hidden="true" className="size-3.5 text-orange-500" />
          ) : null}
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {props.post.title || '未命名文章'}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-xs leading-4',
              isPublished
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400',
            )}
          >
            {isPublished ? '已发布' : '草稿'}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{props.post.category?.name ?? '未分类'}</span>
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
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          disabled={props.publishing}
          onClick={() => props.onPublishChange(props.post.id, !isPublished)}
          type="button"
          variant="subtle"
        >
          {isPublished ? '下架' : '发布'}
        </Button>
        <ButtonLink
          className="size-9 px-0"
          title="编辑文章"
          to={`/posts/edit?id=${encodeURIComponent(props.post.id)}`}
          variant="subtle"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </ButtonLink>
        <a
          className="inline-flex size-9 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          href={externalHref}
          rel="noreferrer"
          target="_blank"
          title="打开文章"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <button
          className="inline-flex size-9 items-center justify-center rounded border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={props.deleting}
          onClick={() => props.onDelete(props.post.id)}
          title="删除文章"
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  )
}

function PostsEmpty(props: { keyword: string }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <FileText aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {props.keyword ? '没有匹配的文章' : '暂无文章'}
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {props.keyword
          ? '调整关键词后重新搜索。'
          : '可以从列表右上角进入 React 写作页创建文章。'}
      </p>
    </div>
  )
}

function PostsError(props: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        文章加载失败
      </p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function PostsSkeleton() {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="px-4 py-3" key={index}>
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function readPage(value: string | null) {
  const page = Number(value)
  return Number.isFinite(page) && page > 0 ? page : 1
}
