import { useMutation, useQuery } from '@tanstack/react-query'
import { Globe, Shield } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { AccountSession } from '../../types/settings'

import { IpInfoPopover } from '~/features/_shared/components/ip-info-popover'
import { Button } from '~/ui/primitives/button'
import { Panel } from '~/ui/primitives/panel'
import { authClient } from '~/utils/authjs/auth'
import { cn } from '~/utils/cn'

import { accountQueryKey } from '../../constants'
import { listSessions } from '../../utils/account-sessions'
import { formatDateTime, getErrorMessage } from '../../utils/settings'

export function SessionSection() {
  const [expanded, setExpanded] = useState(false)
  const sessionsQuery = useQuery({
    queryFn: listSessions,
    queryKey: [...accountQueryKey, 'sessions'],
  })

  const deleteMutation = useMutation({
    mutationFn: async (session: AccountSession) => {
      if (session.current) {
        const result = await authClient.signOut()
        if (result.error) throw new Error(result.error.message || '注销失败')
      } else {
        const result = await authClient.revokeSession({ token: session.token })
        if (result.error)
          throw new Error(result.error.message || '踢出设备失败')
      }
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '操作失败')),
    onSuccess: async (_, session) => {
      toast.success(session.current ? '已注销当前会话' : '已踢出设备')
      if (session.current) window.location.reload()
      await sessionsQuery.refetch()
    },
  })

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.revokeOtherSessions()
      if (result.error) throw new Error(result.error.message || '踢出设备失败')
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '踢出设备失败')),
    onSuccess: async () => {
      toast.success('已踢出其他设备')
      await sessionsQuery.refetch()
    },
  })
  const sessions = sessionsQuery.data ?? []
  const visibleSessions = expanded ? sessions : sessions.slice(0, 5)
  const hiddenSessionCount = Math.max(
    sessions.length - visibleSessions.length,
    0,
  )

  return (
    <Panel
      description="管理登录会话，保护账户安全。"
      title={
        <span className="inline-flex items-center gap-2">
          <Shield aria-hidden="true" className="size-4" />
          登录设备
        </span>
      }
    >
      <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
        {sessionsQuery.isLoading ? (
          <div className="p-4 text-sm text-neutral-500">加载中...</div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-sm text-neutral-500">暂无会话。</div>
        ) : (
          <>
            {visibleSessions.map((session) => (
              <div className="px-4 py-3" key={session.token}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs',
                          session.current
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900',
                        )}
                      >
                        {session.current ? '当前设备' : '其他设备'}
                      </span>
                      {session.ip ? (
                        <IpInfoPopover
                          className="inline-flex min-w-0 items-center gap-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400"
                          ip={session.ip}
                          trigger={
                            <>
                              <Globe
                                aria-hidden="true"
                                className="size-3 shrink-0 text-neutral-400"
                              />
                              <span>{session.ip}</span>
                            </>
                          }
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 truncate font-mono text-xs text-neutral-600 dark:text-neutral-300">
                      {session.ua || 'Unknown user agent'}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {session.current ? '活跃时间' : '登录时间'}：
                      {formatDateTime(session.lastActiveAt)}
                    </p>
                  </div>
                  <Button
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          session.current
                            ? '确认注销当前会话？'
                            : '确认踢出此设备？',
                        )
                      ) {
                        deleteMutation.mutate(session)
                      }
                    }}
                    type="button"
                    variant="subtle"
                  >
                    {session.current ? '注销' : '踢出'}
                  </Button>
                </div>
              </div>
            ))}
            {sessions.length > 5 ? (
              <div className="px-4 py-3">
                <button
                  className="flex w-full items-center justify-center text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                  onClick={() => setExpanded((current) => !current)}
                  type="button"
                >
                  {expanded
                    ? '收起'
                    : `查看更多（${hiddenSessionCount} 个设备）`}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="flex justify-end border-t border-neutral-100 p-3 dark:border-neutral-900">
        <Button
          disabled={revokeOthersMutation.isPending}
          onClick={() => {
            if (window.confirm('确认踢掉全部其他登录设备？')) {
              revokeOthersMutation.mutate()
            }
          }}
          type="button"
          variant="subtle"
        >
          踢掉其他设备
        </Button>
      </div>
    </Panel>
  )
}
