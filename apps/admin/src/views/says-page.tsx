import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Quote, Trash2, User, X } from 'lucide-react'
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { SayModel } from '~/models/say'

import { createSay, deleteSay, getSays, updateSay } from '../api/says'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { Scroll } from '../ui/scroll'
import { TextArea, TextInput } from '../ui/text-field'

const pageSize = 20

export function SaysPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(readPage(searchParams.get('page')))
  const [editingSay, setEditingSay] = useState<SayModel | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const searchParamsKey = searchParams.toString()

  useLayoutEffect(() => {
    const nextPage = readPage(searchParams.get('page'))

    setPage((value) => (value === nextPage ? value : nextPage))
  }, [searchParamsKey])

  const saysQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getSays({ page, size: pageSize }),
    queryKey: ['says', 'list', page, pageSize],
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSay,
    onSuccess: async () => {
      toast.success('删除成功')
      await queryClient.invalidateQueries({ queryKey: ['says'] })
    },
  })

  const openCreate = () => {
    setEditingSay(null)
    setIsEditorOpen(true)
  }

  const openEdit = (say: SayModel) => {
    setEditingSay(say)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditingSay(null)
    setIsEditorOpen(false)
  }

  const says = saysQuery.data?.data ?? []
  const pagination = saysQuery.data?.pagination

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [page, searchParamsKey, setSearchParams])

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            <Quote aria-hidden="true" className="size-4" />
            一言
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {pagination ? `${pagination.total} 条` : '加载中'}
          </span>
          <Button onClick={openCreate} type="button" variant="subtle">
            <Plus aria-hidden="true" className="size-4" />
            添加一言
          </Button>
        </div>
      </div>

      <Scroll className="flex-1">
        {saysQuery.isLoading && says.length === 0 ? (
          <SayListSkeleton />
        ) : says.length === 0 ? (
          <SayEmptyState onCreate={openCreate} />
        ) : (
          <div className="mx-auto max-w-5xl">
            {says.map((say) => (
              <SayListItem
                key={say.id}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={() => openEdit(say)}
                say={say}
              />
            ))}
          </div>
        )}
      </Scroll>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex shrink-0 justify-center border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <CompactPagination
            onPageChange={setPage}
            onPageSizeChange={() => undefined}
            page={page}
            pageCount={pagination.totalPages}
            pageSize={pageSize}
            pageSizes={[pageSize]}
          />
        </div>
      ) : null}

      <SayEditorDialog
        onClose={closeEditor}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ['says'] })
          closeEditor()
        }}
        open={isEditorOpen}
        say={editingSay}
      />
    </section>
  )
}

function SayListItem(props: {
  onDelete: (id: string) => void
  onEdit: () => void
  say: SayModel
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  return (
    <article className="group border-b border-neutral-200 px-4 py-4 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
      <div className="flex gap-3">
        <Quote
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-neutral-300 dark:text-neutral-600"
        />
        <div className="min-w-0 flex-1">
          <p className="text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
            {props.say.text}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
            {props.say.author ? (
              <span className="flex items-center gap-1">
                <User aria-hidden="true" className="size-3.5" />
                {props.say.author}
              </span>
            ) : null}
            {props.say.source ? (
              <span className="text-neutral-400 dark:text-neutral-500">
                -- {props.say.source}
              </span>
            ) : null}
            {props.say.createdAt ? (
              <time
                className="text-neutral-400 dark:text-neutral-500"
                dateTime={props.say.createdAt}
              >
                {formatDate(props.say.createdAt)}
              </time>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            aria-label="编辑一言"
            className="h-8 px-2"
            onClick={props.onEdit}
            type="button"
            variant="subtle"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            <span className="hidden sm:inline">编辑</span>
          </Button>
          <Button
            aria-label="删除一言"
            className="h-8 px-2 text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => {
              if (isConfirmingDelete) {
                props.onDelete(props.say.id)
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
            <span className="hidden sm:inline">
              {isConfirmingDelete ? '确认' : '删除'}
            </span>
          </Button>
        </div>
      </div>
    </article>
  )
}

function SayEditorDialog(props: {
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

function SayEmptyState(props: { onCreate: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded bg-neutral-100 dark:bg-neutral-900">
        <Quote aria-hidden="true" className="size-8 text-neutral-400" />
      </div>
      <h2 className="mb-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">
        暂无一言
      </h2>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        记录一些有意思的话语吧
      </p>
      <Button onClick={props.onCreate} type="button">
        添加第一条一言
      </Button>
    </div>
  )
}

function SayListSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse">
      {[1, 2, 3, 4, 5].map((index) => (
        <div
          className="flex gap-3 border-b border-neutral-200 px-4 py-4 last:border-b-0 dark:border-neutral-800"
          key={index}
        >
          <div className="size-5 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1">
            <div className="h-5 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-5 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
            <div className="mt-3 flex gap-4">
              <div className="h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-4 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function readPage(value: string | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
