import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  CircleAlert,
  Mail,
  Pencil,
  Plus,
  RefreshCcw,
  SearchCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { LinkModel, LinkStateCount } from '~/app/models/link'

import { LinkState, LinkStateNameMap, LinkType } from '~/app/models/link'

import {
  auditLinkWithReason,
  auditPassLink,
  checkLinksHealth,
  createLink,
  deleteLink,
  getLinks,
  getLinkStateCount,
  migrateLinkAvatars,
  updateLink,
} from '../api/links'
import { Button } from '../ui/button'
import { Panel } from '../ui/panel'
import { SelectField } from '../ui/select'
import { TextArea, TextInput } from '../ui/text-field'

const pageSize = 50

const stateTabs: Array<{
  countKey: keyof LinkStateCount
  label: string
  value: LinkState
}> = [
  { countKey: 'friends', label: '朋友们', value: LinkState.Pass },
  { countKey: 'audit', label: '待审核', value: LinkState.Audit },
  { countKey: 'outdate', label: '过时的', value: LinkState.Outdate },
  { countKey: 'reject', label: '已拒绝', value: LinkState.Reject },
  { countKey: 'banned', label: '封禁的', value: LinkState.Banned },
]

type HealthMap = Record<
  string,
  { id: string; message?: string; status: number | string }
>

export function FriendsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState(() =>
    normalizeState(searchParams.get('state')),
  )
  const [page, setPage] = useState(1)
  const [editingLink, setEditingLink] = useState<LinkModel | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<LinkModel | null>(null)
  const [health, setHealth] = useState<HealthMap>({})

  const linksQuery = useQuery({
    queryFn: () => getLinks({ page, size: pageSize, state }),
    queryKey: ['links', 'list', state, page, pageSize],
  })

  const countsQuery = useQuery({
    queryFn: getLinkStateCount,
    queryKey: ['links', 'state-count'],
  })

  useEffect(() => {
    const next = new URLSearchParams()
    next.set('state', String(state))
    setSearchParams(next, { replace: true })
  }, [setSearchParams, state])

  const invalidateLinks = async () => {
    await queryClient.invalidateQueries({ queryKey: ['links'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: async () => {
      toast.success('删除成功')
      await invalidateLinks()
    },
  })

  const auditPassMutation = useMutation({
    mutationFn: auditPassLink,
    onSuccess: async () => {
      toast.success('审核通过')
      await invalidateLinks()
    },
  })

  const auditReasonMutation = useMutation({
    mutationFn: ({
      id,
      nextState,
      reason,
    }: {
      id: string
      nextState: LinkState
      reason: string
    }) => auditLinkWithReason(id, { reason, state: nextState }),
    onSuccess: async () => {
      toast.success('已发送友链结果')
      setAuditTarget(null)
      await invalidateLinks()
    },
  })

  const healthMutation = useMutation({
    mutationFn: checkLinksHealth,
    onSuccess: (result) => {
      setHealth(
        Object.fromEntries(
          Object.entries(result).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ]),
        ),
      )
      toast.success('检查完成')
    },
  })

  const migrateMutation = useMutation({
    mutationFn: migrateLinkAvatars,
    onSuccess: async () => {
      toast.success('迁移完成')
      await invalidateLinks()
    },
  })

  const links = linksQuery.data?.data ?? []
  const pagination = linksQuery.data?.pagination
  const counts = countsQuery.data

  const openCreate = () => {
    setEditingLink(null)
    setIsEditorOpen(true)
  }

  const openEdit = (link: LinkModel) => {
    setEditingLink(link)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditingLink(null)
    setIsEditorOpen(false)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabBar
          counts={counts}
          onChange={(nextState) => {
            setState(nextState)
            setPage(1)
          }}
          value={state}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={openCreate} type="button">
            <Plus aria-hidden="true" className="size-4" />
            新增友链
          </Button>
          <Button
            disabled={healthMutation.isPending}
            onClick={() => healthMutation.mutate()}
            type="button"
            variant="subtle"
          >
            <SearchCheck aria-hidden="true" className="size-4" />
            检查可用性
          </Button>
          <Button
            disabled={migrateMutation.isPending}
            onClick={() => migrateMutation.mutate()}
            type="button"
            variant="subtle"
          >
            <RefreshCcw aria-hidden="true" className="size-4" />
            迁移头像
          </Button>
        </div>
      </div>

      <Panel
        description={pagination ? `${pagination.total} links` : undefined}
        title="Friend links"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">描述</th>
                <th className="px-4 py-3 font-medium">网址</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">邮箱</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {linksQuery.isLoading && links.length === 0 ? (
                <FriendsSkeletonRows />
              ) : links.length === 0 ? (
                <tr>
                  <td className="px-4 py-14 text-center" colSpan={7}>
                    <div className="flex flex-col items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <UserRound
                        aria-hidden="true"
                        className="mb-3 size-10 text-neutral-300 dark:text-neutral-700"
                      />
                      暂无友链
                    </div>
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <FriendRow
                    health={health[link.id]}
                    key={link.id}
                    link={link}
                    onAuditPass={() => auditPassMutation.mutate(link.id)}
                    onAuditReason={() => setAuditTarget(link)}
                    onDelete={() => deleteMutation.mutate(link.id)}
                    onEdit={() => openEdit(link)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
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
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1),
                )
              }
              type="button"
              variant="subtle"
            >
              下一页
            </Button>
          </div>
        ) : null}
      </Panel>

      <FriendEditorDialog
        link={editingLink}
        onClose={closeEditor}
        onSuccess={async () => {
          await invalidateLinks()
          closeEditor()
        }}
        open={isEditorOpen}
      />
      <AuditReasonDialog
        link={auditTarget}
        onClose={() => setAuditTarget(null)}
        onSubmit={(nextState, reason) => {
          if (!auditTarget) return
          auditReasonMutation.mutate({
            id: auditTarget.id,
            nextState,
            reason,
          })
        }}
        pending={auditReasonMutation.isPending}
      />
    </div>
  )
}

