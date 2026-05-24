import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  ExternalLink,
  FileIcon,
  ImageIcon,
  Loader2,
  RefreshCw,
  Smile,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type {
  CommentUploadFile,
  CommentUploadStatus,
  FileItem,
  FileType,
  OrphanFile,
} from '../api/files'

import { relativeTimeFromNow } from '~/app/utils/time'

import {
  batchDeleteOrphanFiles,
  cleanupOrphanFiles,
  deleteCommentUpload,
  deleteFileByTypeAndName,
  getCommentUploads,
  getFilesByType,
  getOrphanFiles,
  uploadFile,
} from '../api/files'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { CompactPagination } from '../ui/compact-pagination'
import { Panel } from '../ui/panel'
import { SelectField } from '../ui/select'

type FilesSource = 'comment-images' | 'files' | 'orphans'

const filesQueryKey = ['files']
const pageSize = 24

const fileTypes: Array<{
  acceptImage: boolean
  icon: LucideIcon
  label: string
  value: FileType
}> = [
  { acceptImage: true, icon: Smile, label: '图标', value: 'icon' },
  { acceptImage: true, icon: User, label: '头像', value: 'avatar' },
  { acceptImage: true, icon: ImageIcon, label: '图片', value: 'image' },
  { acceptImage: false, icon: FileIcon, label: '文件', value: 'file' },
]

const commentStatusOptions: Array<{
  label: string
  value: CommentUploadStatus
}> = [
  { label: '全部', value: '' },
  { label: '已绑定', value: 'active' },
  { label: '待绑定', value: 'pending' },
  { label: '已脱离', value: 'detached' },
]

export function FilesPage() {
  return <FilesSurface initialSource="files" />
}

export function OrphanFilesPage() {
  return <FilesSurface initialSource="orphans" />
}

export function CommentImagesPage() {
  return <FilesSurface initialSource="comment-images" />
}

