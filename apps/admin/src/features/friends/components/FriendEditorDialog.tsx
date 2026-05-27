import { Dialog } from '@base-ui/react/dialog'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { LinkModel } from '~/models/link'

import { createLink, updateLink } from '~/api/links'
import { useI18n } from '~/i18n'
import { LinkState, LinkStateNameKeys, LinkType } from '~/models/link'
import { Button } from '~/ui/primitives/button'
import { SelectField } from '~/ui/primitives/select'
import { TextInput } from '~/ui/primitives/text-field'

export function FriendEditorDialog(props: {
  link: LinkModel | null
  onClose: () => void
  onSuccess: () => Promise<void>
  open: boolean
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState(LinkType.Friend)
  const [state, setState] = useState(LinkState.Pass)
  const [error, setError] = useState('')
  const isEdit = Boolean(props.link?.id)

  useEffect(() => {
    if (!props.open) return

    setName(props.link?.name ?? '')
    setAvatar(props.link?.avatar ?? '')
    setUrl(props.link?.url ?? '')
    setDescription(props.link?.description ?? '')
    setType(props.link?.type ?? LinkType.Friend)
    setState(props.link?.state ?? LinkState.Pass)
    setError('')
  }, [props.link, props.open])

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        avatar: avatar.trim() || undefined,
        description: description.trim() || undefined,
        name: name.trim(),
        state,
        type,
        url: url.trim(),
      }

      if (props.link?.id) return updateLink(props.link.id, data)
      return createLink(data)
    },
    onSuccess: async () => {
      toast.success(t('friends.toast.saved'))
      await props.onSuccess()
    },
  })

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    if (!name.trim() || !url.trim()) {
      setError(t('friends.editor.validate.required'))
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
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {isEdit
                  ? t('friends.editor.editTitle', {
                      name: props.link?.name ?? '',
                    })
                  : t('friends.editor.createTitle')}
              </Dialog.Title>
              <Dialog.Close
                aria-label={t('common.close')}
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <div className="grid gap-4 px-5 py-4">
              <TextInput
                label={t('friends.editor.field.name')}
                onChange={setName}
                required
                value={name}
              />
              <TextInput
                label={t('friends.editor.field.avatar')}
                onChange={setAvatar}
                value={avatar}
              />
              <TextInput
                label={t('friends.editor.field.url')}
                onChange={setUrl}
                required
                value={url}
              />
              <TextInput
                label={t('friends.editor.field.description')}
                onChange={setDescription}
                value={description}
              />
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {t('friends.editor.field.type')}
                </span>
                <SelectField
                  onValueChange={setType}
                  options={[
                    {
                      label: t('friends.row.typeFriend'),
                      value: LinkType.Friend,
                    },
                    {
                      label: t('friends.row.typeCollection'),
                      value: LinkType.Collection,
                    },
                  ]}
                  triggerClassName="h-10"
                  value={type}
                />
              </label>
              {isEdit ? (
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {t('friends.editor.field.state')}
                  </span>
                  <SelectField
                    onValueChange={setState}
                    options={Object.entries(LinkStateNameKeys).map(
                      ([key, labelKey]) => ({
                        label: t(labelKey),
                        value: LinkState[key as keyof typeof LinkState],
                      }),
                    )}
                    triggerClassName="h-10"
                    value={state}
                  />
                </label>
              ) : null}
              {error ? (
                <span className="text-xs text-red-500">{error}</span>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Close
                className="inline-flex h-9 items-center justify-center rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                type="button"
              >
                {t('common.cancel')}
              </Dialog.Close>
              <Button disabled={mutation.isPending} type="submit">
                {t('friends.editor.submit')}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
