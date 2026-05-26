import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Pencil,
  Play,
  Shield,
  Trash2,
  Webhook,
} from 'lucide-react'
import { useState } from 'react'
import type { WebhookModel } from '~/api/webhooks'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { getScopeText } from '../utils/webhooks'
import { EventBadge, InfoCard, StatusDot } from './WebhookPrimitives'

export function WebhookDetail(props: {
  onBack: () => void
  onDelete: () => void
  onEdit: () => void
  onTest: (event: string) => void
  showBack: boolean
  webhook: WebhookModel
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const targetUrl = props.webhook.payloadUrl || props.webhook.url

  return (
    <section className="flex min-h-0 flex-col border-b border-neutral-200 dark:border-neutral-800">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {props.showBack ? (
            <Button
              aria-label="返回 Webhook 列表"
              className="h-8 px-2 lg:hidden"
              onClick={props.onBack}
              type="button"
              variant="subtle"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
          <h2 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Webhook 详情
          </h2>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            className="h-8 px-2"
            onClick={props.onEdit}
            type="button"
            variant="subtle"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            编辑
          </Button>
          <Button
            className="h-8 px-2 text-red-600 dark:text-red-400"
            onClick={() => {
              if (isConfirmingDelete) {
                props.onDelete()
                setIsConfirmingDelete(false)
              } else {
                setIsConfirmingDelete(true)
              }
            }}
            onMouseLeave={() => setIsConfirmingDelete(false)}
            type="button"
            variant="subtle"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            {isConfirmingDelete ? '确认' : '删除'}
          </Button>
        </div>
      </div>

      <Scroll className="flex-1">
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <Webhook
                  aria-hidden="true"
                  className="size-7 text-neutral-500 dark:text-neutral-400"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-white dark:border-neutral-950 dark:bg-neutral-950">
                <StatusDot enabled={props.webhook.enabled} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {targetUrl}
                </h2>
                {targetUrl ? (
                  <a
                    className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    href={targetUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </a>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                  {props.webhook.enabled ? '已启用' : '已禁用'}
                </span>
                <span>{getScopeText(props.webhook.scope)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard
              icon={Globe}
              label="触发范围"
              value={getScopeText(props.webhook.scope)}
            />
            <InfoCard
              icon={Shield}
              label="Secret"
              value={props.webhook.secret ? '已配置' : '未配置'}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              触发事件 ({props.webhook.events.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {props.webhook.events.map((event) => (
                <EventBadge event={event} key={event} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              发送测试
            </h3>
            <div className="flex flex-wrap gap-2">
              {props.webhook.events.map((event) => (
                <Button
                  className="h-8 px-2"
                  key={event}
                  onClick={() => props.onTest(event)}
                  type="button"
                  variant="subtle"
                >
                  <Play aria-hidden="true" className="size-3.5" />
                  {event}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Scroll>
    </section>
  )
}
