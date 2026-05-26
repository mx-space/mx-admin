import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MailX, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  getSubscribers,
  getSubscribeStatus,
  unsubscribeBatch,
  updateSubscribeEnabled,
} from '~/api/subscribe'
import { Button } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { Scroll } from '~/ui/scroll'
import { Switch } from '~/ui/switch'
import { TextInput } from '~/ui/text-field'

import { pageSize } from '../constants'
import { StatCard } from './StatCard'
import { SubscribeEmptyState } from './SubscribeEmptyState'
import { SubscriberRow } from './SubscriberRow'
import { SubscriberSkeletonList } from './SubscriberSkeletonList'

export function SubscribeRouteViewContent() {
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

        <Scroll className="flex-1">
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
        </Scroll>

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
