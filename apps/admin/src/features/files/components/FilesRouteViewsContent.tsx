import { Dialog } from '@base-ui/react/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  ExternalLink,
  FileIcon,
  Files as FilesIcon,
  ImageIcon,
  Loader2,
  RefreshCw,
  Smile,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { decode } from 'blurhash'
import { toast } from 'sonner'
import type {
  CommentUploadFile,
  CommentUploadStatus,
  FileItem,
  FileType,
  OrphanFile,
} from '~/api/files'
import type { LucideIcon } from 'lucide-react'
import type { ChangeEvent, DragEvent } from 'react'

import {
  batchDeleteOrphanFiles,
  cleanupOrphanFiles,
  deleteCommentUpload,
  deleteFileByTypeAndName,
  getCommentUploads,
  getFilesByType,
  getOrphanFiles,
  uploadFileWithProgress,
} from '~/api/files'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { Button } from '~/ui/primitives/button'
import { Checkbox } from '~/ui/primitives/checkbox'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'
import { relativeTimeFromNow } from '~/utils/time'

type FilesSource = 'comment-images' | 'files' | 'orphans'

const filesQueryKey = ['files']
const pageSize = 24
const sourceTabs: Array<{ labelKey: string; value: FilesSource }> = [
  { labelKey: 'files.source.files', value: 'files' },
  { labelKey: 'files.source.orphans', value: 'orphans' },
  { labelKey: 'files.source.commentImages', value: 'comment-images' },
]
const sourcePathMap: Record<FilesSource, string> = {
  'comment-images': '/files/comment-images',
  files: '/files',
  orphans: '/files/orphans',
}
const blurhashPreviewSize = 32

interface UploadItem {
  error?: string
  id: string
  name: string
  progress: number
  status: 'done' | 'error' | 'uploading'
}

const fileTypes: Array<{
  acceptImage: boolean
  icon: LucideIcon
  labelKey: string
  value: FileType
}> = [
  {
    acceptImage: true,
    icon: Smile,
    labelKey: 'files.fileType.icon',
    value: 'icon',
  },
  {
    acceptImage: true,
    icon: User,
    labelKey: 'files.fileType.avatar',
    value: 'avatar',
  },
  {
    acceptImage: true,
    icon: ImageIcon,
    labelKey: 'files.fileType.image',
    value: 'image',
  },
  {
    acceptImage: false,
    icon: FileIcon,
    labelKey: 'files.fileType.file',
    value: 'file',
  },
]

const commentStatusOptionsBase: Array<{
  labelKey: string
  value: CommentUploadStatus
}> = [
  { labelKey: 'files.commentStatus.all', value: '' },
  { labelKey: 'files.commentStatus.active', value: 'active' },
  { labelKey: 'files.commentStatus.pending', value: 'pending' },
  { labelKey: 'files.commentStatus.detached', value: 'detached' },
]

export function FilesPageContent() {
  return <FilesSurface initialSource="files" />
}

export function OrphanFilesPageContent() {
  return <FilesSurface initialSource="orphans" />
}

export function CommentImagesPageContent() {
  return <FilesSurface initialSource="comment-images" />
}

