import { MailX } from 'lucide-react'

export function SubscribeEmptyState(props: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <MailX
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {props.hasSearch ? '未找到匹配的订阅者' : '暂无订阅者'}
      </p>
      {!props.hasSearch ? (
        <p className="mt-2 text-sm text-neutral-400">
          开启订阅功能后，访客可以订阅内容更新
        </p>
      ) : null}
    </div>
  )
}
