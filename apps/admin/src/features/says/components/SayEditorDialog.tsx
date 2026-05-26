import { Dialog } from '@base-ui/react/dialog'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { SayModel } from '~/models/say'

import { createSay, updateSay } from '~/api/says'
import { Button } from '~/ui/button'
import { TextArea, TextInput } from '~/ui/text-field'

export function SayEditorDialog(props: {
  onClose: () => void
  onSuccess: () => Promise<void>
  open: boolean
  say: SayModel | null
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isEdit = Boolean(props.say?.id)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [source, setSource] = useState('')
  const [textError, setTextError] = useState('')

  useEffect(() => {
    if (!props.open) return

    setText(props.say?.text ?? '')
    setAuthor(props.say?.author ?? '')
    setSource(props.say?.source ?? '')
    setTextError('')
  }, [props.open, props.say])

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        author: author.trim() || undefined,
        source: source.trim() || undefined,
        text: text.trim(),
      }

      if (props.say?.id) return updateSay(props.say.id, data)

      return createSay(data)
    },
    onSuccess: async () => {
      toast.success(isEdit ? '修改成功' : '发布成功')
      await props.onSuccess()
    },
  })

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    if (!text.trim()) {
      setTextError('请输入内容')
      return
    }

    setTextError('')
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
        <Dialog.Popup
          className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
          initialFocus={inputRef}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {isEdit ? '编辑一言' : '添加一言'}
              </Dialog.Title>
              <Dialog.Close
                aria-label="关闭"
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <div className="grid gap-4 px-5 py-4">
              <div className="grid gap-1.5 text-sm">
                <TextArea
                  controlClassName="min-h-28"
                  label="内容"
                  onChange={setText}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      handleSubmit()
                    }
                  }}
                  placeholder="记录一句有意思的话..."
                  ref={inputRef}
                  required
                  value={text}
                />
                {textError ? (
                  <span className="text-xs text-red-500">{textError}</span>
                ) : null}
              </div>

              <TextInput
                label="作者"
                onChange={setAuthor}
                placeholder="谁说的？"
                value={author}
              />
              <TextInput
                label="来源"
                onChange={setSource}
                placeholder="出自哪里？"
                value={source}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <span className="mr-auto text-xs text-neutral-400">
                Cmd/Ctrl + Enter 快速保存
              </span>
              <Dialog.Close
                className="inline-flex h-9 items-center justify-center rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                type="button"
              >
                取消
              </Dialog.Close>
              <Button disabled={mutation.isPending} type="submit">
                {isEdit ? '保存' : '发布'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
