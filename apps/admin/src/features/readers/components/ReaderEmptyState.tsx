import { Users } from 'lucide-react'

export function ReaderEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Users
        aria-hidden="true"
        className="mb-4 size-12 text-neutral-300 dark:text-neutral-600"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">暂无读者</p>
    </div>
  )
}