function TabBar(props: {
  counts?: LinkStateCount
  onChange: (value: LinkState) => void
  value: LinkState
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
      {stateTabs.map((tab) => {
        const active = props.value === tab.value
        const count = props.counts?.[tab.countKey] ?? 0

        return (
          <button
            className={[
              'inline-flex h-8 items-center gap-2 rounded px-3 text-sm transition-colors',
              active
                ? 'bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
            ].join(' ')}
            key={tab.value}
            onClick={() => props.onChange(tab.value)}
            type="button"
          >
            {tab.label}
            <span
              className={[
                'rounded-full px-1.5 py-0.5 text-xs',
                active
                  ? 'bg-white/20 text-current dark:bg-black/10'
                  : tab.value === LinkState.Audit && count > 0
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
              ].join(' ')}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function FriendRow(props: {
  health?: { message?: string; status: number | string }
  link: LinkModel
  onAuditPass: () => void
  onAuditReason: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  return (
    <tr className="align-top transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar avatar={props.link.avatar} name={props.link.name} />
          <a
            className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
            href={props.link.url}
            rel="noreferrer"
            target="_blank"
          >
            {props.link.name}
          </a>
        </div>
      </td>
      <td className="max-w-[18rem] px-4 py-3 text-neutral-600 dark:text-neutral-400">
        <span className="line-clamp-2">{props.link.description || '-'}</span>
      </td>
      <td className="max-w-[18rem] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <a
            className="truncate text-neutral-700 hover:underline dark:text-neutral-300"
            href={props.link.url}
            rel="noreferrer"
            target="_blank"
          >
            {props.link.url}
          </a>
          {props.health ? (
            <span
              className={[
                'size-2 shrink-0 rounded-full',
                props.health.message ? 'bg-red-400' : 'bg-green-400',
              ].join(' ')}
              title={props.health.message || String(props.health.status)}
            />
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
        {props.link.type === LinkType.Collection ? '收藏' : '朋友'}
      </td>
      <td className="px-4 py-3">
        {props.link.email ? (
          <a
            className="inline-flex items-center gap-1 text-neutral-600 hover:underline dark:text-neutral-400"
            href={`mailto:${props.link.email}`}
          >
            <Mail aria-hidden="true" className="size-3.5" />
            {props.link.email}
          </a>
        ) : (
          <span className="text-neutral-400">-</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-neutral-500 dark:text-neutral-400">
        {formatDate(props.link.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          {props.link.state === LinkState.Audit ? (
            <>
              <Button
                className="h-8 px-2"
                onClick={props.onAuditPass}
                type="button"
                variant="subtle"
              >
                <Check aria-hidden="true" className="size-3.5" />
                通过
              </Button>
              <Button
                className="h-8 px-2"
                onClick={props.onAuditReason}
                type="button"
                variant="subtle"
              >
                <CircleAlert aria-hidden="true" className="size-3.5" />
                理由
              </Button>
            </>
          ) : null}
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
            {isConfirmingDelete ? '确认' : '移除'}
          </Button>
        </div>
      </td>
    </tr>
  )
}

function FriendEditorDialog(props: {
  link: LinkModel | null
  onClose: () => void
  onSuccess: () => Promise<void>
  open: boolean
}) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState(LinkType.Friend)
  const [state, setState] = useState(LinkState.Pass)
  const [error, setError] = useState('')
  const isEdit = Boolean(props.link?.id)

  useEffect(() => {
    if (!props.open) return

    setName(props.link?.name ?? '')
    setAvatar(props.link?.avatar ?? '')
    setUrl(props.link?.url ?? '')
    setDescription(props.link?.description ?? '')
    setType(props.link?.type ?? LinkType.Friend)
    setState(props.link?.state ?? LinkState.Pass)
    setError('')
  }, [props.link, props.open])

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        avatar: avatar.trim() || undefined,
        description: description.trim() || undefined,
        name: name.trim(),
        state,
        type,
        url: url.trim(),
      }

      if (props.link?.id) return updateLink(props.link.id, data)
      return createLink(data)
    },
    onSuccess: async () => {
      toast.success('操作成功')
      await props.onSuccess()
    },
  })

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    if (!name.trim() || !url.trim()) {
      setError('名称和网址不可为空')
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
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {isEdit ? `编辑: ${props.link?.name}` : '新增友链'}
              </Dialog.Title>
              <Dialog.Close
                aria-label="关闭"
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <div className="grid gap-4 px-5 py-4">
              <TextInput
                label="名字"
                onChange={setName}
                required
                value={name}
              />
              <TextInput label="头像" onChange={setAvatar} value={avatar} />
              <TextInput label="网址" onChange={setUrl} required value={url} />
              <TextInput
                label="描述"
                onChange={setDescription}
                value={description}
              />
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  类型
                </span>
                <SelectField
                  onValueChange={setType}
                  options={[
                    { label: '朋友', value: LinkType.Friend },
                    { label: '收藏', value: LinkType.Collection },
                  ]}
                  triggerClassName="h-10"
                  value={type}
                />
              </label>
              {isEdit ? (
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    状态
                  </span>
                  <SelectField
                    onValueChange={setState}
                    options={Object.entries(LinkStateNameMap).map(
                      ([key, label]) => ({
                        label,
                        value: LinkState[key as keyof typeof LinkState],
                      }),
                    )}
                    triggerClassName="h-10"
                    value={state}
                  />
                </label>
              ) : null}
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
                确定
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function AuditReasonDialog(props: {
  link: LinkModel | null
  onClose: () => void
  onSubmit: (state: LinkState, reason: string) => void
  pending: boolean
}) {
  const [state, setState] = useState(LinkState.Pass)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!props.link) return
    setState(LinkState.Pass)
    setReason('')
  }, [props.link])

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open={Boolean(props.link)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              发送友链结果
            </Dialog.Title>
          </div>
          <div className="grid gap-4 px-5 py-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                状态
              </span>
              <SelectField
                onValueChange={setState}
                options={Object.entries(LinkStateNameMap)
                  .filter(([key]) => key !== 'Audit')
                  .map(([key, label]) => ({
                    label,
                    value: LinkState[key as keyof typeof LinkState],
                  }))}
                triggerClassName="h-10"
                value={state}
              />
            </label>
            <TextArea
              controlClassName="min-h-24"
              label="原因"
              maxLength={200}
              onChange={setReason}
              placeholder="请输入原因"
              value={reason}
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <Dialog.Close
              className="inline-flex h-9 items-center justify-center rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
              type="button"
            >
              取消
            </Dialog.Close>
            <Button
              disabled={props.pending}
              onClick={() => props.onSubmit(state, reason)}
              type="button"
            >
              发送
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Avatar(props: { avatar: string; name: string }) {
  const [failed, setFailed] = useState(false)

  if (props.avatar && !failed) {
    return (
      <img
        alt=""
        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
        onError={() => setFailed(true)}
        src={props.avatar}
      />
    )
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
      {(props.name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

function FriendsSkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((index) => (
        <tr className="animate-pulse" key={index}>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-48 rounded bg-neutral-100 dark:bg-neutral-800" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-12 rounded bg-neutral-100 dark:bg-neutral-800" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-neutral-100 dark:bg-neutral-800" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
          </td>
          <td className="px-4 py-3">
            <div className="ml-auto h-8 w-28 rounded bg-neutral-100 dark:bg-neutral-800" />
          </td>
        </tr>
      ))}
    </>
  )
}

function normalizeState(value: string | null): LinkState {
  const numeric = Number(value)
  return stateTabs.some((tab) => tab.value === numeric)
    ? numeric
    : LinkState.Pass
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
