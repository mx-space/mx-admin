import { Hash } from 'lucide-react'

export function TopicDetailEmpty() {
  return (
    <div className="flex h-full min-h-[28rem] items-center justify-center px-4 text-center">
      <div>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
          <Hash aria-hidden="true" className="size-7" />
        </div>
        <h2 className="mt-4 text-base font-medium text-neutral-950 dark:text-neutral-50">
          选择一个专栏
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择专栏查看详情。
        </p>
      </div>
    </div>
  )
}
