import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { PostModel } from '~/models/post'
import type { PostSortKey, SortOrder } from '../types/posts'

import { getCategories } from '~/api/categories'
import { deletePost, getPosts, patchPost, searchPosts } from '~/api/posts'
import { WEB_URL } from '~/constants/env'
import {
  ContentListHeader,
  ContentListToolbar,
  SortMenu,
} from '~/features/_shared/components/content-list-toolbar'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { FocusScope, setActiveScope, useScopeArrowNav } from '~/ui/focus-scope'
import { useListSelection, useListShortcuts } from '~/ui/list-actions'
import { ButtonLink } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'

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
import { buildPostActions } from './buildPostActions'
import { PostRow } from './PostRow'
import { PostsEmpty } from './PostsEmpty'
import { PostsError } from './PostsError'
import { PostsSkeleton } from './PostsSkeleton'

const FOCUS_SCOPE_ID = 'posts-list'

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

  const selection = useListSelection<PostModel>({
    getId: (post) => post.id,
    items: posts,
  })

  useEffect(() => {
    selection.clear()
  }, [categoryId, keyword, page, sortKey, sortOrder])

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
    onSuccess: async () => {
      toast.success('文章已删除')
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
    onSuccess: async ({ failedCount, successCount }) => {
      selection.clear()
      if (failedCount > 0) {
        toast.warning(`删除完成：成功 ${successCount}，失败 ${failedCount}`)
      } else {
        toast.success(`成功删除 ${successCount} 篇文章`)
      }
      await invalidatePosts()
    },
  })

  const pinMutation = useMutation({
    mutationFn: (payload: { id: string; isPinned: boolean }) =>
      patchPost(payload.id, {
        pinAt: payload.isPinned ? new Date().toISOString() : null,
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '置顶状态更新失败')),
    onSuccess: invalidatePosts,
  })

  const externalHrefFor = (post: PostModel) =>
    `${WEB_URL}/posts/${post.category?.slug ?? post.categoryId}/${post.slug}`

  const confirmAndDelete = (targets: PostModel[]) => {
    if (targets.length === 0) return
    const msg =
      targets.length === 1
        ? `确定删除「${targets[0].title || '未命名文章'}」？`
        : `确定删除选中的 ${targets.length} 篇文章？`
    if (!window.confirm(msg)) return
    if (targets.length === 1) {
      deleteMutation.mutate(targets[0].id)
    } else {
      batchDeleteMutation.mutate(targets.map((t) => t.id))
    }
  }

  const actions = useMemo(
    () =>
      buildPostActions({
        deleteMany: confirmAndDelete,
        navigateToEdit: (post) => {
          window.location.hash = `#/posts/edit?id=${encodeURIComponent(post.id)}`
        },
        openExternal: (post) => {
          window.open(externalHrefFor(post), '_blank', 'noopener,noreferrer')
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useListShortcuts(actions, {
    extra: {
      '$mod+a': (event) => {
        event.preventDefault()
        selection.selectAll()
      },
      Escape: () => {
        selection.clear()
        setActiveScope(null)
      },
    },
    getTargets: selection.getSelectedTargets,
    scopeId: FOCUS_SCOPE_ID,
  })

  useScopeArrowNav({
    itemSelector: '[data-scope-item="row"]',
    onItemFocus: (el) => {
      const id = el.getAttribute('data-id')
      if (id) selection.selectOne(id)
    },
    scopeId: FOCUS_SCOPE_ID,
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
        id: category.id,
        name: category.name,
      })),
    [categoriesQuery.data],
  )

  const selectedCount = selection.size
  const visibleIds = posts.map((post) => post.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selection.isSelected(id))

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const toggleAllVisible = (checked: boolean) => {
    if (checked) selection.selectAll()
    else selection.clear()
  }

  return (
    <FocusScope
      className="outline-hidden flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950"
      id={FOCUS_SCOPE_ID}
    >
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
          onBulkAction: () => confirmAndDelete(selection.getSelectedTargets()),
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
                actions={actions}
                categories={rowCategoryOptions}
                key={post.id}
                onCategoryChange={(id, nextCategoryId) =>
                  categoryMutation.mutate({ categoryId: nextCategoryId, id })
                }
                onPinToggle={(id, isPinned) =>
                  pinMutation.mutate({ id, isPinned })
                }
                onPublishChange={(id, isPublished) =>
                  publishMutation.mutate({ id, isPublished })
                }
                onSelect={(id, mode) => {
                  if (mode === 'range') selection.selectRange(id)
                  else if (mode === 'toggle') selection.toggleWithAnchor(id)
                  else selection.selectOne(id)
                }}
                onSelectedChange={() => selection.toggleWithAnchor(post.id)}
                post={post}
                selected={selection.isSelected(post.id)}
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
    </FocusScope>
  )
}
