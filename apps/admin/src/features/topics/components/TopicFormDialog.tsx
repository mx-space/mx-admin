import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, Save, X } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CreateTopicData } from '~/api/topics'
import type { TopicModel } from '~/models/topic'
import type { TopicFormMode } from '../types/topics'

import { createTopic, getTopic, updateTopic } from '~/api/topics'
import { Button } from '~/ui/button'
import { TextArea, TextInput } from '~/ui/text-field'

import { getErrorMessage } from '../utils/errors'
import { validateTopicForm } from '../utils/topic-form'

export function TopicFormDialog(props: {
  mode: TopicFormMode
  onClose: () => void
  onSaved: (topic: TopicModel) => Promise<void>
}) {
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
      toast.error(getErrorMessage(error, '专栏保存失败')),
    onSuccess: async (topic) => {
      toast.success(isEdit ? '专栏已更新' : '专栏已创建')
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
      toast.error(validationError)
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
                  {isEdit ? '编辑专栏' : '新建专栏'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  专栏用于组织手记，并提供公开展示入口。
                </p>
              </div>
              <Dialog.Close
                aria-label="关闭"
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
                  label="名称"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={50}
                  onChange={setName}
                  required
                  value={name}
                />
                <div>
                  <TextInput
                    controlClassName="font-mono"
                    label="ID (Slug)"
                    labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                    onChange={setSlug}
                    required
                    value={slug}
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    只能包含字母、数字、下划线和连字符。
                  </p>
                </div>
                <TextInput
                  label="简介"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={100}
                  onChange={setIntroduce}
                  required
                  value={introduce}
                />
                <TextInput
                  label="图标 URL"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  onChange={setIcon}
                  value={icon}
                />
                <TextArea
                  controlClassName="min-h-28"
                  label="详细描述"
                  labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                  maxLength={500}
                  onChange={setDescription}
                  value={description}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Button onClick={props.onClose} type="button" variant="subtle">
                取消
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
                保存
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
