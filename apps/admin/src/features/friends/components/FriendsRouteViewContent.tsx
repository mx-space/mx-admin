import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCcw, SearchCheck, UserRound } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { LinkModel } from '~/models/link'
import type { HealthMap } from '../types/friends'

import {
  auditLinkWithReason,
  auditPassLink,
  checkLinksHealth,
  deleteLink,
  getLinks,
  getLinkStateCount,
  migrateLinkAvatars,
} from '~/api/links'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { LinkState } from '~/models/link'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { friendsPageSize, friendsQueryKey } from '../constants'
import { normalizeState, readPage } from '../utils/friends'
import { AuditReasonDialog } from './AuditReasonDialog'
import { FriendEditorDialog } from './FriendEditorDialog'
import { FriendRow } from './FriendRow'
import { FriendsEmptyRow, FriendsSkeletonRows } from './FriendsPrimitives'
import { FriendsTabBar } from './FriendsTabBar'

export function FriendsRouteViewContent() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [state, setState] = useState(() =>
    normalizeState(searchParams.get('state')),
  )
  const [page, setPage] = useState(() => readPage(searchParams.get('page')))
  const [editingLink, setEditingLink] = useState<LinkModel | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [auditTarget, setAuditTarget] = useState<LinkModel | null>(null)
  const [health, setHealth] = useState<HealthMap>({})

  const linksQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getLinks({ page, size: friendsPageSize, state }),
    queryKey: [...friendsQueryKey, 'list', state, page, friendsPageSize],
  })

  const countsQuery = useQuery({
    queryFn: getLinkStateCount,
    queryKey: [...friendsQueryKey, 'state-count'],
  })

  useLayoutEffect(() => {
    const nextState = normalizeState(searchParams.get('state'))
    const nextPage = readPage(searchParams.get('page'))

    setState((value) => (value === nextState ? value : nextState))
    setPage((value) => (value === nextPage ? value : nextPage))
  }, [searchParamsKey])

  useEffect(() => {
    const next = new URLSearchParams()
    next.set('state', String(state))
    if (page > 1) next.set('page', String(page))
    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [page, searchParamsKey, setSearchParams, state])

  const invalidateLinks = async () => {
    await queryClient.invalidateQueries({ queryKey: friendsQueryKey })
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
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            <UserRound aria-hidden="true" className="size-4" />
            友链
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-neutral-500 sm:inline dark:text-neutral-400">
            {pagination ? `${pagination.total} 条` : '加载中'}
          </span>
          <Button onClick={openCreate} type="button" variant="subtle">
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">新增友链</span>
          </Button>
          <Button
            aria-label="检查友链可用性"
            disabled={healthMutation.isPending}
            onClick={() => healthMutation.mutate()}
            type="button"
            variant="subtle"
          >
            <SearchCheck aria-hidden="true" className="size-4" />
            <span className="hidden lg:inline">检查可用性</span>
          </Button>
          <Button
            aria-label="迁移头像"
            disabled={migrateMutation.isPending}
            onClick={() => migrateMutation.mutate()}
            type="button"
            variant="subtle"
          >
            <RefreshCcw aria-hidden="true" className="size-4" />
            <span className="hidden lg:inline">迁移头像</span>
          </Button>
        </div>
      </div>

      <div className="shrink-0 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <FriendsTabBar
          counts={counts}
          onChange={(nextState) => {
            setState(nextState)
            setPage(1)
          }}
          value={state}
        />
      </div>

      <Scroll className="flex-1" orientation="both">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
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
              <FriendsEmptyRow />
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
      </Scroll>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
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
    </section>
  )
}