function FilesSurface(props: { initialSource: FilesSource }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<FilesSource>(props.initialSource)
  const [fileType, setFileType] = useState<FileType>('icon')
  const [orphansPage, setOrphansPage] = useState(1)
  const [commentPage, setCommentPage] = useState(1)
  const [commentStatus, setCommentStatus] = useState<CommentUploadStatus>('')
  const [selectedOrphanIds, setSelectedOrphanIds] = useState<string[]>([])
  const [selectAllOrphans, setSelectAllOrphans] = useState(false)
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isDraggingUpload, setIsDraggingUpload] = useState(false)
  const [previewImage, setPreviewImage] = useState<{
    name: string
    url: string
  } | null>(null)

  const commentUploadStatusLabels: Record<
    Exclude<CommentUploadStatus, ''>,
    string
  > = {
    active: t('files.commentStatus.active'),
    detached: t('files.commentStatus.detached'),
    pending: t('files.commentStatus.pending'),
  }

  useEffect(() => {
    setSource(props.initialSource)
  }, [props.initialSource])

  useEffect(() => {
    setSelectedOrphanIds([])
    setSelectAllOrphans(false)
  }, [orphansPage, source])

  const filesQuery = useQuery({
    enabled: source === 'files',
    queryFn: () => getFilesByType(fileType),
    queryKey: [...filesQueryKey, 'by-type', fileType],
  })

  const orphansQuery = useQuery({
    enabled: source === 'orphans',
    placeholderData: (previous) => previous,
    queryFn: () => getOrphanFiles(orphansPage, pageSize),
    queryKey: [
      ...filesQueryKey,
      'orphans',
      { page: orphansPage, size: pageSize },
    ],
  })

  const commentUploadsQuery = useQuery({
    enabled: source === 'comment-images',
    placeholderData: (previous) => previous,
    queryFn: () =>
      getCommentUploads({
        page: commentPage,
        size: pageSize,
        status: commentStatus || undefined,
      }),
    queryKey: [
      ...filesQueryKey,
      'comment-uploads',
      { page: commentPage, size: pageSize, status: commentStatus },
    ],
  })

  const deleteFileMutation = useMutation({
    mutationFn: (file: FileItem) =>
      deleteFileByTypeAndName(fileType, file.name),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('files.toast.deleteFailed'))),
    onSuccess: async () => {
      toast.success(t('files.toast.fileDeleted'))
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const cleanupMutation = useMutation({
    mutationFn: () => cleanupOrphanFiles(60),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('files.toast.cleanupFailed'))),
    onSuccess: async (result) => {
      toast.success(
        t('files.toast.orphansCleaned', { count: result.deletedCount }),
      )
      setOrphansPage(1)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const deleteOrphanMutation = useMutation({
    mutationFn: (file: OrphanFile) =>
      deleteFileByTypeAndName('image', file.fileName),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('files.toast.deleteFailed'))),
    onSuccess: async () => {
      toast.success(t('files.toast.orphanDeleted'))
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const batchDeleteOrphansMutation = useMutation({
    mutationFn: () =>
      batchDeleteOrphanFiles(
        selectAllOrphans ? { all: true } : { ids: selectedOrphanIds },
      ),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('files.toast.batchDeleteFailed'))),
    onSuccess: async (result) => {
      toast.success(
        t('files.toast.orphansDeleted', { count: result.deletedCount }),
      )
      setSelectedOrphanIds([])
      setSelectAllOrphans(false)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: deleteCommentUpload,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('files.toast.deleteFailed'))),
    onSuccess: async (result) => {
      if (result.storageRemoved) {
        toast.success(t('files.toast.commentDeletedWithStorage'))
      } else {
        toast.warning(t('files.toast.commentDeletedStorageFailed'))
      }
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const currentType = fileTypes.find((type) => type.value === fileType)!
  const uploadBusy = uploadItems.some((item) => item.status === 'uploading')
  const currentSource = sourceTabs.find((item) => item.value === source)!

  const handleSourceChange = (next: FilesSource) => {
    setSource(next)
    navigate(sourcePathMap[next])
  }
  const handleToggleAllOrphans = () => {
    const next = !selectAllOrphans

    setSelectAllOrphans(next)
    setSelectedOrphanIds(
      next ? (orphansQuery.data?.data ?? []).map((file) => file.id) : [],
    )
  }

  const onUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void uploadFiles(files)
  }

  const uploadFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!currentType.acceptImage || file.type.startsWith('image/'))
        return true

      toast.error(t('files.toast.notImageFile', { name: file.name }))
      return false
    })

    if (validFiles.length === 0) return

    const items = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
      name: file.name,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploadItems((previous) => [...items, ...previous].slice(0, 8))

    const results = await Promise.allSettled(
      validFiles.map((file, index) =>
        uploadFileWithProgress(file, {
          onProgress: (progress) => {
            setUploadItems((previous) =>
              previous.map((item) =>
                item.id === items[index].id ? { ...item, progress } : item,
              ),
            )
          },
          type: fileType,
        }),
      ),
    )

    setUploadItems((previous) =>
      previous.map((item) => {
        const index = items.findIndex((candidate) => candidate.id === item.id)
        if (index === -1) return item

        const result = results[index]
        if (result.status === 'fulfilled') {
          return { ...item, progress: 100, status: 'done' }
        }

        return {
          ...item,
          error: getErrorMessage(result.reason, t('files.toast.uploadFailed')),
          status: 'error',
        }
      }),
    )

    const successCount = results.filter(
      (result) => result.status === 'fulfilled',
    ).length
    if (successCount > 0) {
      toast.success(t('files.toast.uploaded', { count: successCount }))
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <header
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <h2 className="inline-flex items-center gap-2 text-sm font-medium">
          <FilesIcon aria-hidden="true" className="size-4" />
          {t(currentSource.labelKey as never)}
        </h2>
        <Button
          disabled={
            filesQuery.isFetching ||
            orphansQuery.isFetching ||
            commentUploadsQuery.isFetching
          }
          onClick={() => {
            void filesQuery.refetch()
            void orphansQuery.refetch()
            void commentUploadsQuery.refetch()
          }}
          type="button"
          variant="subtle"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(
              'size-4',
              (filesQuery.isFetching ||
                orphansQuery.isFetching ||
                commentUploadsQuery.isFetching) &&
                'animate-spin',
            )}
          />
          {t('files.action.refresh')}
        </Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
        <SourceTabs onChange={handleSourceChange} value={source} />
        <div className="flex flex-wrap items-center gap-2">
          {source === 'files' ? (
            <>
              <input
                accept={currentType.acceptImage ? 'image/*' : undefined}
                className="hidden"
                multiple
                onChange={onUploadChange}
                ref={uploadInputRef}
                type="file"
              />
              <Button
                disabled={uploadBusy}
                onClick={() => uploadInputRef.current?.click()}
                type="button"
                variant="subtle"
              >
                {uploadBusy ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Upload aria-hidden="true" className="size-4" />
                )}
                {t('files.action.upload')}
              </Button>
            </>
          ) : null}
          {source === 'orphans' ? (
            <>
              {selectedOrphanIds.length > 0 || selectAllOrphans ? (
                <Button
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
                  disabled={batchDeleteOrphansMutation.isPending}
                  onClick={() => {
                    const scopeLabel = selectAllOrphans
                      ? t('files.orphans.scope.all', {
                          count: orphansQuery.data?.pagination.total ?? 0,
                        })
                      : t('files.orphans.scope.selected', {
                          count: selectedOrphanIds.length,
                        })
                    if (
                      window.confirm(
                        t('files.orphans.confirmBatchDelete', {
                          scope: scopeLabel,
                        }),
                      )
                    ) {
                      batchDeleteOrphansMutation.mutate()
                    }
                  }}
                  type="button"
                  variant="subtle"
                >
                  {batchDeleteOrphansMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <Trash2 aria-hidden="true" className="size-4" />
                  )}
                  {selectAllOrphans
                    ? t('files.orphans.deleteAll', {
                        count: orphansQuery.data?.pagination.total ?? 0,
                      })
                    : t('files.orphans.deleteSelected', {
                        count: selectedOrphanIds.length,
                      })}
                </Button>
              ) : null}
              <Button
                disabled={cleanupMutation.isPending}
                onClick={() => {
                  if (window.confirm(t('files.orphans.confirmCleanup'))) {
                    cleanupMutation.mutate()
                  }
                }}
                type="button"
                variant="subtle"
              >
                {cleanupMutation.isPending ? (
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Trash2 aria-hidden="true" className="size-4" />
                )}
                {t('files.orphans.cleanup')}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Scroll className="flex-1">
        {source === 'files' ? (
          <div>
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 p-4 dark:border-neutral-800">
              {fileTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    className={cn(
                      'inline-flex h-8 items-center gap-2 rounded border px-2.5 text-xs transition-colors',
                      fileType === type.value
                        ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900',
                    )}
                    key={type.value}
                    onClick={() => setFileType(type.value)}
                    type="button"
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                    {t(type.labelKey as never)}
                  </button>
                )
              })}
            </div>
            <UploadDropZone
              acceptImage={currentType.acceptImage}
              dragging={isDraggingUpload}
              items={uploadItems}
              onBrowse={() => uploadInputRef.current?.click()}
              onDragChange={setIsDraggingUpload}
              onFiles={(files) => void uploadFiles(files)}
            />
            <FileGrid
              deleting={deleteFileMutation.isPending}
              files={filesQuery.data ?? []}
              imageMode={currentType.acceptImage}
              loading={filesQuery.isLoading}
              onCopy={(url) => void copyToClipboard(url, t)}
              onDelete={(file) => {
                if (
                  window.confirm(
                    t('files.confirmDeleteNamed', { name: file.name }),
                  )
                ) {
                  deleteFileMutation.mutate(file)
                }
              }}
              onPreview={(file) =>
                setPreviewImage({ name: file.name, url: file.url })
              }
            />
          </div>
        ) : null}

        {source === 'orphans' ? (
          <OrphanGrid
            deleting={deleteOrphanMutation.isPending}
            files={orphansQuery.data?.data ?? []}
            loading={orphansQuery.isLoading}
            onCopy={(url) => void copyToClipboard(url, t)}
            onDelete={(file) => {
              if (
                window.confirm(
                  t('files.confirmDeleteNamed', { name: file.fileName }),
                )
              ) {
                deleteOrphanMutation.mutate(file)
              }
            }}
            onPageChange={setOrphansPage}
            onSelectAllCurrentPage={(checked) => {
              setSelectAllOrphans(false)
              setSelectedOrphanIds(
                checked
                  ? (orphansQuery.data?.data ?? []).map((file) => file.id)
                  : [],
              )
            }}
            onSelectFile={(id, checked) => {
              setSelectAllOrphans(false)
              setSelectedOrphanIds((previous) =>
                checked
                  ? [...new Set([...previous, id])]
                  : previous.filter((current) => current !== id),
              )
            }}
            onToggleAllOrphans={handleToggleAllOrphans}
            onPreview={(file) =>
              setPreviewImage({ name: file.fileName, url: file.fileUrl })
            }
            page={orphansPage}
            pageCount={orphansQuery.data?.pagination.totalPage ?? 1}
            selectedIds={selectedOrphanIds}
            selectEveryOrphan={selectAllOrphans}
            total={orphansQuery.data?.pagination.total ?? 0}
          />
        ) : null}

        {source === 'comment-images' ? (
          <CommentUploadGrid
            commentUploadStatusLabels={commentUploadStatusLabels}
            deleting={deleteCommentMutation.isPending}
            files={commentUploadsQuery.data?.data ?? []}
            loading={commentUploadsQuery.isLoading}
            onCopy={(url) => void copyToClipboard(url, t)}
            onDelete={(file) => {
              if (
                window.confirm(
                  t('files.confirmDeleteNamed', { name: file.fileName }),
                )
              ) {
                deleteCommentMutation.mutate(file.id)
              }
            }}
            onPageChange={setCommentPage}
            onPreview={(file) =>
              setPreviewImage({ name: file.fileName, url: file.fileUrl })
            }
            onStatusChange={(next) => {
              setCommentStatus(next)
              setCommentPage(1)
            }}
            page={commentPage}
            pageCount={commentUploadsQuery.data?.pagination.totalPage ?? 1}
            status={commentStatus}
            total={commentUploadsQuery.data?.pagination.total ?? 0}
          />
        ) : null}
      </Scroll>
      <ImagePreviewDialog
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}

