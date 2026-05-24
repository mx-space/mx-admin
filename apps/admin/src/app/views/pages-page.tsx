import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { PageModel } from '~/app/models/page'

import { WEB_URL } from '~/app/constants/env'
import { relativeTimeFromNow } from '~/app/utils/time'

import { deletePage, getPages } from '../api/pages'
import { Button, ButtonLink } from '../ui/button'
import { cn } from '../ui/cn'
import { Panel } from '../ui/panel'

const pagesQueryKey = ['pages']

export function PagesPage() {
  const queryClient = useQueryClient()
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

  return (
    <Panel description="独立页面列表和公开地址。" title="页面">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          共 {pagesQuery.data?.pagination.total ?? 0} 个页面
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink to="/pages/edit">
            <Plus aria-hidden="true" className="size-4" />
            新建页面
          </ButtonLink>
          <Button
            disabled={pagesQuery.isFetching}
            onClick={() => void pagesQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', pagesQuery.isFetching && 'animate-spin')}
            />
            刷新
          </Button>
        </div>
      </div>
      <div className="min-h-[28rem]">
        {pagesQuery.isLoading ? (
          <PagesSkeleton />
        ) : pagesQuery.isError ? (
          <PagesError onRetry={() => void pagesQuery.refetch()} />
        ) : pages.length === 0 ? (
          <PagesEmpty />
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {pages.map((page) => (
              <PageRow
                deleting={deleteMutation.isPending}
                key={page.id}
                onDelete={(id) => {
                  if (window.confirm(`确认删除「${page.title}」？`)) {
                    deleteMutation.mutate(id)
                  }
                }}
                page={page}
              />
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

function PageRow(props: {
  deleting: boolean
  onDelete: (id: string) => void
  page: PageModel
}) {
  const page = props.page

  return (
    <article className="grid gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center dark:hover:bg-neutral-900/50">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <FileText aria-hidden="true" className="size-4 text-neutral-400" />
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {page.title || '未命名页面'}
          </h3>
          {typeof page.order === 'number' ? (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              #{page.order}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <span>/{page.slug}</span>
          {page.subtitle ? <span>{page.subtitle}</span> : null}
          <time dateTime={page.createdAt}>
            {relativeTimeFromNow(page.createdAt)}
          </time>
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
      暂无页面
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
