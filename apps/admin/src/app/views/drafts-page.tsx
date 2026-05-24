import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Code2,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { DraftModel, DraftRefType } from '~/app/models/draft'
import type { LucideIcon } from 'lucide-react'

import { DraftRefType as DraftRefTypeValue } from '~/app/models/draft'
import { relativeTimeFromNow } from '~/app/utils/time'

import { deleteDraft, getDraftHistory, getDrafts } from '../api/drafts'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'

const draftsQueryKey = ['drafts']

const filterOptions: Array<{ label: string; value: DraftRefType | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '文章', value: DraftRefTypeValue.Post },
  { label: '手记', value: DraftRefTypeValue.Note },
  { label: '页面', value: DraftRefTypeValue.Page },
]

const refTypeMeta: Record<
  DraftRefType,
  { className: string; icon: LucideIcon; label: string }
> = {
  [DraftRefTypeValue.Post]: {
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
    icon: Code2,
    label: '文章',
  },
  [DraftRefTypeValue.Note]: {
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
    icon: BookOpen,
    label: '手记',
  },
  [DraftRefTypeValue.Page]: {
    className:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
    icon: FileText,
    label: '页面',
  },
}

export function DraftsPage() {
  const queryClient = useQueryClient()
  const [filterType, setFilterType] = useState<DraftRefType | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const draftsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getDrafts({
        page: 1,
        refType: filterType === 'all' ? undefined : filterType,
        size: 50,
      }),
    queryKey: [...draftsQueryKey, 'list', filterType],
  })

  const drafts = draftsQuery.data?.data ?? []
  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedId) ?? drafts[0] ?? null,
    [drafts, selectedId],
  )

  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('草稿已删除')
      setSelectedId(null)
      await queryClient.invalidateQueries({ queryKey: draftsQueryKey })
    },
  })

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden rounded border border-neutral-200 bg-white lg:grid-cols-[minmax(320px,0.36fr)_1fr] dark:border-neutral-800 dark:bg-neutral-950">
      <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-medium">草稿箱</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              共 {draftsQuery.data?.pagination.total ?? 0} 个草稿
            </p>
          </div>
          <Button
            disabled={draftsQuery.isFetching}
            onClick={() => void draftsQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', draftsQuery.isFetching && 'animate-spin')}
            />
            刷新
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          {filterOptions.map((option) => (
            <button
              className={cn(
                'rounded border px-2.5 py-1 text-xs transition-colors',
                filterType === option.value
                  ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900',
              )}
              key={option.value}
              onClick={() => {
                setFilterType(option.value)
                setSelectedId(null)
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {draftsQuery.isLoading && drafts.length === 0 ? (
            <DraftListSkeleton />
          ) : drafts.length === 0 ? (
            <DraftListEmpty />
          ) : (
            drafts.map((draft) => (
              <DraftRow
                draft={draft}
                key={draft.id}
                onSelect={() => setSelectedId(draft.id)}
                selected={selectedDraft?.id === draft.id}
              />
            ))
          )}
        </div>
      </section>

      <section className="min-h-0">
        {selectedDraft ? (
          <DraftDetail
            deleting={deleteMutation.isPending}
            draft={selectedDraft}
            onDelete={(draft) => {
              if (window.confirm(`确认删除「${draft.title || '无标题'}」？`)) {
                deleteMutation.mutate(draft.id)
              }
            }}
          />
        ) : (
          <DraftDetailEmpty />
        )}
      </section>
    </div>
  )
}

function DraftRow(props: {
  draft: DraftModel
  onSelect: () => void
  selected: boolean
}) {
  const meta = refTypeMeta[props.draft.refType]
  const Icon = meta.icon

  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <span
        className={cn(
          'mt-0.5 inline-flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs',
          meta.className,
        )}
      >
        <Icon aria-hidden="true" className="size-3" />
        {meta.label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {props.draft.title || '无标题'}
          </h3>
          <span className="text-xs tabular-nums text-neutral-400">
            v{props.draft.version}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{props.draft.refId ? '编辑中' : '新建'}</span>
          <span>{props.draft.contentFormat ?? 'markdown'}</span>
          <time dateTime={props.draft.updatedAt}>
            {relativeTimeFromNow(props.draft.updatedAt)}
          </time>
        </div>
      </div>
    </button>
  )
}

function DraftDetail(props: {
  deleting: boolean
  draft: DraftModel
  onDelete: (draft: DraftModel) => void
}) {
  const historyQuery = useQuery({
    enabled: Boolean(props.draft.id),
    queryFn: () => getDraftHistory(props.draft.id),
    queryKey: [...draftsQueryKey, 'history', props.draft.id],
  })
  const meta = refTypeMeta[props.draft.refType]
  const text = props.draft.text || props.draft.content || ''

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'rounded border px-2 py-1 text-xs font-medium',
                meta.className,
              )}
            >
              {meta.label}
            </span>
            <h2 className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
              {props.draft.title || '无标题'}
            </h2>
          </div>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            v{props.draft.version} ·{' '}
            {props.draft.refId ? '编辑已有内容' : '新建内容'}
          </p>
        </div>
        <Button
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={props.deleting}
          onClick={() => props.onDelete(props.draft)}
          type="button"
          variant="subtle"
        >
          {props.deleting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" className="size-4" />
          )}
          删除
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Field label="草稿 ID">
            <Code>{props.draft.id}</Code>
          </Field>
          <Field label="关联 ID">{props.draft.refId ?? '-'}</Field>
          <Field label="内容格式">
            {props.draft.contentFormat ?? 'markdown'}
          </Field>
          <Field label="创建时间">
            {relativeTimeFromNow(props.draft.createdAt)}
          </Field>
          <Field label="更新时间">
            {relativeTimeFromNow(props.draft.updatedAt)}
          </Field>
          <Field label="历史版本">
            {historyQuery.data?.length ?? props.draft.history?.length ?? 0}
          </Field>
        </div>

        <section className="mt-6">
          <h3 className="mb-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            正文预览
          </h3>
          {text ? (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-3 text-xs leading-5 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              {text}
            </pre>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              暂无正文内容。
            </p>
          )}
        </section>

        <section className="mt-6">
          <h3 className="mb-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
            历史版本
          </h3>
          {historyQuery.isLoading ? (
            <div className="h-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          ) : historyQuery.data?.length ? (
            <div className="divide-y divide-neutral-100 overflow-hidden rounded border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {historyQuery.data.map((item) => (
                <div
                  className="grid gap-1 px-3 py-2 text-xs sm:grid-cols-[5rem_minmax(0,1fr)_9rem]"
                  key={item.version}
                >
                  <span className="tabular-nums text-neutral-500">
                    v{item.version}
                  </span>
                  <span className="truncate text-neutral-800 dark:text-neutral-200">
                    {item.title || '无标题'}
                  </span>
                  <time className="text-neutral-400">
                    {relativeTimeFromNow(item.savedAt)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              暂无历史版本。
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function Field(props: { children: React.ReactNode; label: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </div>
      <div className="min-w-0 text-neutral-950 dark:text-neutral-50">
        {props.children}
      </div>
    </div>
  )
}

function Code(props: { children: React.ReactNode }) {
  return (
    <code className="block truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      {props.children}
    </code>
  )
}

function DraftListSkeleton() {
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

function DraftListEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Inbox aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        暂无草稿
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        草稿会在编辑时自动保存到这里。
      </p>
    </div>
  )
}

function DraftDetailEmpty() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Inbox aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        选择一个草稿查看详情。
      </p>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
