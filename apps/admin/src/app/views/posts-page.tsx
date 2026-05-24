import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  ExternalLink,
  FileText,
  Pencil,
  Pin,
  Plus,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { PostModel } from '~/app/models/post'

import { WEB_URL } from '~/app/constants/env'
import { relativeTimeFromNow } from '~/app/utils/time'

import { getCategories } from '../api/categories'
import { deletePost, getPosts, patchPost, searchPosts } from '../api/posts'
import { Button, ButtonLink } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { ContentListToolbar } from '../ui/content-list-toolbar'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { SelectField } from '../ui/select'

const pageSize = 20
const allCategoriesValue = '__all__'

export function PostsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(readPage(searchParams.get('page')))
  const [keywordInput, setKeywordInput] = useState(
    searchParams.get('keyword') ?? '',
  )
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [categoryId, setCategoryId] = useState(
    searchParams.get('category') ?? allCategoriesValue,
  )
  const [sortKey, setSortKey] = useState<'createdAt' | 'modifiedAt' | 'pinAt'>(
    (searchParams.get('sort') as 'createdAt' | 'modifiedAt' | 'pinAt') ??
      'createdAt',
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    searchParams.get('order') === 'asc' ? 'asc' : 'desc',
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (keyword) nextParams.set('keyword', keyword)
    if (categoryId !== allCategoriesValue)
      nextParams.set('category', categoryId)
    if (sortKey !== 'createdAt') nextParams.set('sort', sortKey)
    if (sortOrder !== 'desc') nextParams.set('order', sortOrder)
    setSearchParams(nextParams, { replace: true })
  }, [categoryId, keyword, page, setSearchParams, sortKey, sortOrder])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [categoryId, keyword, page, sortKey, sortOrder])

  const categoriesQuery = useQuery({
    queryFn: () => getCategories({ type: 'Category' }),
    queryKey: ['categories', 'post-filter'],
  })

  const postsQuery = useQuery({
    queryFn: () =>
      keyword
        ? searchPosts({ keyword, page, size: pageSize })
        : getPosts({
            categoryIds:
              categoryId === allCategoriesValue ? undefined : [categoryId],
            page,
            size: pageSize,
            sort_by: sortKey,
            sort_order: sortOrder,
          }),
    queryKey: [
      'posts',
      'list',
      page,
      pageSize,
      keyword,
      categoryId,
      sortKey,
      sortOrder,
    ],
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

  const categoryMutation = useMutation({
    mutationFn: (payload: { categoryId: string; id: string }) =>
      patchPost(payload.id, { categoryId: payload.categoryId }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '分类更新失败')),
    onSuccess: invalidatePosts,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async (_, id) => {
      toast.success('文章已删除')
      setSelectedIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      await invalidatePosts()
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => deletePost(id)))
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled',
      )

      return {
        failedCount: ids.length - successfulIds.length,
        successfulIds,
        successCount: successfulIds.length,
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '批量删除失败')),
    onSuccess: async ({ failedCount, successfulIds, successCount }) => {
      setSelectedIds((current) => {
        const next = new Set(current)
        successfulIds.forEach((id) => next.delete(id))
        return next
      })
      if (failedCount > 0) {
        toast.warning(`删除完成：成功 ${successCount}，失败 ${failedCount}`)
      } else {
        toast.success(`成功删除 ${successCount} 篇文章`)
      }
      await invalidatePosts()
    },
  })

  const summary = useMemo(() => {
    if (!pagination) return keyword ? `搜索：${keyword}` : '按创建时间倒序'
    return keyword
      ? `搜索：${keyword}，共 ${pagination.total} 篇`
      : `共 ${pagination.total} 篇`
  }, [keyword, pagination])

  const categoryOptions = useMemo(
    () => [
      { label: '全部分类', value: allCategoriesValue },
      ...(categoriesQuery.data ?? []).map((category) => ({
        label: category.name,
        value: category.id,
      })),
    ],
    [categoriesQuery.data],
  )

  const rowCategoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categoriesQuery.data],
  )

  const selectedCount = selectedIds.size
  const visibleIds = posts.map((post) => post.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const toggleAllVisible = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const id of visibleIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <header
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium">
            <FileText aria-hidden="true" className="size-4" />
            文章
          </h2>
          <span className="ml-3 text-xs text-neutral-500 dark:text-neutral-400">
            {summary}
          </span>
        </div>
        <ButtonLink to="/posts/edit">
          <Plus aria-hidden="true" className="size-4" />
          新建文章
        </ButtonLink>
      </header>

      <ContentListToolbar
        filters={
          <>
            <SelectField
              aria-label="按分类过滤文章"
              disabled={Boolean(keyword)}
              onValueChange={(value) => {
                setCategoryId(value)
                setPage(1)
              }}
              options={categoryOptions}
              triggerClassName="w-40 !h-8 text-xs"
              value={categoryId}
            />
            <SelectField
              aria-label="文章排序字段"
              disabled={Boolean(keyword)}
              onValueChange={(value) => {
                setSortKey(value)
                setPage(1)
              }}
              options={[
                { label: '创建时间', value: 'createdAt' },
                { label: '修改时间', value: 'modifiedAt' },
                { label: '置顶时间', value: 'pinAt' },
              ]}
              triggerClassName="w-36 !h-8 text-xs"
              value={sortKey}
            />
            <SelectField
              aria-label="文章排序方向"
              disabled={Boolean(keyword)}
              onValueChange={(value) => {
                setSortOrder(value)
                setPage(1)
              }}
              options={[
                { label: '降序', value: 'desc' },
                { label: '升序', value: 'asc' },
              ]}
              triggerClassName="w-28 !h-8 text-xs"
              value={sortOrder}
            />
          </>
        }
        hasSearch={Boolean(keyword)}
        onClearSearch={() => {
          setKeywordInput('')
          setKeyword('')
          setPage(1)
        }}
        onSearch={onSearch}
        onSearchValueChange={setKeywordInput}
        searchPlaceholder="搜索标题或正文"
        searchValue={keywordInput}
        selection={{
          allVisibleSelected,
          bulkActionDisabled:
            selectedCount === 0 || batchDeleteMutation.isPending,
          bulkActionIcon: <Trash2 aria-hidden="true" className="size-4" />,
          bulkActionLabel: '批量删除',
          hasVisibleItems: posts.length > 0,
          indeterminate: selectedCount > 0 && !allVisibleSelected,
          onBulkAction: () => {
            if (window.confirm(`确定删除选中的 ${selectedCount} 篇文章？`)) {
              batchDeleteMutation.mutate(Array.from(selectedIds))
            }
          },
          onToggleAllVisible: toggleAllVisible,
          selectAllLabel: '选择当前页',
          selectedLabel: `已选 ${selectedCount} 项`,
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
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
                categories={rowCategoryOptions}
                key={post.id}
                onDelete={(id) => {
                  if (window.confirm(`确定删除「${post.title}」？`)) {
                    deleteMutation.mutate(id)
                  }
                }}
                onCategoryChange={(id, nextCategoryId) =>
                  categoryMutation.mutate({ categoryId: nextCategoryId, id })
                }
                onPublishChange={(id, isPublished) =>
                  publishMutation.mutate({ id, isPublished })
                }
                onSelectedChange={(checked) => {
                  setSelectedIds((current) => {
                    const next = new Set(current)
                    if (checked) next.add(post.id)
                    else next.delete(post.id)
                    return next
                  })
                }}
                post={post}
                publishing={publishMutation.isPending}
                selected={selectedIds.has(post.id)}
                updatingCategory={categoryMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex shrink-0 items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
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
    </div>
  )
}

function PostRow(props: {
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

  return (
    <article className="grid gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center dark:hover:bg-neutral-900/50">
      <Checkbox
        aria-label={`选择文章「${props.post.title || '未命名文章'}」`}
        checked={props.selected}
        onCheckedChange={props.onSelectedChange}
      />
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
          {props.categories.length > 0 ? (
            <SelectField
              aria-label={`修改「${props.post.title || '未命名文章'}」分类`}
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
