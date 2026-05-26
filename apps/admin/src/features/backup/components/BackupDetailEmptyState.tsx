import { Database } from 'lucide-react'

export function BackupDetailEmptyState() {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
      <Database
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <h3 className="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
        选择一个备份
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        从左侧列表选择查看详情
      </p>
    </div>
  )
}
