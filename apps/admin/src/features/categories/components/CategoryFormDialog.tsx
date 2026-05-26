import { Dialog } from '@base-ui/react/dialog'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'
import type { CreateCategoryData } from '~/api/categories'
import type { CategoryModel } from '~/models/category'
import type { CategoryFormMode } from '../types/categories'

import { createCategory, updateCategory } from '~/api/categories'
import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'

import { getErrorMessage } from '../utils/errors'

export function CategoryFormDialog(props: {
  mode: CategoryFormMode
  onClose: () => void
  onSaved: (category: CategoryModel) => Promise<void>
}) {
  const [name, setName] = useState(
    props.mode.kind === 'edit' ? props.mode.category.name : '',
  )
  const [slug, setSlug] = useState(
    props.mode.kind === 'edit' ? props.mode.category.slug : '',
  )
  const title = props.mode.kind === 'edit' ? '编辑分类' : '新建分类'

  const mutation = useMutation({
    mutationFn: (data: CreateCategoryData) =>
      props.mode.kind === 'edit'
        ? updateCategory(props.mode.category.id, { ...data, type: 0 })
        : createCategory(data),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '分类保存失败')),
    onSuccess: async (category) => {
      toast.success(props.mode.kind === 'edit' ? '分类已更新' : '分类已创建')
      await props.onSaved(category)
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
    }

    if (!payload.name || !payload.slug) {
      toast.error('名称和路径不能为空')
      return
    }

    mutation.mutate(payload)
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
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <form onSubmit={onSubmit}>
            <div className="mb-5">
              <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                {title}
              </Dialog.Title>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                分类名称用于后台管理，路径用于公开 URL。
              </p>
            </div>
            <div className="grid gap-4">
              <TextInput
                autoFocus
                label="名称"
                labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                onChange={setName}
                value={name}
              />
              <TextInput
                controlClassName="font-mono"
                label="路径"
                labelClassName="text-xs text-neutral-500 dark:text-neutral-400"
                onChange={setSlug}
                value={slug}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={props.onClose} type="button" variant="subtle">
                取消
              </Button>
              <Button disabled={mutation.isPending} type="submit">
                {mutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : null}
                保存
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
