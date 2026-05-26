import { Plus, Webhook } from 'lucide-react'

import { Button } from '~/ui/button'

export function WebhookListSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4].map((index) => (
        <div
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-900"
          key={index}
        >
          <div className="size-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-3 w-28 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function WebhookListEmptyState(props: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Webhook
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500">暂无 Webhook</p>
      <p className="mb-4 mt-1 text-xs text-neutral-400">
        创建 Webhook 以接收事件推送
      </p>
      <Button onClick={props.onCreate} type="button">
        <Plus aria-hidden="true" className="size-4" />
        创建 Webhook
      </Button>
    </div>
  )
}

export function WebhookDetailEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
      <Webhook
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <h3 className="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
        选择一个 Webhook
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        从左侧列表选择查看详情
      </p>
    </div>
  )
}
