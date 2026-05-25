import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { DragEvent, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import type { PageModel } from '~/models/page'

import { WEB_URL } from '~/constants/env'
import { relativeTimeFromNow } from '~/utils/time'

import { deletePage, getPages, reorderPages } from '../api/pages'
import { Button, ButtonLink } from '../ui/button'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { Scroll } from '../ui/scroll'

const pagesQueryKey = ['pages']

export function PagesPage() {
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

function PageRow(props: {
  deleting: boolean
  dragging: boolean
  index: number
  onDelete: (id: string) => void
  onDragEnd: () => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
  page: PageModel
  reordering: boolean
}) {
  const page = props.page

  return (
    <article
      className={cn(
        'grid gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center dark:hover:bg-neutral-900/50',
        props.dragging && 'bg-neutral-100 opacity-60 dark:bg-neutral-900',
      )}
      onDragOver={props.onDragOver}
      onDrop={props.onDrop}
    >
      <div className="flex min-w-0 items-start gap-3">
        <button
          aria-label={`拖拽排序「${page.title || '未命名页面'}」`}
          className="mt-0.5 inline-flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-600 dark:hover:bg-neutral-900 dark:hover:text-neutral-400"
          disabled={props.reordering}
          draggable={!props.reordering}
          onDragEnd={props.onDragEnd}
          onDragStart={props.onDragStart}
          type="button"
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <FileText aria-hidden="true" className="size-4 text-neutral-400" />
            <Link
              className="outline-hidden truncate text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600 focus-visible:underline dark:text-neutral-50 dark:hover:text-neutral-300"
              to={`/pages/edit?id=${encodeURIComponent(page.id)}`}
            >
              {page.title || '未命名页面'}
            </Link>
            {typeof page.order === 'number' ? (
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                #{page.order}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span>排序 {props.index + 1}</span>
            <span>/{page.slug}</span>
            {page.subtitle ? <span>{page.subtitle}</span> : null}
            <time dateTime={page.createdAt}>
              {relativeTimeFromNow(page.createdAt)}
            </time>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ButtonLink
          className="size-9 px-0"
          title="编辑页面"
          to={`/pages/edit?id=${encodeURIComponent(page.id)}`}
          variant="subtle"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </ButtonLink>
        <a
          className="inline-flex size-9 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          href={`${WEB_URL}/${page.slug}`}
          rel="noreferrer"
          target="_blank"
          title="打开页面"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <button
          className="inline-flex size-9 items-center justify-center rounded border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={props.deleting}
          onClick={() => props.onDelete(page.id)}
          title="删除页面"
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  )
}

function reorderList<TItem>(
  items: TItem[],
  oldIndex: number,
  newIndex: number,
) {
  const next = [...items]
  const [removed] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, removed)
  return next
}

function PagesSkeleton() {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="px-4 py-3" key={index}>
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function PagesEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
      <FileText
        aria-hidden="true"
        className="mb-4 size-12 text-neutral-300 dark:text-neutral-700"
      />
      <p>暂无页面</p>
      <ButtonLink className="mt-4" to="/pages/edit" variant="subtle">
        <Plus aria-hidden="true" className="size-4" />
        创建第一个页面
      </ButtonLink>
    </div>
  )
}

function PagesError(props: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        页面加载失败
      </p>
      <Button className="mt-3" onClick={props.onRetry} type="button">
        重试
      </Button>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
