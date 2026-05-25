import { useQuery } from '@tanstack/react-query'
import { Loader2, Menu, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { PropsWithChildren } from 'react'

import { AITaskStatus, getAiTasks } from './api/ai'
import { useI18n } from './i18n'
import { cn } from './ui/cn'
import { Drawer } from './ui/drawer'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from './ui/layout'
import { ShellNavProvider, useShellNav } from './ui/shell-nav-context'
import { SidebarBody } from './ui/sidebar-body'

export function AdminShell(props: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [navOpen, setNavOpen] = useState(false)
  const pendingAiTasksQuery = useQuery({
    queryFn: () =>
      getAiTasks({
        page: 1,
        size: 1,
        status: AITaskStatus.Pending,
      }),
    queryKey: ['shell', 'ai-tasks', AITaskStatus.Pending],
    refetchInterval: 5000,
  })
  const runningAiTasksQuery = useQuery({
    queryFn: () =>
      getAiTasks({
        page: 1,
        size: 1,
        status: AITaskStatus.Running,
      }),
    queryKey: ['shell', 'ai-tasks', AITaskStatus.Running],
    refetchInterval: 5000,
  })
  const activeAiTaskCount =
    (pendingAiTasksQuery.data?.total ?? 0) +
    (runningAiTasksQuery.data?.total ?? 0)
  const isFetchingAiTaskCount =
    pendingAiTasksQuery.isFetching || runningAiTasksQuery.isFetching

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handle = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setNavOpen(false)
      }
    }
    mql.addEventListener('change', handle)
    return () => mql.removeEventListener('change', handle)
  }, [])

  return (
    <ShellNavProvider open={navOpen} setOpen={setNavOpen}>
      <main className="grid h-screen min-h-0 grid-cols-[minmax(0,1fr)] overflow-hidden bg-neutral-50 text-neutral-950 lg:grid-cols-[240px_minmax(0,1fr)] dark:bg-neutral-950 dark:text-neutral-50">
        <aside className="hidden h-screen min-h-0 flex-col border-r border-neutral-200 bg-white lg:flex dark:border-neutral-800 dark:bg-neutral-950">
          <SidebarBody />
        </aside>

        <section className="flex h-screen min-h-0 min-w-0 flex-col">
          <MobileShellTopBar />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {props.children}
            {activeAiTaskCount > 0 ? (
              <AiTaskFloatingButton
                activeCount={activeAiTaskCount}
                fetching={isFetchingAiTaskCount}
                onClick={() => navigate('/ai/tasks')}
              />
            ) : null}
          </div>
        </section>

        <Drawer
          onClose={() => setNavOpen(false)}
          open={navOpen}
          side="left"
          title={t('common.primaryNavigation')}
          widthClassName="w-[min(85vw,18rem)]"
        >
          <SidebarBody />
        </Drawer>
      </main>
    </ShellNavProvider>
  )
}

function MobileShellTopBar() {
  const shellNav = useShellNav()
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 lg:hidden dark:border-neutral-800 dark:bg-neutral-950',
        APP_SHELL_HEADER_HEIGHT_CLASS,
      )}
    >
      <button
        aria-label="打开导航"
        className="inline-flex size-9 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
        onClick={() => shellNav?.toggle()}
        type="button"
      >
        <Menu aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

function AiTaskFloatingButton(props: {
  activeCount: number
  fetching: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={`查看 AI 任务，当前 ${props.activeCount} 个任务处理中`}
      className="outline-hidden absolute bottom-4 right-4 z-30 inline-flex h-10 items-center gap-2 rounded-full border border-neutral-950 bg-neutral-950 px-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-shallow)] dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
      onClick={props.onClick}
      title="AI 任务"
      type="button"
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        <Sparkles aria-hidden="true" className="size-4" />
        {props.fetching ? (
          <Loader2
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-2.5 animate-spin"
          />
        ) : null}
      </span>
      <span>AI 任务</span>
      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-semibold tabular-nums text-neutral-950 dark:bg-neutral-950 dark:text-white">
        {props.activeCount > 99 ? '99+' : props.activeCount}
      </span>
    </button>
  )
}
