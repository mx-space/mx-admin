import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  ExternalLink,
  Globe,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Webhook,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { WebhookEventRecord, WebhookModel } from '../api/webhooks'

import {
  createWebhook,
  deleteWebhook,
  EventScope,
  getWebhookDispatches,
  getWebhookEvents,
  getWebhooks,
  redispatchWebhook,
  testWebhook,
  updateWebhook,
} from '../api/webhooks'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Panel } from '../ui/panel'
import { Switch } from '../ui/switch'
import { TextInput } from '../ui/text-field'

const dispatchPageSize = 20

const scopeOptions = [
  { label: '访客操作', value: EventScope.TO_VISITOR },
  { label: '管理员操作', value: EventScope.TO_ADMIN },
  { label: '系统事件', value: EventScope.TO_SYSTEM },
]

export function WebhooksPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingWebhook, setEditingWebhook] = useState<WebhookModel | null>(
    null,
  )
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const webhooksQuery = useQuery({
    queryFn: getWebhooks,
    queryKey: ['webhooks', 'list'],
  })

  const webhooks = webhooksQuery.data ?? []
  const selectedWebhook =
    webhooks.find((webhook) => webhook.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId && webhooks.length > 0) {
      setSelectedId(webhooks[0].id)
    }
  }, [selectedId, webhooks])

  const invalidateWebhooks = async () => {
    await queryClient.invalidateQueries({ queryKey: ['webhooks'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: async () => {
      toast.success('Webhook 已删除')
      setSelectedId(null)
      await invalidateWebhooks()
    },
  })

  const testMutation = useMutation({
    mutationFn: ({ event, id }: { event: string; id: string }) =>
      testWebhook(id, event),
    onSuccess: () => {
      toast.success('测试请求已发送')
    },
    onError: () => {
      toast.error('测试请求发送失败')
    },
  })

  const openCreate = () => {
    setEditingWebhook(null)
    setIsEditorOpen(true)
  }

  const openEdit = (webhook: WebhookModel) => {
    setEditingWebhook(webhook)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditingWebhook(null)
    setIsEditorOpen(false)
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden rounded border border-neutral-200 bg-white xl:grid-cols-[360px_minmax(0,1fr)] dark:border-neutral-800 dark:bg-neutral-950">
      <section className="flex min-h-0 flex-col border-b border-neutral-200 xl:border-b-0 xl:border-r dark:border-neutral-800">
        <div className="flex min-h-12 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Webhooks
            </span>
            <span className="ml-2 text-xs text-neutral-400">
              {webhooks.filter((webhook) => webhook.enabled).length}/
              {webhooks.length} 启用
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              aria-label="刷新"
              className="h-8 px-2"
              onClick={() => {
                void invalidateWebhooks()
              }}
              type="button"
              variant="subtle"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
            </Button>
            <Button className="h-8 px-2" onClick={openCreate} type="button">
              <Plus aria-hidden="true" className="size-3.5" />
              添加
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {webhooksQuery.isLoading && webhooks.length === 0 ? (
            <WebhookListSkeleton />
          ) : webhooks.length === 0 ? (
            <WebhookListEmptyState onCreate={openCreate} />
          ) : (
            webhooks.map((webhook) => (
              <button
                className={[
                  'flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-900',
                  selectedId === webhook.id
                    ? 'bg-neutral-100 dark:bg-neutral-900'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
                ].join(' ')}
                key={webhook.id}
                onClick={() => setSelectedId(webhook.id)}
                type="button"
              >
                <StatusDot enabled={webhook.enabled} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {webhook.payloadUrl || webhook.url}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
                    <span>{webhook.events.length} 个事件</span>
                    <span>·</span>
                    <span>{getScopeText(webhook.scope)}</span>
                  </div>
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {webhook.enabled ? '启用' : '禁用'}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
        {selectedWebhook ? (
          <>
            <WebhookDetail
              onDelete={() => deleteMutation.mutate(selectedWebhook.id)}
              onEdit={() => openEdit(selectedWebhook)}
              onTest={(event) =>
                testMutation.mutate({ event, id: selectedWebhook.id })
              }
              webhook={selectedWebhook}
            />
            <WebhookDispatches webhookId={selectedWebhook.id} />
          </>
        ) : (
          <WebhookDetailEmptyState />
        )}
      </section>

      <WebhookEditorDialog
        onClose={closeEditor}
        onSuccess={async (createdOrUpdated) => {
          await invalidateWebhooks()
          setSelectedId(createdOrUpdated.id)
          closeEditor()
        }}
        open={isEditorOpen}
        webhook={editingWebhook}
      />
    </div>
  )
}

function WebhookDetail(props: {
  onDelete: () => void
  onEdit: () => void
  onTest: (event: string) => void
  webhook: WebhookModel
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const targetUrl = props.webhook.payloadUrl || props.webhook.url

  return (
    <div className="min-h-0 overflow-y-auto border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
              <Webhook
                aria-hidden="true"
                className="size-7 text-neutral-500 dark:text-neutral-400"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white dark:border-neutral-950 dark:bg-neutral-950">
              <StatusDot enabled={props.webhook.enabled} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {targetUrl}
              </h2>
              {targetUrl ? (
                <a
                  className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  href={targetUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                {props.webhook.enabled ? '已启用' : '已禁用'}
              </span>
              <span>{getScopeText(props.webhook.scope)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="h-8 px-2"
              onClick={props.onEdit}
              type="button"
              variant="subtle"
            >
              <Pencil aria-hidden="true" className="size-3.5" />
              编辑
            </Button>
            <Button
              className="h-8 px-2 text-red-600 dark:text-red-400"
              onClick={() => {
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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard
            icon={Globe}
            label="触发范围"
            value={getScopeText(props.webhook.scope)}
          />
          <InfoCard
            icon={Shield}
            label="Secret"
            value={props.webhook.secret ? '已配置' : '未配置'}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            触发事件 ({props.webhook.events.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {props.webhook.events.map((event) => (
              <EventBadge event={event} key={event} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            发送测试
          </h3>
          <div className="flex flex-wrap gap-2">
            {props.webhook.events.map((event) => (
              <Button
                className="h-8 px-2"
                key={event}
                onClick={() => props.onTest(event)}
                type="button"
                variant="subtle"
              >
                <Play aria-hidden="true" className="size-3.5" />
                {event}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WebhookDispatches(props: { webhookId: string }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const dispatchesQuery = useQuery({
    queryFn: () =>
      getWebhookDispatches(props.webhookId, {
        page,
        size: dispatchPageSize,
      }),
    queryKey: ['webhooks', 'dispatches', props.webhookId, page],
  })

  useEffect(() => {
    setPage(1)
    setExpandedId(null)
  }, [props.webhookId])

  const redispatchMutation = useMutation({
    mutationFn: (eventId: string) =>
      redispatchWebhook(props.webhookId, eventId),
    onSuccess: async () => {
      toast.success('已重新推送')
      await queryClient.invalidateQueries({
        queryKey: ['webhooks', 'dispatches', props.webhookId],
      })
    },
    onError: () => {
      toast.error('重新推送失败')
    },
  })

  const dispatches = dispatchesQuery.data?.data ?? []
  const pagination = dispatchesQuery.data?.pagination

  return (
    <Panel
      className="min-h-0 overflow-hidden rounded-none border-0"
      description={pagination ? `共 ${pagination.total} 条` : undefined}
      title="推送记录"
    >
      <div className="min-h-0 overflow-y-auto">
        {dispatchesQuery.isLoading && dispatches.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950 dark:border-neutral-700 dark:border-t-neutral-100" />
          </div>
        ) : dispatches.length === 0 ? (
          <div className="py-20 text-center text-sm text-neutral-400">
            暂无推送记录
          </div>
        ) : (
          dispatches.map((dispatch) => (
            <DispatchRow
              dispatch={dispatch}
              expanded={expandedId === dispatch.id}
              key={dispatch.id}
              onRedispatch={() => redispatchMutation.mutate(dispatch.id)}
              onToggle={() =>
                setExpandedId((current) =>
                  current === dispatch.id ? null : dispatch.id,
                )
              }
            />
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 border-t border-neutral-200 py-2 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <Button
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
            variant="subtle"
          >
            上一页
          </Button>
          <span>
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            type="button"
            variant="subtle"
          >
            下一页
          </Button>
        </div>
      ) : null}
    </Panel>
  )
}

function WebhookEditorDialog(props: {
  onClose: () => void
  onSuccess: (webhook: WebhookModel) => Promise<void>
  open: boolean
  webhook: WebhookModel | null
}) {
  const [payloadUrl, setPayloadUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [scope, setScope] = useState(EventScope.TO_SYSTEM)
  const [events, setEvents] = useState<string[]>([])
  const [error, setError] = useState('')
  const isEdit = Boolean(props.webhook?.id)

  const eventsQuery = useQuery({
    enabled: props.open,
    queryFn: getWebhookEvents,
    queryKey: ['webhooks', 'events'],
  })
  const availableEvents = eventsQuery.data ?? []
  const allEventsChecked = events.includes('all')

  useEffect(() => {
    if (!props.open) return

    setPayloadUrl(props.webhook?.payloadUrl || props.webhook?.url || '')
    setSecret('')
    setEnabled(props.webhook?.enabled ?? true)
    setScope(props.webhook?.scope ?? EventScope.TO_SYSTEM)
    setEvents(props.webhook?.events ?? [])
    setError('')
  }, [props.open, props.webhook])

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        enabled,
        events,
        payloadUrl: payloadUrl.trim(),
        scope,
        ...(secret.trim() ? { secret: secret.trim() } : {}),
      }

      if (props.webhook?.id) return updateWebhook(props.webhook.id, data)
      return createWebhook({ ...data, secret: secret.trim() || '' })
    },
    onSuccess: async (webhook) => {
      toast.success(isEdit ? 'Webhook 更新成功' : 'Webhook 创建成功')
      await props.onSuccess(webhook)
    },
  })

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    if (!payloadUrl.trim()) {
      setError('Payload URL 不可为空')
      return
    }

    if (events.length === 0) {
      setError('至少选择一个触发事件')
      return
    }

    setError('')
    mutation.mutate()
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open={props.open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded border border-neutral-200 bg-white shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950">
          <form className="flex max-h-[90vh] flex-col" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {isEdit ? '编辑 Webhook' : '创建 Webhook'}
              </Dialog.Title>
              <Dialog.Close
                aria-label="关闭"
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <div className="grid min-h-0 gap-4 overflow-y-auto px-5 py-4">
              <TextInput
                label="Payload URL"
                onChange={setPayloadUrl}
                placeholder="https://example.com/webhook"
                required
                value={payloadUrl}
              />
              <TextInput
                label="Secret"
                onChange={setSecret}
                placeholder={isEdit ? '留空保持不变' : '可选的签名密钥'}
                type="password"
                value={secret}
              />

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  触发事件 <span className="text-red-500">*</span>
                </legend>
                <label className="flex items-center gap-2 rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                  <Checkbox
                    checked={allEventsChecked}
                    onCheckedChange={(checked) =>
                      setEvents(checked ? ['all'] : [])
                    }
                  />
                  全部事件
                </label>
                <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-900/50">
                  {availableEvents.map((event) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={event}
                    >
                      <Checkbox
                        checked={allEventsChecked || events.includes(event)}
                        disabled={allEventsChecked}
                        onCheckedChange={(checked) => {
                          setEvents((current) =>
                            checked
                              ? [...current, event]
                              : current.filter((value) => value !== event),
                          )
                        }}
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  触发范围
                </legend>
                <div className="flex flex-wrap gap-3">
                  {scopeOptions.map((option) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={option.value}
                    >
                      <Checkbox
                        checked={(scope & option.value) === option.value}
                        onCheckedChange={(checked) =>
                          setScope((current) =>
                            checked
                              ? current | option.value
                              : current & ~option.value,
                          )
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Switch
                checked={enabled}
                label="启用状态"
                onCheckedChange={setEnabled}
              />

              {error ? (
                <span className="text-xs text-red-500">{error}</span>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Close
                className="inline-flex h-9 items-center justify-center rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                type="button"
              >
                取消
              </Dialog.Close>
              <Button disabled={mutation.isPending} type="submit">
                {isEdit ? '保存' : '创建'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DispatchRow(props: {
  dispatch: WebhookEventRecord
  expanded: boolean
  onRedispatch: () => void
  onToggle: () => void
}) {
  return (
    <div>
      <button
        className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/50"
        onClick={props.onToggle}
        type="button"
      >
        <ChevronRight
          aria-hidden="true"
          className={[
            'size-3.5 shrink-0 text-neutral-400 transition-transform',
            props.expanded ? 'rotate-90' : '',
          ].join(' ')}
        />
        <StatusDot enabled={props.dispatch.success} />
        <div className="min-w-0 flex-1">
          <EventBadge event={props.dispatch.event} />
        </div>
        <span
          className={[
            'rounded px-1.5 py-0.5 text-xs',
            props.dispatch.success
              ? 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
          ].join(' ')}
        >
          {props.dispatch.status}
        </span>
        <time
          className="shrink-0 text-xs text-neutral-400"
          dateTime={props.dispatch.timestamp}
        >
          {formatDateTime(props.dispatch.timestamp)}
        </time>
      </button>
      {props.expanded ? (
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-900 dark:bg-neutral-900/50">
          <div className="mb-3 flex justify-end">
            <Button
              className="h-8 px-2"
              onClick={props.onRedispatch}
              type="button"
              variant="subtle"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              重新推送
            </Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <JsonBlock content={props.dispatch.payload} label="Payload" />
            <JsonBlock content={props.dispatch.response} label="Response" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function InfoCard(props: { icon: typeof Globe; label: string; value: string }) {
  const Icon = props.icon

  return (
    <div className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
        <Icon aria-hidden="true" className="size-4" />
        <span className="text-xs">{props.label}</span>
      </div>
      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {props.value}
      </div>
    </div>
  )
}

function EventBadge(props: { event: string }) {
  const colorClass = getEventColorClass(props.event)

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${colorClass}`}>
      {props.event}
    </span>
  )
}

function JsonBlock(props: { content: unknown; label: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-neutral-500">
        {props.label}
      </div>
      <pre className="max-h-56 overflow-auto rounded bg-neutral-100 p-2 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
        {formatJson(props.content) || '-'}
      </pre>
    </div>
  )
}

function StatusDot(props: { enabled: boolean }) {
  return (
    <span
      className={[
        'inline-flex size-2 shrink-0 rounded-full',
        props.enabled ? 'bg-green-500' : 'bg-neutral-400',
      ].join(' ')}
    />
  )
}

function WebhookListEmptyState(props: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Webhook
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500">暂无 Webhook</p>
      <p className="mb-4 mt-1 text-xs text-neutral-400">
        创建 Webhook 以接收事件推送
      </p>
      <Button onClick={props.onCreate} type="button">
        <Plus aria-hidden="true" className="size-4" />
        创建 Webhook
      </Button>
    </div>
  )
}

function WebhookDetailEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
      <Webhook
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <h3 className="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
        选择一个 Webhook
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        从左侧列表选择查看详情
      </p>
    </div>
  )
}

function WebhookListSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4].map((index) => (
        <div
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-900"
          key={index}
        >
          <div className="size-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-3 w-28 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function getScopeText(scope: number) {
  const scopes: string[] = []
  if ((scope & EventScope.TO_VISITOR) === EventScope.TO_VISITOR) {
    scopes.push('访客')
  }
  if ((scope & EventScope.TO_ADMIN) === EventScope.TO_ADMIN) {
    scopes.push('管理员')
  }
  if ((scope & EventScope.TO_SYSTEM) === EventScope.TO_SYSTEM) {
    scopes.push('系统')
  }
  return scopes.join(', ') || '未指定'
}

function getEventColorClass(event: string) {
  if (event === 'all') {
    return 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
  }
  if (event.includes('create')) {
    return 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400'
  }
  if (event.includes('update')) {
    return 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
  }
  if (event.includes('delete')) {
    return 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
  }
  return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
}

function formatJson(content: unknown) {
  if (!content) return ''
  if (typeof content === 'string') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      return content
    }
  }
  return JSON.stringify(content, null, 2)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
