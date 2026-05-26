import { FolderOpen } from 'lucide-react'

export function DetailEmpty() {
  return (
    <div className="flex h-full min-h-[28rem] items-center justify-center px-4 text-center">
      <div>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
          <FolderOpen aria-hidden="true" className="size-7" />
        </div>
        <h2 className="mt-4 text-base font-medium text-neutral-950 dark:text-neutral-50">
          选择一个分类或标签
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          选择后可查看关联文章、编辑分类或删除分类。
        </p>
      </div>
    </div>
  )
}