function FilesSurface(props: { initialSource: FilesSource }) {
  const queryClient = useQueryClient()
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<FilesSource>(props.initialSource)
  const [fileType, setFileType] = useState<FileType>('icon')
  const [orphansPage, setOrphansPage] = useState(1)
  const [commentPage, setCommentPage] = useState(1)
  const [commentStatus, setCommentStatus] = useState<CommentUploadStatus>('')
  const [selectedOrphanIds, setSelectedOrphanIds] = useState<string[]>([])
  const [selectAllOrphans, setSelectAllOrphans] = useState(false)

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

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file, fileType),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '上传失败')),
    onSuccess: async () => {
      toast.success('上传成功')
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const deleteFileMutation = useMutation({
    mutationFn: (file: FileItem) =>
      deleteFileByTypeAndName(fileType, file.name),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('文件已删除')
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const cleanupMutation = useMutation({
    mutationFn: () => cleanupOrphanFiles(60),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '清理失败')),
    onSuccess: async (result) => {
      toast.success(`已清理 ${result.deletedCount} 个孤儿文件`)
      setOrphansPage(1)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const deleteOrphanMutation = useMutation({
    mutationFn: (file: OrphanFile) =>
      deleteFileByTypeAndName('image', file.fileName),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('孤儿文件已删除')
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const batchDeleteOrphansMutation = useMutation({
    mutationFn: () =>
      batchDeleteOrphanFiles(
        selectAllOrphans ? { all: true } : { ids: selectedOrphanIds },
      ),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '批量删除失败')),
    onSuccess: async (result) => {
      toast.success(`已删除 ${result.deletedCount} 个孤儿文件`)
      setSelectedOrphanIds([])
      setSelectAllOrphans(false)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: deleteCommentUpload,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async (result) => {
      toast.success(result.storageRemoved ? '评论图片已删除' : '记录已删除')
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const currentType = fileTypes.find((type) => type.value === fileType)!

  const onUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    const nextFile = files[0]
    event.target.value = ''
    if (!nextFile) return
    if (currentType.acceptImage && !nextFile.type.startsWith('image/')) {
      toast.error('该分类只能上传图片文件')
      return
    }
    uploadMutation.mutate(nextFile)
  }

  return (
    <div className="space-y-4">
      <Panel description="文件库、孤儿图片和评论图片审计。" title="文件管理">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
          <SourceTabs onChange={(next) => setSource(next)} value={source} />
          <div className="flex flex-wrap items-center gap-2">
            {source === 'files' ? (
              <>
                <input
                  accept={currentType.acceptImage ? 'image/*' : undefined}
                  className="hidden"
                  onChange={onUploadChange}
                  ref={uploadInputRef}
                  type="file"
                />
                <Button
                  disabled={uploadMutation.isPending}
                  onClick={() => uploadInputRef.current?.click()}
                  type="button"
                  variant="subtle"
                >
                  {uploadMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <Upload aria-hidden="true" className="size-4" />
                  )}
                  上传
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
                      const label = selectAllOrphans
                        ? `全部 ${orphansQuery.data?.pagination.total ?? 0} 个`
                        : `选中的 ${selectedOrphanIds.length} 个`
                      if (window.confirm(`确认删除${label}孤儿文件？`)) {
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
                      ? `删除全部 (${orphansQuery.data?.pagination.total ?? 0})`
                      : `删除选中 (${selectedOrphanIds.length})`}
                  </Button>
                ) : null}
                <Button
                  disabled={cleanupMutation.isPending}
                  onClick={() => {
                    if (window.confirm('确认清理 60 分钟以前的孤儿图片？')) {
                      cleanupMutation.mutate()
                    }
                  }}
                  type="button"
                  variant="subtle"
                >
                  {cleanupMutation.isPending ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <Trash2 aria-hidden="true" className="size-4" />
                  )}
                  清理孤儿图片
                </Button>
              </>
            ) : null}
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
              刷新
            </Button>
          </div>
        </div>

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
                    {type.label}
                  </button>
                )
              })}
            </div>
            <FileGrid
              deleting={deleteFileMutation.isPending}
              files={filesQuery.data ?? []}
              imageMode={currentType.acceptImage}
              loading={filesQuery.isLoading}
              onCopy={copyToClipboard}
              onDelete={(file) => {
                if (window.confirm(`确认删除 ${file.name}？`)) {
                  deleteFileMutation.mutate(file)
                }
              }}
            />
          </div>
        ) : null}

        {source === 'orphans' ? (
          <OrphanGrid
            deleting={deleteOrphanMutation.isPending}
            files={orphansQuery.data?.data ?? []}
            loading={orphansQuery.isLoading}
            onCopy={copyToClipboard}
            onDelete={(file) => {
              if (window.confirm(`确认删除 ${file.fileName}？`)) {
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
            onToggleAllOrphans={() => {
              setSelectAllOrphans((previous) => !previous)
              setSelectedOrphanIds(
                (orphansQuery.data?.data ?? []).map((file) => file.id),
              )
            }}
            page={orphansPage}
            pageCount={orphansQuery.data?.pagination.totalPage ?? 1}
            selectedIds={selectedOrphanIds}
            selectEveryOrphan={selectAllOrphans}
            total={orphansQuery.data?.pagination.total ?? 0}
          />
        ) : null}

        {source === 'comment-images' ? (
          <CommentUploadGrid
            deleting={deleteCommentMutation.isPending}
            files={commentUploadsQuery.data?.data ?? []}
            loading={commentUploadsQuery.isLoading}
            onCopy={copyToClipboard}
            onDelete={(file) => {
              if (window.confirm(`确认删除 ${file.fileName}？`)) {
                deleteCommentMutation.mutate(file.id)
              }
            }}
            onPageChange={setCommentPage}
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
      </Panel>
    </div>
  )
}

function SourceTabs(props: {
  onChange: (source: FilesSource) => void
  value: FilesSource
}) {
  const items: Array<{ label: string; value: FilesSource }> = [
    { label: '文件库', value: 'files' },
    { label: '孤儿图片', value: 'orphans' },
    { label: '评论图片', value: 'comment-images' },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded bg-neutral-100/80 p-1 dark:bg-neutral-800/60">
      {items.map((item) => (
        <button
          className={cn(
            'rounded px-3 py-1.5 text-xs font-medium transition-colors',
            props.value === item.value
              ? 'bg-white text-neutral-950 shadow-sm ring-1 ring-black/[0.04] dark:bg-neutral-700 dark:text-neutral-50 dark:ring-white/10'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
          )}
          key={item.value}
          onClick={() => props.onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
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
}) {
  if (props.loading) return <FileSkeleton />
  if (props.files.length === 0) return <FileEmpty label="暂无文件" />

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
}) {
  return (
    <article className="group overflow-hidden rounded border border-neutral-200 bg-white transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900/70">
      {props.imageMode ? (
        <div className="aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          <img
            alt={props.file.name}
            className="h-full w-full object-cover"
            loading="lazy"
            src={props.file.url}
          />
        </div>
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
          label="复制链接"
          onClick={() => props.onCopy(props.file.url)}
        >
          <Copy aria-hidden="true" className="size-4" />
        </IconButton>
        <a
          className="inline-flex size-8 items-center justify-center rounded border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          href={props.file.url}
          rel="noreferrer"
          target="_blank"
          title="打开"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
        <IconButton
          danger
          disabled={props.deleting}
          label="删除"
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
  onSelectAllCurrentPage: (checked: boolean) => void
  onSelectFile: (id: string, checked: boolean) => void
  onToggleAllOrphans: () => void
  page: number
  pageCount: number
  selectedIds: string[]
  selectEveryOrphan: boolean
  total: number
}) {
  if (props.loading) return <FileSkeleton />
  if (props.files.length === 0) return <FileEmpty label="暂无孤儿图片" />

  const currentPageSelected =
    props.files.length > 0 &&
    props.files.every((file) => props.selectedIds.includes(file.id))
  const partialSelected =
    props.selectedIds.length > 0 &&
    props.files.some((file) => props.selectedIds.includes(file.id)) &&
    !currentPageSelected

  return (
    <>
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
                ? `已选择全部 ${props.total} 项`
                : props.selectedIds.length > 0
                  ? `已选 ${props.selectedIds.length} 项`
                  : '全选当前页'}
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
              选择全部 {props.total} 个孤儿文件
            </button>
          ) : null}
          {props.selectEveryOrphan ? (
            <button
              className="text-neutral-700 underline-offset-2 hover:underline dark:text-neutral-200"
              onClick={props.onToggleAllOrphans}
              type="button"
            >
              取消全选
            </button>
          ) : null}
        </div>
        <span>共 {props.total} 条孤儿图片</span>
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
              fileName: file.fileName,
              fileUrl: file.fileUrl,
              id: file.id,
              meta: formatBytes(file.byteSize),
              status: file.status,
            }}
            key={file.id}
            onCopy={props.onCopy}
            onDelete={() => props.onDelete(file)}
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
  deleting: boolean
  files: CommentUploadFile[]
  loading: boolean
  onCopy: (url: string) => void
  onDelete: (file: CommentUploadFile) => void
  onPageChange: (page: number) => void
  onStatusChange: (status: CommentUploadStatus) => void
  page: number
  pageCount: number
  status: CommentUploadStatus
  total: number
}) {
  if (props.loading) return <FileSkeleton />

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <SelectField
          aria-label="评论图片状态筛选"
          className="w-44"
          onValueChange={props.onStatusChange}
          options={commentStatusOptions}
          value={props.status}
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          共 {props.total} 条评论图片
        </span>
      </div>
      {props.files.length === 0 ? (
        <FileEmpty label="暂无评论图片" />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {props.files.map((file) => (
            <ImageAuditCard
              deleting={props.deleting}
              file={{
                createdAt: file.createdAt,
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                id: file.id,
                meta: `${formatBytes(file.byteSize)} · ${file.mimeType ?? '-'}`,
                status: file.status,
              }}
              key={file.id}
              onCopy={props.onCopy}
              onDelete={() => props.onDelete(file)}
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
    createdAt: string
    fileName: string
    fileUrl: string
    id: string
    meta: string
    status?: string
  }
  onCopy: (url: string) => void
  onDelete: () => void
  onSelect?: (checked: boolean) => void
}) {
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
        <label className="absolute left-2 top-2 z-10 inline-flex rounded bg-white/90 p-1 shadow-sm dark:bg-neutral-950/90">
          <Checkbox
            checked={props.checked ?? false}
            onCheckedChange={(checked) => props.onSelect?.(checked)}
          />
        </label>
      ) : null}
      <div className="aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <img
          alt={props.file.fileName}
          className="h-full w-full object-cover"
          loading="lazy"
          src={props.file.fileUrl}
        />
      </div>
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
        <div className="text-xs text-neutral-400">
          {relativeTimeFromNow(props.file.createdAt)}
        </div>
        <div className="flex justify-end gap-2">
          <IconButton
            label="复制链接"
            onClick={() => props.onCopy(props.file.fileUrl)}
          >
            <Copy aria-hidden="true" className="size-4" />
          </IconButton>
          <a
            className="inline-flex size-8 items-center justify-center rounded border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
            href={props.file.fileUrl}
            rel="noreferrer"
            target="_blank"
            title="打开"
          >
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
          <IconButton
            danger
            disabled={props.deleting}
            label="删除"
            onClick={props.onDelete}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </IconButton>
        </div>
      </div>
    </article>
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

async function copyToClipboard(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success('已复制到剪贴板')
  } catch {
    toast.error('复制失败')
  }
}
