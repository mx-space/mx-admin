import { Search } from 'lucide-react'

export function SearchIndexEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <Search
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        暂无匹配的索引行
      </p>
    </div>
  )
}
