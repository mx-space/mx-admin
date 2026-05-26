import { Download, RefreshCw } from 'lucide-react'

import { cn } from '~/utils/cn'

export function DashboardRuntimeFooter(props: {
  adminLatestVersion?: string
  adminVersion: string
  onCheckUpdates: () => void
  onOpenUpgrade: () => void
  pageSource: string
  refreshing: boolean
  systemLatestVersion?: string
  systemVersion: string
}) {
  return (
    <footer className="border-t border-neutral-100 pb-4 pt-4 text-center text-xs leading-6 text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
      <div className="inline-flex flex-wrap items-center justify-center gap-2">
        <span>
          面板版本: {props.adminVersion}
          {props.adminLatestVersion
            ? ` / 最新 ${props.adminLatestVersion}`
            : ''}
        </span>
        <button
          aria-label="检查更新"
          className="inline-flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
          disabled={props.refreshing}
          onClick={props.onCheckUpdates}
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn('size-3.5', props.refreshing && 'animate-spin')}
          />
        </button>
        <button
          className="inline-flex h-6 items-center gap-1 rounded border border-neutral-200 px-2 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
          onClick={props.onOpenUpgrade}
          type="button"
        >
          <Download aria-hidden="true" className="size-3" />
          更新面板
        </button>
      </div>
      <div>
        系统版本: {props.systemVersion}
        {props.systemLatestVersion
          ? ` / 最新 ${props.systemLatestVersion}`
          : ''}
      </div>
      <div>页面来源: {props.pageSource || 'N/A'}</div>
    </footer>
  )
}
