import { Dialog } from '@base-ui/react/dialog'
import { useEffect, useState } from 'react'
import type { LinkModel } from '~/models/link'

import { useI18n } from '~/i18n'
import { LinkState, LinkStateNameKeys } from '~/models/link'
import { Button } from '~/ui/primitives/button'
import { SelectField } from '~/ui/primitives/select'
import { TextArea } from '~/ui/primitives/text-field'

export function AuditReasonDialog(props: {
  link: LinkModel | null
  onClose: () => void
  onSubmit: (state: LinkState, reason: string) => void
  pending: boolean
}) {
  const { t } = useI18n()
  const [state, setState] = useState(LinkState.Pass)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!props.link) return
    setState(LinkState.Pass)
    setReason('')
  }, [props.link])

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open={Boolean(props.link)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('friends.audit.dialogTitle')}
            </Dialog.Title>
          </div>
          <div className="grid gap-4 px-5 py-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {t('friends.audit.state')}
              </span>
              <SelectField
                onValueChange={setState}
                options={Object.entries(LinkStateNameKeys)
                  .filter(([key]) => key !== 'Audit')
                  .map(([key, labelKey]) => ({
                    label: t(labelKey),
                    value: LinkState[key as keyof typeof LinkState],
                  }))}
                triggerClassName="h-10"
                value={state}
              />
            </label>
            <TextArea
              controlClassName="min-h-24"
              label={t('friends.audit.reason')}
              maxLength={200}
              onChange={setReason}
              placeholder={t('friends.audit.reasonPlaceholder')}
              value={reason}
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <Dialog.Close
              className="inline-flex h-9 items-center justify-center rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
              type="button"
            >
              {t('common.cancel')}
            </Dialog.Close>
            <Button
              disabled={props.pending}
              onClick={() => props.onSubmit(state, reason)}
              type="button"
            >
              {t('friends.audit.send')}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
