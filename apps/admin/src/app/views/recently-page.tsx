import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink,
  File,
  FileText,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  StickyNote,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { EnrichmentResult } from '~/app/models/enrichment'
import type { RecentlyModel, RecentlyRefTypes } from '~/app/models/recently'

import { resolveEnrichment } from '../api/enrichment'
import {
  createRecently,
  deleteRecently,
  getRecentlyList,
  updateRecently,
} from '../api/recently'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { TextArea } from '../ui/text-field'

const refTypeIcons: Record<RecentlyRefTypes, typeof FileText> = {
  note: StickyNote,
  page: File,
  post: FileText,
  recently: StickyNote,
}

const refTypeLabels: Record<RecentlyRefTypes, string> = {
  note: '笔记',
  page: '页面',
  post: '文章',
  recently: '速记',
}

const URL_REGEX = /https?:\/\/\S+/gi
const URL_TAIL_TRIM = /[)\].,;:!?'"`>}）。，、；：！？「」『』《》〉〕—…]+$/

interface UrlPreviewState {
  error: string | null
  loading: boolean
  result: EnrichmentResult | null
}

export function RecentlyPage() {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<RecentlyModel | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const recentlyQuery = useQuery({
    queryFn: getRecentlyList,
    queryKey: ['recently', 'list'],
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRecently,
    onSuccess: async () => {
      toast.success('删除成功')
      await queryClient.invalidateQueries({ queryKey: ['recently'] })
    },
  })

  const openCreate = () => {
    setEditingItem(null)
    setIsEditorOpen(true)
  }

  const openEdit = (item: RecentlyModel) => {
    setEditingItem(item)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditingItem(null)
    setIsEditorOpen(false)
  }

  const updateItemEnrichment = (
    itemId: string,
    url: string,
    enrichment: EnrichmentResult,
  ) => {
    queryClient.setQueryData<RecentlyModel[]>(
      ['recently', 'list'],
      (current) =>
        current?.map((item) =>
          item.id === itemId
            ? {
                ...item,
                enrichments: {
                  ...item.enrichments,
                  [url]: enrichment,
                },
              }
            : item,
        ) ?? current,
    )
  }

  const items = recentlyQuery.data ?? []

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
            <StickyNote aria-hidden="true" className="size-4" />
            速记
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {recentlyQuery.isLoading ? '加载中' : `${items.length} 条`}
          </span>
          <Button onClick={openCreate} type="button" variant="subtle">
            <Plus aria-hidden="true" className="size-4" />
            写一条速记
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {recentlyQuery.isLoading && items.length === 0 ? (
          <RecentlyListSkeleton />
        ) : items.length === 0 ? (
          <RecentlyEmptyState onCreate={openCreate} />
        ) : (
          <div
            aria-label="速记列表"
            className="mx-auto max-w-4xl divide-y divide-neutral-200 dark:divide-neutral-800"
            role="feed"
          >
            {items.map((item) => (
              <RecentlyListItem
                item={item}
                key={item.id}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={() => openEdit(item)}
                onEnrichmentUpdate={(url, enrichment) =>
                  updateItemEnrichment(item.id, url, enrichment)
                }
              />
            ))}
          </div>
        )}
      </div>

      <RecentlyEditorDialog
        item={editingItem}
        onClose={closeEditor}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ['recently'] })
          closeEditor()
        }}
        open={isEditorOpen}
      />
    </section>
  )
}

