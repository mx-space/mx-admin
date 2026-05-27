import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { WebhookModel } from '~/api/webhooks'

import { deleteWebhook, getWebhooks, testWebhook } from '~/api/webhooks'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { webhooksQueryKey } from '../constants'
import { WebhookDetail } from './WebhookDetail'
import { WebhookDispatches } from './WebhookDispatches'
import { WebhookEditorDialog } from './WebhookEditorDialog'
import { WebhookList } from './WebhookList'
import {
  WebhookDetailEmptyState,
  WebhookListEmptyState,
  WebhookListSkeleton,
} from './WebhookStates'

export function WebhooksRouteViewContent() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingWebhook, setEditingWebhook] = useState<WebhookModel | null>(
    null,
  )
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const webhooksQuery = useQuery({
    queryFn: getWebhooks,
    queryKey: [...webhooksQueryKey, 'list'],
  })

  const webhooks = webhooksQuery.data ?? []
  const selectedWebhook =
    webhooks.find((webhook) => webhook.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId && webhooks.length > 0) {
      setSelectedId(webhooks[0].id)
    }
  }, [selectedId, webhooks])

  const invalidateWebhooks = async () => {
    await queryClient.invalidateQueries({ queryKey: webhooksQueryKey })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: async () => {
      toast.success(t('webhooks.toast.deleted'))
      setSelectedId(null)
      setShowDetailOnMobile(false)
      await invalidateWebhooks()
    },
    onError: () => {
      toast.error(t('webhooks.toast.deleteFailed'))
    },
  })

  const testMutation = useMutation({
    mutationFn: ({ event, id }: { event: string; id: string }) =>
      testWebhook(id, event),
    onSuccess: () => {
      toast.success(t('webhooks.toast.tested'))
    },
    onError: () => {
      toast.error(t('webhooks.toast.testFailed'))
    },
  })

  const openCreate = () => {
    setEditingWebhook(null)
    setIsEditorOpen(true)
  }

  const openEdit = (webhook: WebhookModel) => {
    setEditingWebhook(webhook)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditingWebhook(null)
    setIsEditorOpen(false)
  }

  return (
    <>
      <MasterDetailLayout
        defaultSize={0.36}
        list={
          <section className="flex h-full min-h-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
            <div
              className={cn(
                'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
                APP_SHELL_HEADER_HEIGHT_CLASS,
              )}
            >
              <div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Webhooks
                </span>
                <span className="ml-2 text-xs text-neutral-400">
                  {t('webhooks.enabledCount', {
                    enabled: webhooks.filter((webhook) => webhook.enabled)
                      .length,
                    total: webhooks.length,
                  })}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  aria-label={t('webhooks.refreshAria')}
                  className="h-8 px-2"
                  onClick={() => {
                    void invalidateWebhooks()
                  }}
                  type="button"
                  variant="subtle"
                >
                  <RefreshCw aria-hidden="true" className="size-3.5" />
                </Button>
                <Button className="h-8 px-2" onClick={openCreate} type="button">
                  <Plus aria-hidden="true" className="size-3.5" />
                  {t('webhooks.add')}
                </Button>
              </div>
            </div>

            <Scroll className="flex-1">
              {webhooksQuery.isLoading && webhooks.length === 0 ? (
                <WebhookListSkeleton />
              ) : webhooks.length === 0 ? (
                <WebhookListEmptyState onCreate={openCreate} />
              ) : (
                <WebhookList
                  onSelect={(webhook) => {
                    setSelectedId(webhook.id)
                    setShowDetailOnMobile(true)
                  }}
                  selectedId={selectedId}
                  webhooks={webhooks}
                />
              )}
            </Scroll>
          </section>
        }
        showDetailOnMobile={showDetailOnMobile}
        detail={
          <section
            className={cn(
              'h-full min-h-0',
              selectedWebhook
                ? 'grid grid-rows-[minmax(0,1fr)_minmax(18rem,0.75fr)]'
                : null,
            )}
          >
            {selectedWebhook ? (
              <>
                <WebhookDetail
                  onBack={() => setShowDetailOnMobile(false)}
                  onDelete={() => deleteMutation.mutate(selectedWebhook.id)}
                  onEdit={() => openEdit(selectedWebhook)}
                  onTest={(event) =>
                    testMutation.mutate({ event, id: selectedWebhook.id })
                  }
                  showBack={showDetailOnMobile}
                  webhook={selectedWebhook}
                />
                <WebhookDispatches webhookId={selectedWebhook.id} />
              </>
            ) : (
              <WebhookDetailEmptyState />
            )}
          </section>
        }
      />

      <WebhookEditorDialog
        onClose={closeEditor}
        onSuccess={async (createdOrUpdated) => {
          await invalidateWebhooks()
          setSelectedId(createdOrUpdated.id)
          setShowDetailOnMobile(true)
          closeEditor()
        }}
        open={isEditorOpen}
        webhook={editingWebhook}
      />
    </>
  )
}
