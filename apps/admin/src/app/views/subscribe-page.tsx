import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MailX, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Subscriber } from '../api/subscribe'

import {
  getSubscribers,
  getSubscribeStatus,
  SubscribeNoteCreateBit,
  SubscribePostCreateBit,
  SubscribeRecentCreateBit,
  SubscribeSayCreateBit,
  unsubscribeBatch,
  updateSubscribeEnabled,
} from '../api/subscribe'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { Switch } from '../ui/switch'
import { TextInput } from '../ui/text-field'

const pageSize = 50

const subscribeBits = [
  {
    bit: SubscribePostCreateBit,
    className:
      'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    label: '博文',
  },
  {
    bit: SubscribeNoteCreateBit,
    className:
      'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
    label: '手记',
  },
  {
    bit: SubscribeRecentCreateBit,
    className:
      'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    label: '速记',
  },
  {
    bit: SubscribeSayCreateBit,
    className:
      'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    label: '说说',
  },
]

export function SubscribePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isConfirmingBatchDelete, setIsConfirmingBatchDelete] = useState(false)
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false)

  const statusQuery = useQuery({
    queryFn: getSubscribeStatus,
    queryKey: ['subscribe', 'status'],
  })

  const listQuery = useQuery({
    queryFn: () => getSubscribers({ page, size: pageSize }),
    queryKey: ['subscribe', 'list', page, pageSize],
  })

  const subscribers = listQuery.data?.data ?? []
  const pagination = listQuery.data?.pagination
  const totalCount = pagination?.total ?? 0
  const subscribeEnabled = Boolean(statusQuery.data?.enable)

  const filteredSubscribers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return subscribers
    return subscribers.filter((subscriber) =>
      subscriber.email.toLowerCase().includes(query),
    )
  }, [searchQuery, subscribers])

  const isAllSelected =
    filteredSubscribers.length > 0 &&
    filteredSubscribers.every((subscriber) => selectedIds.has(subscriber.id))
  const selectedCount = selectedIds.size

  const invalidateSubscribe = async () => {
    await queryClient.invalidateQueries({ queryKey: ['subscribe'] })
  }

  const toggleMutation = useMutation({
    mutationFn: updateSubscribeEnabled,
    onSuccess: async () => {
      toast.success('订阅设置已更新')
      await invalidateSubscribe()
    },
    onError: () => {
      toast.error('订阅设置更新失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: unsubscribeBatch,
    onSuccess: async (result, variables) => {
      toast.success(
        'all' in variables
          ? `已移除全部 ${result.deletedCount} 位订阅者`
          : `已移除 ${result.deletedCount} 位订阅者`,
      )
      setSelectedIds(new Set())
      setIsConfirmingBatchDelete(false)
      setIsConfirmingDeleteAll(false)
      await invalidateSubscribe()
    },
    onError: () => {
      toast.error('删除订阅者失败')
    },
  })

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(() =>
      isAllSelected
        ? new Set()
        : new Set(filteredSubscribers.map((subscriber) => subscriber.id)),
    )
  }

  const deleteSelected = () => {
    const selectedEmails = subscribers
      .filter((subscriber) => selectedIds.has(subscriber.id))
      .map((subscriber) => subscriber.email)

    if (selectedEmails.length > 0) {
      deleteMutation.mutate({ emails: selectedEmails })
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <h2 className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
          <Mail aria-hidden="true" className="size-4" />
          <span className="truncate">邮件订阅</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-neutral-500 sm:inline dark:text-neutral-400">
            {totalCount} 位订阅者
          </span>
          <Button
            aria-label="刷新订阅数据"
            className="h-8 px-2"
            onClick={() => {
              void invalidateSubscribe()
            }}
            type="button"
            variant="subtle"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 border-b border-neutral-200 p-4 sm:grid-cols-3 dark:border-neutral-800">
        <StatCard icon={Users} label="总订阅者" value={totalCount} />
        <StatCard
          icon={subscribeEnabled ? Mail : MailX}
          label="订阅功能"
          tone={subscribeEnabled ? 'success' : 'warning'}
          value={subscribeEnabled ? '已启用' : '已禁用'}
        />
        <div className="rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <Switch
            checked={subscribeEnabled}
            disabled={toggleMutation.isPending}
            label="启用邮件订阅"
            description="允许访客订阅新内容通知"
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <Checkbox
            aria-label="选择当前页订阅者"
            checked={isAllSelected}
            indeterminate={selectedCount > 0 && !isAllSelected}
            onCheckedChange={toggleSelectAll}
          />
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            />
            <TextInput
              controlClassName="pl-9"
              onChange={setSearchQuery}
              placeholder="搜索订阅者..."
              value={searchQuery}
            />
          </div>
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                已选择 {selectedCount} 项
              </span>
              <Button
                className="h-8 px-2"
                onClick={() => {
                  setSelectedIds(new Set())
                  setIsConfirmingBatchDelete(false)
                  setIsConfirmingDeleteAll(false)
                }}
                type="button"
                variant="subtle"
              >
                取消选择
              </Button>
              <Button
                className="h-8 px-2 text-red-600 dark:text-red-400"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (isConfirmingBatchDelete) {
                    deleteSelected()
                  } else {
                    setIsConfirmingBatchDelete(true)
                    setIsConfirmingDeleteAll(false)
                  }
                }}
                onMouseLeave={() => setIsConfirmingBatchDelete(false)}
                type="button"
                variant="subtle"
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
                {isConfirmingBatchDelete ? '确认删除选中' : '删除选中'}
              </Button>
              {isAllSelected && totalCount > 0 ? (
                <Button
                  className="h-8 px-2 text-red-600 dark:text-red-400"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (isConfirmingDeleteAll) {
                      deleteMutation.mutate({ all: true })
                    } else {
                      setIsConfirmingDeleteAll(true)
                      setIsConfirmingBatchDelete(false)
                    }
                  }}
                  onMouseLeave={() => setIsConfirmingDeleteAll(false)}
                  type="button"
                  variant="subtle"
                >
                  {isConfirmingDeleteAll ? '确认删除全部' : '删除全部'}
                </Button>
              ) : null}
            </div>
          ) : (
            <span className="text-sm text-neutral-500">
              共 {totalCount} 位订阅者
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {listQuery.isLoading && subscribers.length === 0 ? (
            <SubscriberSkeletonList />
          ) : filteredSubscribers.length === 0 ? (
            <SubscribeEmptyState hasSearch={Boolean(searchQuery.trim())} />
          ) : (
            filteredSubscribers.map((subscriber) => (
              <SubscriberRow
                key={subscriber.id}
                onDelete={() =>
                  deleteMutation.mutate({ emails: [subscriber.email] })
                }
                onSelect={(checked) => toggleSelect(subscriber.id, checked)}
                selected={selectedIds.has(subscriber.id)}
                subscriber={subscriber}
              />
            ))
          )}
        </div>

        {pagination && pagination.totalPage > 1 ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <Button
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
              variant="subtle"
            >
              上一页
            </Button>
            <span>
              {pagination.currentPage} / {pagination.totalPage}
            </span>
            <Button
              disabled={!pagination.hasNextPage}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPage, current + 1),
                )
              }
              type="button"
              variant="subtle"
            >
              下一页
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function SubscriberRow(props: {
  onDelete: () => void
  onSelect: (checked: boolean) => void
  selected: boolean
  subscriber: Subscriber
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  return (
    <article
      className={[
        'group relative flex cursor-default items-center gap-4 border-b border-neutral-200 px-4 py-3.5 transition-colors last:border-b-0 dark:border-neutral-800',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-800'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
      ].join(' ')}
      onClick={() => props.onSelect(!props.selected)}
    >
      <Checkbox
        aria-label="选择订阅者"
        checked={props.selected}
        onCheckedChange={props.onSelect}
        onClick={(event) => event.stopPropagation()}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-neutral-800 dark:text-neutral-100">
          {props.subscriber.email}
        </div>
        <div className="mt-1 sm:hidden">
          <SubscribeTags subscribe={props.subscriber.subscribe} />
        </div>
      </div>
      <div className="hidden shrink-0 sm:block">
        <SubscribeTags subscribe={props.subscriber.subscribe} />
      </div>
      <time
        className="w-24 shrink-0 text-right text-xs tabular-nums text-neutral-400"
        dateTime={props.subscriber.createdAt}
      >
        {formatDate(props.subscriber.createdAt)}
      </time>
      <Button
        aria-label="删除订阅者"
        className="h-8 px-2 text-red-600 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 dark:text-red-400"
        onClick={(event) => {
          event.stopPropagation()
          if (isConfirmingDelete) {
            props.onDelete()
            setIsConfirmingDelete(false)
          } else {
            setIsConfirmingDelete(true)
          }
        }}
        onMouseLeave={() => setIsConfirmingDelete(false)}
        type="button"
        variant="subtle"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
        {isConfirmingDelete ? '确认' : '删除'}
      </Button>
    </article>
  )
}

function SubscribeTags(props: { subscribe: number }) {
  const tags = subscribeBits.filter(({ bit }) => bit & props.subscribe)

  if (tags.length === 0) {
    return <span className="text-xs text-neutral-400">未选择</span>
  }

  return (
    <div className="flex items-center gap-1.5">
      {tags.map((tag) => (
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${tag.className}`}
          key={tag.bit}
        >
          {tag.label}
        </span>
      ))}
    </div>
  )
}

function StatCard(props: {
  icon: typeof Users
  label: string
  tone?: 'default' | 'success' | 'warning'
  value: number | string
}) {
  const Icon = props.icon
  const tone = props.tone ?? 'default'
  const toneClasses = {
    default: 'bg-white dark:bg-neutral-950 text-neutral-400',
    success: 'bg-green-50 dark:bg-green-950/30 text-green-500',
    warning: 'bg-amber-50 dark:bg-amber-950/30 text-amber-500',
  }

  return (
    <div className="flex items-center gap-4 rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className={toneClasses[tone]}>
        <Icon aria-hidden="true" className="size-7" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
          {typeof props.value === 'number'
            ? Intl.NumberFormat('zh-CN').format(props.value)
            : props.value}
        </div>
        <div className="text-xs text-neutral-500">{props.label}</div>
      </div>
    </div>
  )
}

function SubscriberSkeletonList() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <div
          className="flex items-center gap-4 border-b border-neutral-200 px-4 py-4 last:border-b-0 dark:border-neutral-800"
          key={index}
        >
          <div className="size-4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 flex-1 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="hidden h-4 w-32 rounded bg-neutral-100 sm:block dark:bg-neutral-800" />
          <div className="h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      ))}
    </div>
  )
}

function SubscribeEmptyState(props: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <MailX
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {props.hasSearch ? '未找到匹配的订阅者' : '暂无订阅者'}
      </p>
      {!props.hasSearch ? (
        <p className="mt-2 text-sm text-neutral-400">
          开启订阅功能后，访客可以订阅内容更新
        </p>
      ) : null}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
