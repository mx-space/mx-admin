import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { WebhookModel } from '~/api/webhooks'

import {
  createWebhook,
  EventScope,
  getWebhookEvents,
  updateWebhook,
} from '~/api/webhooks'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { Checkbox } from '~/ui/primitives/checkbox'
import { Scroll } from '~/ui/primitives/scroll'
import { Switch } from '~/ui/primitives/switch'
import { TextInput } from '~/ui/primitives/text-field'

import { scopeOptions, webhooksQueryKey } from '../constants'

export function WebhookEditorDialog(props: {
  onClose: () => void
  onSuccess: (webhook: WebhookModel) => Promise<void>
  open: boolean
  webhook: WebhookModel | null
}) {
  const { t } = useI18n()
  const [payloadUrl, setPayloadUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [scope, setScope] = useState<number>(EventScope.TO_SYSTEM)
  const [events, setEvents] = useState<string[]>([])
  const [error, setError] = useState('')
  const isEdit = Boolean(props.webhook?.id)

  const eventsQuery = useQuery({
    enabled: props.open,
    queryFn: getWebhookEvents,
    queryKey: [...webhooksQueryKey, 'events'],
  })
  const availableEvents = eventsQuery.data ?? []
  const allEventsChecked = events.includes('all')

  useEffect(() => {
    if (!props.open) return

    setPayloadUrl(props.webhook?.payloadUrl || props.webhook?.url || '')
    setSecret('')
    setEnabled(props.webhook?.enabled ?? true)
    setScope(props.webhook?.scope ?? EventScope.TO_SYSTEM)
    setEvents(props.webhook?.events ?? [])
    setError('')
  }, [props.open, props.webhook])

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        enabled,
        events,
        payloadUrl: payloadUrl.trim(),
        scope,
        ...(secret.trim() ? { secret: secret.trim() } : {}),
      }

      if (props.webhook?.id) return updateWebhook(props.webhook.id, data)
      return createWebhook({ ...data, secret: secret.trim() || '' })
    },
    onSuccess: async (webhook) => {
      toast.success(
        isEdit ? t('webhooks.toast.updated') : t('webhooks.toast.created'),
      )
      await props.onSuccess(webhook)
    },
  })

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    if (!payloadUrl.trim()) {
      setError(t('webhooks.editor.validate.urlRequired'))
      return
    }

    if (events.length === 0) {
      setError(t('webhooks.editor.validate.eventRequired'))
      return
    }

    setError('')
    mutation.mutate()
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open={props.open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <form className="flex max-h-[90vh] flex-col" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {isEdit
                  ? t('webhooks.editor.editTitle')
                  : t('webhooks.editor.createTitle')}
              </Dialog.Title>
              <Dialog.Close
                aria-label={t('common.close')}
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <Scroll className="flex-1" innerClassName="grid gap-4 px-5 py-4">
              <TextInput
                label="Payload URL"
                onChange={setPayloadUrl}
                placeholder="https://example.com/webhook"
                required
                value={payloadUrl}
              />
              <TextInput
                label="Secret"
                onChange={setSecret}
                placeholder={
                  isEdit
                    ? t('webhooks.editor.placeholder.secret.edit')
                    : t('webhooks.editor.placeholder.secret.create')
                }
                type="password"
                value={secret}
              />

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('webhooks.editor.events')}{' '}
                  <span className="text-red-500">*</span>
                </legend>
                <label className="flex items-center gap-2 rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                  <Checkbox
                    checked={allEventsChecked}
                    onCheckedChange={(checked) =>
                      setEvents(checked ? ['all'] : [])
                    }
                  />
                  {t('webhooks.editor.allEvents')}
                </label>
                <Scroll
                  className="rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
                  innerClassName="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2"
                  viewportClassName="max-h-56"
                >
                  {availableEvents.map((event) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={event}
                    >
                      <Checkbox
                        checked={allEventsChecked || events.includes(event)}
                        disabled={allEventsChecked}
                        onCheckedChange={(checked) => {
                          setEvents((current) =>
                            checked
                              ? [...current, event]
                              : current.filter((value) => value !== event),
                          )
                        }}
                      />
                      {event}
                    </label>
                  ))}
                </Scroll>
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('webhooks.editor.scope')}
                </legend>
                <div className="flex flex-wrap gap-3">
                  {scopeOptions.map((option) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={option.value}
                    >
                      <Checkbox
                        checked={(scope & option.value) === option.value}
                        onCheckedChange={(checked) =>
                          setScope((current) =>
                            checked
                              ? current | option.value
                              : current & ~option.value,
                          )
                        }
                      />
                      {t(option.labelKey)}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Switch
                checked={enabled}
                label={t('webhooks.editor.enabled')}
                onCheckedChange={setEnabled}
              />

              {error ? (
                <span className="text-xs text-red-500">{error}</span>
              ) : null}
            </Scroll>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Close
                className="inline-flex h-9 items-center justify-center rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                type="button"
              >
                {t('common.cancel')}
              </Dialog.Close>
              <Button disabled={mutation.isPending} type="submit">
                {isEdit ? t('common.save') : t('common.create')}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
