import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { PageModel } from '~/models/page'

import { deletePage, getPages, reorderPages } from '~/api/pages'
import { Button, ButtonLink } from '~/ui/button'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { Scroll } from '~/ui/scroll'

import { pagesQueryKey } from '../constants'
import { getErrorMessage } from '../utils/errors'
import { reorderList } from '../utils/reorder-list'
import { PageRow } from './PageRow'
import { PagesEmpty } from './PagesEmpty'
import { PagesError } from './PagesError'
import { PagesSkeleton } from './PagesSkeleton'

export function PagesRouteViewContent() {
  const queryClient = useQueryClient()
  const [orderedPages, setOrderedPages] = useState<PageModel[]>([])
  const [draggingId, setDraggingId] = useState('')
  const pagesQuery = useQuery({
    queryFn: () => getPages({ page: 1, size: 100 }),
    queryKey: [...pagesQueryKey, 'list'],
  })

  const deleteMutation = useMutation({
    mutationFn: deletePage,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('页面已删除')
      await queryClient.invalidateQueries({ queryKey: pagesQueryKey })
    },
  })

  const pages = pagesQuery.data?.data ?? []

  useEffect(() => {
    setOrderedPages(pages)
  }, [pages])

  const reorderMutation = useMutation({
    mutationFn: reorderPages,
    onError: (error: unknown) => {
      setOrderedPages(pages)
      toast.error(getErrorMessage(error, '排序失败'))
    },
    onSuccess: async () => {
      toast.success('排序已保存')
      await queryClient.invalidateQueries({ queryKey: pagesQueryKey })
    },
  })

  const commitReorder = (nextPages: PageModel[]) => {
    setOrderedPages(nextPages)
    const seq = [...nextPages]
      .reverse()
      .map((page, index) => ({ id: page.id, order: index + 1 }))
    reorderMutation.mutate(seq)
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            <FileText aria-hidden="true" className="size-4" />
            页面
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-neutral-500 sm:inline dark:text-neutral-400">
            共 {pagesQuery.data?.pagination.total ?? 0} 个页面
          </span>
          <ButtonLink aria-label="新建页面" to="/pages/edit">
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">新建页面</span>
          </ButtonLink>
          <Button
            aria-label="刷新页面列表"
            disabled={pagesQuery.isFetching}
            onClick={() => void pagesQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', pagesQuery.isFetching && 'animate-spin')}
            />
            <span className="hidden sm:inline">刷新</span>
          </Button>
        </div>
      </div>

      <Scroll className="min-h-0 flex-1">
        {pagesQuery.isLoading ? (
          <PagesSkeleton />
        ) : pagesQuery.isError ? (
          <PagesError onRetry={() => void pagesQuery.refetch()} />
        ) : orderedPages.length === 0 ? (
          <PagesEmpty />
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {orderedPages.map((page, index) => (
              <PageRow
                deleting={deleteMutation.isPending}
                dragging={draggingId === page.id}
                index={index}
                key={page.id}
                onDelete={(id) => {
                  if (window.confirm(`确认删除「${page.title}」？`)) {
                    deleteMutation.mutate(id)
                  }
                }}
                onDragEnd={() => setDraggingId('')}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => {
                  setDraggingId(page.id)
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', page.id)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const sourceId =
                    event.dataTransfer.getData('text/plain') || draggingId
                  if (!sourceId || sourceId === page.id) return
                  const sourceIndex = orderedPages.findIndex(
                    (item) => item.id === sourceId,
                  )
                  if (sourceIndex < 0) return
                  commitReorder(reorderList(orderedPages, sourceIndex, index))
                }}
                page={page}
                reordering={reorderMutation.isPending}
              />
            ))}
          </div>
        )}
      </Scroll>

      <div className="flex h-11 shrink-0 items-center justify-between border-t border-neutral-200 px-4 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <span>{orderedPages.length} 个页面</span>
        {reorderMutation.isPending ? <span>排序保存中...</span> : null}
      </div>
    </section>
  )
}