function RecentlyListItem(props: {
  item: RecentlyModel
  onDelete: (id: string) => void
  onEdit: () => void
  onEnrichmentUpdate: (url: string, enrichment: EnrichmentResult) => void
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [retryingUrls, setRetryingUrls] = useState<Set<string>>(() => new Set())
  const totalVotes = props.item.up + props.item.down
  const upPercentage =
    totalVotes > 0 ? Math.round((props.item.up / totalVotes) * 100) : 50
  const RefIcon = props.item.refType ? refTypeIcons[props.item.refType] : null
  const refLabel = props.item.refType ? refTypeLabels[props.item.refType] : null

  const retryEnrichment = async (url: string) => {
    setRetryingUrls((current) => new Set(current).add(url))
    try {
      const result = await resolveEnrichment(url)
      props.onEnrichmentUpdate(url, result)
      toast.success('已刷新')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '刷新失败')
    } finally {
      setRetryingUrls((current) => {
        const next = new Set(current)
        next.delete(url)
        return next
      })
    }
  }

  return (
    <article className="group px-4 py-5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
      <p className="whitespace-pre-wrap break-words text-base leading-7 text-neutral-900 dark:text-neutral-100">
        {props.item.content}
      </p>

      {props.item.enrichments &&
      Object.keys(props.item.enrichments).length > 0 ? (
        <div className="mt-3 grid gap-2">
          {Object.entries(props.item.enrichments).map(([url, enrichment]) => (
            <EnrichmentInlineCard
              enrichment={enrichment}
              key={url}
              onRetry={() => retryEnrichment(url)}
              retrying={retryingUrls.has(url)}
              url={url}
            />
          ))}
        </div>
      ) : null}

      {props.item.ref && props.item.refType && RefIcon ? (
        <a
          aria-label={`查看关联${refLabel}: ${props.item.ref.title}`}
          className="mt-3 inline-flex max-w-full items-center gap-2 rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-700 no-underline transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          href={props.item.ref.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <RefIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-neutral-400"
          />
          <span className="shrink-0 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {refLabel}
          </span>
          <span className="truncate">{props.item.ref.title}</span>
          <ExternalLink
            aria-hidden="true"
            className="size-3.5 shrink-0 text-neutral-400"
          />
        </a>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
          <time dateTime={props.item.createdAt}>
            {formatDate(props.item.createdAt)}
          </time>
          {props.item.modifiedAt ? (
            <span>编辑于 {formatDate(props.item.modifiedAt)}</span>
          ) : null}
          <VoteSummary
            down={props.item.down}
            up={props.item.up}
            upPercentage={upPercentage}
          />
          {props.item.commentsIndex ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare aria-hidden="true" className="size-3.5" />
              {props.item.commentsIndex}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <Button
            aria-label="编辑速记"
            className="h-8 px-2"
            onClick={props.onEdit}
            type="button"
            variant="subtle"
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            <span className="hidden sm:inline">编辑</span>
          </Button>
          <Button
            aria-label="删除速记"
            className="h-8 px-2 text-red-600 dark:text-red-400"
            onClick={() => {
              if (isConfirmingDelete) {
                props.onDelete(props.item.id)
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
      </footer>
    </article>
  )
}

function RecentlyEditorDialog(props: {
  item: RecentlyModel | null
  onClose: () => void
  onSuccess: () => Promise<void>
  open: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewGenerationRef = useRef(0)
  const [content, setContent] = useState('')
  const [detectedUrls, setDetectedUrls] = useState<string[]>([])
  const [error, setError] = useState('')
  const [previewStates, setPreviewStates] = useState<
    Record<string, UrlPreviewState>
  >({})
  const isEdit = Boolean(props.item?.id)

  useEffect(() => {
    if (!props.open) return

    setContent(props.item?.content ?? '')
    setError('')
  }, [props.item, props.open])

  useEffect(() => {
    const urls = extractUrls(content)
    setDetectedUrls(urls)
    setPreviewStates({})

    if (!props.open || urls.length === 0) return

    const generation = ++previewGenerationRef.current
    const timer = window.setTimeout(() => {
      urls.forEach((url) => {
        setPreviewStates((current) => ({
          ...current,
          [url]: { error: null, loading: true, result: null },
        }))

        resolveEnrichment(url)
          .then((result) => {
            if (previewGenerationRef.current !== generation) return
            setPreviewStates((current) => ({
              ...current,
              [url]: { error: null, loading: false, result },
            }))
          })
          .catch((previewError: unknown) => {
            if (previewGenerationRef.current !== generation) return
            setPreviewStates((current) => ({
              ...current,
              [url]: {
                error:
                  previewError instanceof Error
                    ? previewError.message
                    : '解析失败',
                loading: false,
                result: null,
              },
            }))
          })
      })
    }, 500)

    return () => {
      window.clearTimeout(timer)
      previewGenerationRef.current += 1
    }
  }, [content, props.open])

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { content: content.trim() }
      if (props.item?.id) return updateRecently(props.item.id, data)
      return createRecently(data)
    },
    onSuccess: async () => {
      toast.success('保存成功')
      await props.onSuccess()
    },
  })

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    if (!content.trim()) {
      setError('内容不可为空')
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
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,38rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950"
          initialFocus={textareaRef}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {isEdit ? '编辑速记' : '写一条速记'}
              </Dialog.Title>
              <Dialog.Close
                aria-label="关闭"
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <div className="px-5 py-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  内容 <span className="text-red-500">*</span>
                </span>
                <TextArea
                  controlClassName="min-h-36"
                  onChange={setContent}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      handleSubmit()
                    }
                  }}
                  placeholder="写点什么，或粘贴一个链接..."
                  ref={textareaRef}
                  required
                  value={content}
                />
                {error ? (
                  <span className="text-xs text-red-500">{error}</span>
                ) : null}
              </label>

              {detectedUrls.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {detectedUrls.map((url) => {
                    const state = previewStates[url]

                    return (
                      <div className="grid gap-1.5" key={url}>
                        <div className="flex min-w-0 items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="shrink-0">检测到链接：</span>
                          <code className="truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-neutral-900">
                            {url}
                          </code>
                          {state?.loading ? (
                            <Loader2
                              aria-hidden="true"
                              className="size-3 shrink-0 animate-spin"
                            />
                          ) : null}
                        </div>

                        {state?.result ? (
                          <EnrichmentInlineCard
                            enrichment={state.result}
                            url={url}
                          />
                        ) : null}

                        {state?.error && !state.loading ? (
                          <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                            <div className="font-medium text-neutral-700 dark:text-neutral-300">
                              未识别该链接
                            </div>
                            <div className="mt-0.5">
                              {cleanErrorMessage(state.error)}
                            </div>
                            <div className="mt-1 text-neutral-400">
                              仍可保存，按链接处理。
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
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
                保存
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function EnrichmentInlineCard(props: {
  enrichment: EnrichmentResult
  onRetry?: () => void
  retrying?: boolean
  url: string
}) {
  const image =
    props.enrichment.thumbnailImage?.url || props.enrichment.previewImage?.url

  return (
    <div className="flex gap-2 rounded border border-neutral-200 bg-neutral-50 p-3 text-sm transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800">
      <a
        className="flex min-w-0 flex-1 gap-3 text-inherit no-underline"
        href={props.enrichment.url || props.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {image ? (
          <img
            alt=""
            className="size-14 shrink-0 rounded object-cover"
            src={image}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-neutral-900 dark:text-neutral-100">
            {props.enrichment.title}
          </div>
          {props.enrichment.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {props.enrichment.description}
            </p>
          ) : null}
          <div className="mt-1 truncate text-xs text-neutral-400">
            {hostnameOf(props.enrichment.url || props.url)}
          </div>
        </div>
      </a>
      {props.onRetry ? (
        <button
          aria-label="刷新链接预览"
          className="flex size-8 shrink-0 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 disabled:opacity-60 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          disabled={props.retrying}
          onClick={props.onRetry}
          type="button"
        >
          <RefreshCcw
            aria-hidden="true"
            className={`size-4 ${props.retrying ? 'animate-spin' : ''}`}
          />
        </button>
      ) : null}
    </div>
  )
}

function VoteSummary(props: {
  down: number
  up: number
  upPercentage: number
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1">
        <ThumbsUp aria-hidden="true" className="size-3.5" />
        {props.up}
      </span>
      <span className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
      <span className="inline-flex items-center gap-1">
        <ThumbsDown aria-hidden="true" className="size-3.5" />
        {props.down}
      </span>
      {props.up + props.down > 0 ? (
        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <span
            className="block h-full rounded-full bg-green-500"
            style={{ width: `${props.upPercentage}%` }}
          />
        </span>
      ) : null}
    </span>
  )
}

function RecentlyEmptyState(props: { onCreate: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded bg-neutral-100 dark:bg-neutral-900">
        <StickyNote aria-hidden="true" className="size-8 text-neutral-400" />
      </div>
      <h2 className="mb-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">
        还没有速记
      </h2>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        记录你的灵感、想法或日常碎片
      </p>
      <Button onClick={props.onCreate} type="button">
        写第一条速记
      </Button>
    </div>
  )
}

function RecentlyListSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse">
      {[1, 2, 3].map((index) => (
        <div
          className="border-b border-neutral-200 px-4 py-5 last:border-b-0 dark:border-neutral-800"
          key={index}
        >
          <div className="h-5 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mt-2 h-5 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="mt-4 flex gap-4">
            <div className="h-4 w-28 rounded bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX)
  if (!matches) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (let url of matches) {
    while (URL_TAIL_TRIM.test(url)) {
      url = url.replace(URL_TAIL_TRIM, '')
    }

    if (url && !seen.has(url)) {
      seen.add(url)
      result.push(url)
    }
  }

  return result
}

function cleanErrorMessage(raw: string | null | undefined): string {
  if (!raw) return '解析失败'

  let message = raw.replace(/https?:\/\/\S+/g, '').trim()

  if (/\(404\)|\b404\b/.test(message)) {
    return '404 - 资源不存在，或私有内容无访问权'
  }

  if (/\b401\b|\b403\b|unauthor|forbidden/i.test(message)) {
    return '401/403 - 凭证缺失或权限不足'
  }

  if (/Provider disabled/i.test(message)) {
    return '未启用对应 provider，或链接未匹配任何 provider'
  }

  if (/Token missing/i.test(message)) {
    return '此 provider 需配置凭证'
  }

  message = message.replace(/[\s-]+$/, '').trim()

  return message.length > 100
    ? `${message.slice(0, 100)}...`
    : message || '解析失败'
}

function hostnameOf(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
