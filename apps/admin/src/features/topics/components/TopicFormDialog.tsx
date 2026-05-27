import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, Save, X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CreateTopicData } from '~/api/topics'
import type { TopicModel } from '~/models/topic'
import type { TopicFormMode } from '../types/topics'

import { createTopic, getTopic, updateTopic } from '~/api/topics'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { TextArea, TextInput } from '~/ui/primitives/text-field'

import { getErrorMessage } from '../utils/errors'
import { validateTopicForm } from '../utils/topic-form'

export function TopicFormDialog(props: {
  mode: TopicFormMode
  onClose: () => void
  onSaved: (topic: TopicModel) => Promise<void>
}) {
  const { t } = useI18n()
  const isEdit = props.mode.kind === 'edit'
  const editId = props.mode.kind === 'edit' ? props.mode.id : null
  const topicQuery = useQuery({
    enabled: isEdit,
    queryFn: () => getTopic(editId ?? ''),
    queryKey: ['topics', 'detail', editId ?? 'new'],
  })
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [introduce, setIntroduce] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')

  useEffect(() => {
    if (!topicQuery.data) return
    setName(topicQuery.data.name)
    setSlug(topicQuery.data.slug)
    setIntroduce(topicQuery.data.introduce ?? '')
    setDescription(topicQuery.data.description ?? '')
    setIcon(topicQuery.data.icon ?? '')
  }, [topicQuery.data])

  const mutation = useMutation({
    mutationFn: (data: CreateTopicData) =>
      editId ? updateTopic(editId, data) : createTopic(data),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('topics.form.saveFailed'))),
    onSuccess: async (topic) => {
      toast.success(
        isEdit ? t('topics.form.savedUpdated') : t('topics.form.savedCreated'),
      )
      await props.onSaved(topic)
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = {
      description: description.trim(),
      icon: icon.trim(),
      introduce: introduce.trim(),
      name: name.trim(),
      slug: slug.trim(),
    }

    const validationError = validateTopicForm(data)
    if (validationError) {
      toast.error(t(validationError.key, validationError.values))
      return
    }

    mutation.mutate(data)
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <form onSubmit={onSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <div>
                <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                  {isEdit
                    ? t('topics.form.editTitle')
                    : t('topics.form.createTitle')}
                </Dialog.Title>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {t('topics.form.subtitle')}
                </p>
              </div>
              <Dialog.Close
                aria-label={t('common.close')}
                className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
              >
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>

            {isEdit && topicQuery.isLoading ? (
              <div className="flex min-h-80 items-center justify-center">
                <Loader2
                  aria-hidden="true"
                  className="size-6 animate-spin text-neutral-400"
                />
              </div>
            ) : (
              <div className="grid gap-4 px-5 py-4">
                <TextInput
                  autoFocus
                  label={t('topics.form.name')}
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={50}
                  onChange={setName}
                  required
                  value={name}
                />
                <div>
                  <TextInput
                    controlClassName="font-mono"
                    label={t('topics.form.slug')}
                    labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                    onChange={setSlug}
                    required
                    value={slug}
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    {t('topics.form.slugHelp')}
                  </p>
                </div>
                <TextInput
                  label={t('topics.form.introduce')}
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={100}
                  onChange={setIntroduce}
                  required
                  value={introduce}
                />
                <TextInput
                  label={t('topics.form.icon')}
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  onChange={setIcon}
                  value={icon}
                />
                <TextArea
                  controlClassName="min-h-28"
                  label={t('topics.form.description')}
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={500}
                  onChange={setDescription}
                  value={description}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Button onClick={props.onClose} type="button" variant="subtle">
                {t('common.cancel')}
              </Button>
              <Button
                disabled={
                  mutation.isPending || (isEdit && topicQuery.isLoading)
                }
                type="submit"
              >
                {mutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
