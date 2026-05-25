import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  FileText,
  Pin,
  Plus,
  RefreshCw,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { PostModel } from '~/app/models/post'

import { WEB_URL } from '~/app/constants/env'
import { relativeTimeFromNow } from '~/app/utils/time'

import { getCategories } from '../api/categories'
import { deletePost, getPosts, patchPost, searchPosts } from '../api/posts'
import { Button, ButtonLink } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import {
  ContentEntryListItem,
  ContentListStatusBadge,
} from '../ui/content-list-item'
import {
  ContentListPageHeader,
  ContentListToolbar,
} from '../ui/content-list-toolbar'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'

const pageSize = 20
const allCategoriesValue = '__all__'
type PostSortKey = 'createdAt' | 'modifiedAt' | 'pinAt'
type SortOrder = 'asc' | 'desc'

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
  const [sortKey, setSortKey] = useState<PostSortKey>(
    readPostSortKey(searchParams.get('sort')),
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    readSortOrder(searchParams.get('order')),
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const searchParamsKey = searchParams.toString()

  useLayoutEffect(() => {
    const nextPage = readPage(searchParams.get('page'))
    const nextKeyword = searchParams.get('keyword') ?? ''
    const nextCategoryId = searchParams.get('category') ?? allCategoriesValue
    const nextSortKey = readPostSortKey(searchParams.get('sort'))
    const nextSortOrder = readSortOrder(searchParams.get('order'))

    setPage((value) => (value === nextPage ? value : nextPage))
    setKeyword((value) => (value === nextKeyword ? value : nextKeyword))
    setKeywordInput((value) => (value === nextKeyword ? value : nextKeyword))
    setCategoryId((value) =>
      value === nextCategoryId ? value : nextCategoryId,
    )
    setSortKey((value) => (value === nextSortKey ? value : nextSortKey))
    setSortOrder((value) => (value === nextSortOrder ? value : nextSortOrder))
  }, [searchParamsKey])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (keyword) nextParams.set('keyword', keyword)
    if (categoryId !== allCategoriesValue)
      nextParams.set('category', categoryId)
    if (sortKey !== 'createdAt') nextParams.set('sort', sortKey)
    if (sortOrder !== 'desc') nextParams.set('order', sortOrder)
    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    categoryId,
    keyword,
    page,
    searchParamsKey,
    setSearchParams,
    sortKey,
    sortOrder,
  ])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [categoryId, keyword, page, sortKey, sortOrder])

  const categoriesQuery = useQuery({
    queryFn: () => getCategories({ type: 'Category' }),
    queryKey: ['categories', 'post-filter'],
  })

  const postsQuery = useQuery({
    placeholderData: (previous) => previous,
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
      <ContentListPageHeader
        action={
          <ButtonLink to="/posts/edit">
            <Plus aria-hidden="true" className="size-4" />
            新建文章
          </ButtonLink>
        }
        icon={<FileText aria-hidden="true" className="size-4" />}
        summary={summary}
        title="文章"
      />

      <ContentListToolbar
        actions={
          <Button
            aria-label="刷新文章列表"
            className="h-8 px-2.5 text-xs"
            disabled={postsQuery.isFetching}
            onClick={() => void postsQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', postsQuery.isFetching && 'animate-spin')}
            />
            <span className="hidden sm:inline">
              {postsQuery.isFetching ? '同步中' : '刷新'}
            </span>
          </Button>
        }
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

      <Scroll className="min-h-0 flex-1">
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
      </Scroll>

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

function PostsEmpty(props: { keyword: string }) {
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

function readPostSortKey(value: string | null): PostSortKey {
  if (value === 'modifiedAt' || value === 'pinAt') return value
  return 'createdAt'
}

function readSortOrder(value: string | null): SortOrder {
  return value === 'asc' ? 'asc' : 'desc'
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
