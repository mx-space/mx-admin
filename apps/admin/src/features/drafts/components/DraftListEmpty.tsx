import { Inbox } from 'lucide-react'

export function DraftListEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Inbox aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        暂无草稿
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        草稿会在编辑时自动保存到这里。
      </p>
    </div>
  )
}
