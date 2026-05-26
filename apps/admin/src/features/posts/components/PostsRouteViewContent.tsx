import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { PostSortKey, SortOrder } from '../types/posts'

import { getCategories } from '~/api/categories'
import { deletePost, getPosts, patchPost, searchPosts } from '~/api/posts'
import { ButtonLink } from '~/ui/button'
import { cn } from '~/ui/cn'
import { CompactPagination } from '~/ui/compact-pagination'
import {
  ContentListHeader,
  ContentListToolbar,
  SortMenu,
} from '~/ui/content-list-toolbar'
import { Scroll } from '~/ui/scroll'
import { SelectField } from '~/ui/select'

import {
  allCategoriesValue,
  postSortOptions,
  postsPageSize,
} from '../constants'
import { getErrorMessage } from '../utils/errors'
import {
  readPage,
  readPostSortKey,
  readSortOrder,
} from '../utils/search-params'
import { PostRow } from './PostRow'
import { PostsEmpty } from './PostsEmpty'
import { PostsError } from './PostsError'
import { PostsSkeleton } from './PostsSkeleton'

export function PostsRouteViewContent() {
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
        ? searchPosts({ keyword, page, size: postsPageSize })
        : getPosts({
            categoryIds:
              categoryId === allCategoriesValue ? undefined : [categoryId],
            page,
            size: postsPageSize,
            sort_by: sortKey,
            sort_order: sortOrder,
          }),
    queryKey: [
      'posts',
      'list',
      page,
      postsPageSize,
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

  const count = useMemo(() => {
    if (!pagination) return null
    return `${pagination.total} 篇`
  }, [pagination])

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
      <ContentListHeader
        action={
          <ButtonLink to="/posts/edit">
            <Plus aria-hidden="true" className="size-4" />
            新建文章
          </ButtonLink>
        }
        count={count}
        icon={<FileText aria-hidden="true" className="size-4" />}
        title="文章"
      />

      <ContentListToolbar
        extraActions={
          <button
            aria-label="刷新文章列表"
            className="outline-hidden inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] disabled:pointer-events-none disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            disabled={postsQuery.isFetching}
            onClick={() => void postsQuery.refetch()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn(
                'size-3.5',
                postsQuery.isFetching && 'animate-spin',
              )}
            />
          </button>
        }
        filters={
          <SelectField
            aria-label="按分类过滤文章"
            disabled={Boolean(keyword)}
            onValueChange={(value) => {
              setCategoryId(value)
              setPage(1)
            }}
            options={categoryOptions}
            triggerClassName="w-32 !h-7 !border-transparent !bg-transparent text-xs hover:!bg-neutral-100 dark:hover:!bg-neutral-900"
            value={categoryId}
          />
        }
        sortMenu={
          <SortMenu<PostSortKey>
            disabled={Boolean(keyword)}
            field={sortKey}
            onChange={({ field, order }) => {
              setSortKey(field)
              setSortOrder(order)
              setPage(1)
            }}
            options={postSortOptions}
            order={sortOrder}
          />
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
          selectedCount,
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
            pageSize={postsPageSize}
            pageSizes={[postsPageSize]}
          />
        </div>
      ) : null}
    </div>
  )
}