function SourceTabs(props: {
  onChange: (source: FilesSource) => void
  value: FilesSource
}) {
  const { t } = useI18n()
  return (
    <div className="inline-flex items-center gap-1 rounded bg-neutral-100/80 p-1 dark:bg-neutral-800/60">
      {sourceTabs.map((item) => (
        <button
          className={cn(
            'rounded px-3 py-1.5 text-xs font-medium transition-colors',
            props.value === item.value
              ? 'shadow-xs bg-white text-neutral-950 ring-1 ring-black/[0.04] dark:bg-neutral-700 dark:text-neutral-50 dark:ring-white/10'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
          )}
          key={item.value}
          onClick={() => props.onChange(item.value)}
          type="button"
        >
          {t(item.labelKey as never)}
        </button>
      ))}
    </div>
  )
}

function UploadDropZone(props: {
  acceptImage: boolean
  dragging: boolean
  items: UploadItem[]
  onBrowse: () => void
  onDragChange: (dragging: boolean) => void
  onFiles: (files: File[]) => void
}) {
  const { t } = useI18n()
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    props.onDragChange(false)
    props.onFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
      <div
        className={cn(
          'flex min-h-32 flex-col items-center justify-center gap-3 border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center transition-colors dark:border-neutral-700 dark:bg-neutral-900/40',
          props.dragging &&
            'border-neutral-950 bg-neutral-100 dark:border-neutral-50 dark:bg-neutral-900',
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          props.onDragChange(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          props.onDragChange(false)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <Upload aria-hidden="true" className="size-8 text-neutral-400" />
        <div>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
            {t('files.upload.dropHint')}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {props.acceptImage
              ? t('files.upload.imageOnly')
              : t('files.upload.anyFile')}
          </p>
        </div>
        <Button onClick={props.onBrowse} type="button" variant="subtle">
          {t('files.upload.choose')}
        </Button>
      </div>

      {props.items.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {props.items.map((item) => (
            <div
              className="grid gap-1 text-xs text-neutral-500 dark:text-neutral-400"
              key={item.id}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{item.name}</span>
                <span>
                  {item.status === 'done'
                    ? t('files.upload.done')
                    : item.status === 'error'
                      ? item.error
                      : `${item.progress}%`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <div
                  className={cn(
                    'h-full transition-all',
                    item.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-neutral-950 dark:bg-neutral-50',
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FileGrid(props: {
  deleting: boolean
  files: FileItem[]
  imageMode: boolean
  loading: boolean
  onCopy: (url: string) => void
  onDelete: (file: FileItem) => void
  onPreview: (file: FileItem) => void
}) {
  const { t } = useI18n()
  if (props.loading) return <FileSkeleton />
  if (props.files.length === 0)
    return <FileEmpty label={t('files.empty.files')} />

  return (
    <div
      className={cn(
        'grid gap-3 p-4',
        props.imageMode
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6'
          : 'grid-cols-1',
      )}
    >
      {props.files.map((file) => (
        <FileCard
          deleting={props.deleting}
          file={file}
          imageMode={props.imageMode}
          key={file.name}
          onCopy={props.onCopy}
          onDelete={props.onDelete}
          onPreview={props.onPreview}
        />
      ))}
    </div>
  )
}

function FileCard(props: {
  deleting: boolean
  file: FileItem
  imageMode: boolean
  onCopy: (url: string) => void
  onDelete: (file: FileItem) => void
  onPreview: (file: FileItem) => void
}) {
  const { t } = useI18n()
  return (
    <article className="group overflow-hidden rounded border border-neutral-200 bg-white transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900/70">
      {props.imageMode ? (
        <button
          className="block aspect-square w-full overflow-hidden bg-neutral-100 text-left dark:bg-neutral-900"
          onClick={() => props.onPreview(props.file)}
          title={t('files.action.previewImage')}
          type="button"
        >
          <BlurhashImage
            alt={props.file.name}
            blurhash={props.file.blurhash}
            className="h-full w-full object-cover"
            dominantColor={props.file.palette?.dominant}
            src={props.file.url}
          />
        </button>
      ) : null}
      <div className="flex items-center gap-2 p-3">
        {!props.imageMode ? (
          <FileIcon aria-hidden="true" className="size-4 text-neutral-400" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
            {props.file.name}
          </h3>
          {props.file.created ? (
            <p className="mt-1 text-xs text-neutral-400">
              {relativeTimeFromNow(new Date(props.file.created))}
            </p>
          ) : null}
        </div>
        <IconButton
          label={t('files.action.copyLink')}
          onClick={() => props.onCopy(props.file.url)}
        >
          <Copy aria-hidden="true" className="size-4" />
        </IconButton>
        <a
          className="inline-flex size-8 items-center justify-center rounded border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          href={props.file.url}
          rel="noreferrer"
          target="_blank"
          title={t('files.action.open')}
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <IconButton
          danger
          disabled={props.deleting}
          label={t('files.action.delete')}
          onClick={() => props.onDelete(props.file)}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </IconButton>
      </div>
    </article>
  )
}

function OrphanGrid(props: {
  deleting: boolean
  files: OrphanFile[]
  loading: boolean
  onCopy: (url: string) => void
  onDelete: (file: OrphanFile) => void
  onPageChange: (page: number) => void
  onPreview: (file: OrphanFile) => void
  onSelectAllCurrentPage: (checked: boolean) => void
  onSelectFile: (id: string, checked: boolean) => void
  onToggleAllOrphans: () => void
  page: number
  pageCount: number
  selectedIds: string[]
  selectEveryOrphan: boolean
  total: number
}) {
  const { t } = useI18n()
  if (props.loading) return <FileSkeleton />
  if (props.files.length === 0)
    return <FileEmpty label={t('files.empty.orphans')} />

  const currentPageSelected =
    props.files.length > 0 &&
    props.files.every((file) => props.selectedIds.includes(file.id))
  const partialSelected =
    props.selectedIds.length > 0 &&
    props.files.some((file) => props.selectedIds.includes(file.id)) &&
    !currentPageSelected

  return (
    <>
      <div className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <p>{t('files.orphans.description')}</p>
        <p className="mt-1 text-xs">{t('files.orphans.cleanupNote')}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <Checkbox
              checked={currentPageSelected || props.selectEveryOrphan}
              indeterminate={partialSelected}
              onCheckedChange={props.onSelectAllCurrentPage}
            />
            <span>
              {props.selectEveryOrphan
                ? t('files.orphans.allSelected', { count: props.total })
                : props.selectedIds.length > 0
                  ? t('files.orphans.selectedCount', {
                      count: props.selectedIds.length,
                    })
                  : t('files.orphans.selectCurrentPage')}
            </span>
          </label>
          {currentPageSelected &&
          props.pageCount > 1 &&
          !props.selectEveryOrphan ? (
            <button
              className="text-neutral-700 underline-offset-2 hover:underline dark:text-neutral-200"
              onClick={props.onToggleAllOrphans}
              type="button"
            >
              {t('files.orphans.selectEvery', { count: props.total })}
            </button>
          ) : null}
          {props.selectEveryOrphan ? (
            <button
              className="text-neutral-700 underline-offset-2 hover:underline dark:text-neutral-200"
              onClick={props.onToggleAllOrphans}
              type="button"
            >
              {t('files.orphans.deselectAll')}
            </button>
          ) : null}
        </div>
        <span>{t('files.orphans.totalCount', { count: props.total })}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {props.files.map((file) => (
          <ImageAuditCard
            checked={
              props.selectEveryOrphan || props.selectedIds.includes(file.id)
            }
            deleting={props.deleting}
            file={{
              createdAt: file.createdAt,
              blurhash: file.blurhash,
              fileName: file.fileName,
              fileUrl: file.fileUrl,
              id: file.id,
              meta: formatBytes(file.byteSize),
              palette: file.palette,
              status: file.status,
            }}
            key={file.id}
            onCopy={props.onCopy}
            onDelete={() => props.onDelete(file)}
            onPreview={() => props.onPreview(file)}
            onSelect={(checked) => props.onSelectFile(file.id, checked)}
          />
        ))}
      </div>
      <PaginationFooter
        onPageChange={props.onPageChange}
        page={props.page}
        pageCount={props.pageCount}
      />
    </>
  )
}

function CommentUploadGrid(props: {
  commentUploadStatusLabels: Record<Exclude<CommentUploadStatus, ''>, string>
  deleting: boolean
  files: CommentUploadFile[]
  loading: boolean
  onCopy: (url: string) => void
  onDelete: (file: CommentUploadFile) => void
  onPageChange: (page: number) => void
  onPreview: (file: CommentUploadFile) => void
  onStatusChange: (status: CommentUploadStatus) => void
  page: number
  pageCount: number
  status: CommentUploadStatus
  total: number
}) {
  const { t } = useI18n()
  if (props.loading) return <FileSkeleton />

  const commentStatusOptions = commentStatusOptionsBase.map((option) => ({
    label: t(option.labelKey as never),
    value: option.value,
  }))

  return (
    <>
      <div className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        {t('files.commentImages.description')}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <SelectField
          aria-label={t('files.commentImages.filterAria')}
          className="w-44"
          onValueChange={props.onStatusChange}
          options={commentStatusOptions}
          value={props.status}
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('files.commentImages.totalCount', { count: props.total })}
        </span>
      </div>
      {props.files.length === 0 ? (
        <FileEmpty label={t('files.empty.commentImages')} />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {props.files.map((file) => (
            <ImageAuditCard
              deleting={props.deleting}
              file={{
                createdAt: file.createdAt,
                blurhash: file.blurhash,
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                id: file.id,
                meta: `${formatBytes(file.byteSize)} · ${file.mimeType ?? '-'}`,
                palette: file.palette,
                reference:
                  file.refType && file.refId
                    ? `${file.refType}/${file.refId}`
                    : t('files.commentImages.unbound'),
                secondary: `reader: ${file.readerId ?? '-'}`,
                status: props.commentUploadStatusLabels[file.status],
              }}
              key={file.id}
              onCopy={props.onCopy}
              onDelete={() => props.onDelete(file)}
              onPreview={() => props.onPreview(file)}
            />
          ))}
        </div>
      )}
      <PaginationFooter
        onPageChange={props.onPageChange}
        page={props.page}
        pageCount={props.pageCount}
      />
    </>
  )
}

function ImageAuditCard(props: {
  checked?: boolean
  deleting: boolean
  file: {
    blurhash?: null | string
    createdAt: string
    fileName: string
    fileUrl: string
    id: string
    meta: string
    palette?: { dominant?: string; swatches?: string[] } | null
    reference?: string
    secondary?: string
    status?: string
  }
  onCopy: (url: string) => void
  onDelete: () => void
  onPreview: () => void
  onSelect?: (checked: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded border bg-white dark:bg-neutral-950',
        props.checked
          ? 'border-neutral-500 ring-2 ring-neutral-300 dark:border-neutral-400 dark:ring-neutral-700'
          : 'border-neutral-200 dark:border-neutral-800',
      )}
    >
      {props.onSelect ? (
        <label className="shadow-xs absolute left-2 top-2 z-10 inline-flex rounded bg-white/90 p-1 dark:bg-neutral-950/90">
          <Checkbox
            checked={props.checked ?? false}
            onCheckedChange={(checked) => props.onSelect?.(checked)}
          />
        </label>
      ) : null}
      <button
        className="block aspect-square w-full overflow-hidden bg-neutral-100 text-left dark:bg-neutral-900"
        onClick={props.onPreview}
        title={t('files.action.previewImage')}
        type="button"
      >
        <BlurhashImage
          alt={props.file.fileName}
          blurhash={props.file.blurhash}
          className="h-full w-full object-cover"
          dominantColor={props.file.palette?.dominant}
          src={props.file.fileUrl}
        />
      </button>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium">
            {props.file.fileName}
          </span>
          {props.file.status ? (
            <SmallBadge>{props.file.status}</SmallBadge>
          ) : null}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {props.file.meta}
        </div>
        {props.file.secondary ? (
          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {props.file.secondary}
          </div>
        ) : null}
        {props.file.reference ? (
          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {props.file.reference}
          </div>
        ) : null}
        <div className="text-xs text-neutral-400">
          {relativeTimeFromNow(props.file.createdAt)}
        </div>
        <div className="flex justify-end gap-2">
          <IconButton
            label={t('files.action.copyLink')}
            onClick={() => props.onCopy(props.file.fileUrl)}
          >
            <Copy aria-hidden="true" className="size-4" />
          </IconButton>
          <a
            className="inline-flex size-8 items-center justify-center rounded border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
            href={props.file.fileUrl}
            rel="noreferrer"
            target="_blank"
            title={t('files.action.open')}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
          <IconButton
            danger
            disabled={props.deleting}
            label={t('files.action.delete')}
            onClick={props.onDelete}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </IconButton>
        </div>
      </div>
    </article>
  )
}

function BlurhashImage(props: {
  alt: string
  blurhash?: null | string
  className?: string
  dominantColor?: string
  src: string
}) {
  const [loaded, setLoaded] = useState(false)
  const placeholder = useMemo(
    () =>
      props.blurhash
        ? decodeBlurhashToDataUrl(props.blurhash, blurhashPreviewSize)
        : null,
    [props.blurhash],
  )
  const backgroundColor = isPreviewColor(props.dominantColor)
    ? props.dominantColor
    : undefined

  useEffect(() => {
    setLoaded(false)
  }, [props.src])

  return (
    <span
      className="relative block h-full w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {placeholder ? (
        <img
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full scale-110 object-cover blur-md transition-opacity duration-300',
            loaded ? 'opacity-0' : 'opacity-100',
          )}
          decoding="async"
          src={placeholder}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 bg-neutral-100 transition-opacity duration-300 dark:bg-neutral-900',
            loaded ? 'opacity-0' : 'opacity-100',
          )}
        />
      )}
      <img
        alt={props.alt}
        className={cn(
          'relative z-[1] transition-opacity duration-300',
          props.className,
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        decoding="async"
        loading="lazy"
        onError={() => setLoaded(true)}
        onLoad={() => setLoaded(true)}
        src={props.src}
      />
    </span>
  )
}

function decodeBlurhashToDataUrl(hash: string, size: number) {
  try {
    if (typeof document === 'undefined') return null

    const pixels = decode(hash, size, size)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')
    if (!context) return null

    const imageData = context.createImageData(size, size)
    imageData.data.set(pixels)
    context.putImageData(imageData, 0, 0)

    return canvas.toDataURL()
  } catch {
    return null
  }
}

function isPreviewColor(value: string | undefined) {
  if (!value) return false

  return (
    /^#[0-9a-f]{3,8}$/i.test(value) ||
    /^rgba?\([\d\s.,%]+\)$/i.test(value) ||
    /^hsla?\([\d\s.,%a-z-]+\)$/i.test(value)
  )
}

function ImagePreviewDialog(props: {
  image: null | { name: string; url: string }
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open={Boolean(props.image)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/70" />
        <Dialog.Popup className="outline-hidden fixed inset-4 z-50 flex flex-col overflow-hidden rounded border border-neutral-800 bg-neutral-950 shadow-2xl sm:inset-8">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <Dialog.Title className="min-w-0 truncate text-sm font-medium text-white">
              {props.image?.name ?? t('files.preview.title')}
            </Dialog.Title>
            <div className="flex shrink-0 items-center gap-2">
              {props.image ? (
                <a
                  className="inline-flex h-8 items-center gap-2 rounded border border-white/15 px-2.5 text-xs text-neutral-200 transition-colors hover:bg-white/10"
                  href={props.image.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                  {t('files.action.open')}
                </a>
              ) : null}
              <Dialog.Close className="inline-flex h-8 items-center rounded border border-white/15 px-2.5 text-xs text-neutral-200 transition-colors hover:bg-white/10">
                {t('files.action.close')}
              </Dialog.Close>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center bg-black p-3">
            {props.image ? (
              <img
                alt={props.image.name}
                className="max-h-full max-w-full object-contain"
                src={props.image.url}
              />
            ) : null}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PaginationFooter(props: {
  onPageChange: (page: number) => void
  page: number
  pageCount: number
}) {
  if (props.pageCount <= 1) return null

  return (
    <div className="flex items-center justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <CompactPagination
        onPageChange={props.onPageChange}
        onPageSizeChange={() => undefined}
        page={props.page}
        pageCount={props.pageCount}
        pageSize={pageSize}
        pageSizes={[pageSize]}
      />
    </div>
  )
}

function IconButton(props: {
  children: React.ReactNode
  danger?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'inline-flex size-8 items-center justify-center rounded border transition-colors disabled:opacity-50',
        props.danger
          ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30'
          : 'border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800',
      )}
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.label}
      type="button"
    >
      {props.children}
    </button>
  )
}

function SmallBadge(props: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      {props.children}
    </span>
  )
}

function FileSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          className="aspect-square animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
          key={index}
        />
      ))}
    </div>
  )
}

function FileEmpty(props: { label: string }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <ImageIcon aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        {props.label}
      </p>
    </div>
  )
}

function formatBytes(bytes: null | number | undefined) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

async function copyToClipboard(
  url: string,
  t: (key: never, values?: Record<string, number | string>) => string,
) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('files.toast.copied' as never))
  } catch {
    toast.error(t('files.toast.copyFailed' as never))
  }
}
