import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Database,
  Download,
  HardDrive,
  History,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { BackupFile } from '../api/backups'

import {
  createBackup,
  deleteBackup,
  downloadBackup,
  getBackups,
  rollbackBackup,
  uploadAndRestoreBackup,
} from '../api/backups'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Panel } from '../ui/panel'

export function BackupPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const backupsQuery = useQuery({
    queryFn: getBackups,
    queryKey: ['backups', 'list'],
  })

  const backups = useMemo(
    () =>
      [...(backupsQuery.data ?? [])].sort((a, b) =>
        b.filename.localeCompare(a.filename),
      ),
    [backupsQuery.data],
  )
  const selectedBackup =
    backups.find((item) => item.filename === selectedFilename) ?? null
  const allSelected = backups.length > 0 && selectedKeys.size === backups.length

  const invalidateBackups = async () => {
    await queryClient.invalidateQueries({ queryKey: ['backups'] })
  }

  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: async (blob) => {
      toast.success('备份完成')
      saveBlob(blob, 'backup.zip')
      await invalidateBackups()
    },
    onError: () => {
      toast.error('备份失败')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: uploadAndRestoreBackup,
    onSuccess: () => {
      toast.success('恢复成功，页面将会重载')
      setTimeout(() => {
        location.reload()
      }, 1000)
    },
    onError: () => {
      toast.error('上传恢复失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: async (_, filename) => {
      toast.success('删除成功')
      setSelectedKeys((current) => {
        const next = new Set(current)
        next.delete(filename)
        return next
      })
      if (selectedFilename === filename) {
        setSelectedFilename(null)
        setShowDetailOnMobile(false)
      }
      await invalidateBackups()
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: rollbackBackup,
    onSuccess: () => {
      toast.success('回滚成功，页面将会重载')
      setTimeout(() => {
        location.reload()
      }, 1000)
    },
    onError: () => {
      toast.error('回滚失败')
    },
  })

  const downloadMutation = useMutation({
    mutationFn: async (filename: string) => ({
      blob: await downloadBackup(filename),
      filename,
    }),
    onSuccess: ({ blob, filename }) => {
      toast.success('下载完成')
      saveBlob(blob, `${filename}.zip`)
    },
    onError: () => {
      toast.error('下载失败')
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      const filenames = Array.from(selectedKeys)
      const results = await Promise.allSettled(
        filenames.map((filename) => deleteBackup(filename)),
      )

      return {
        failedCount: results.filter((result) => result.status === 'rejected')
          .length,
        filenames,
        successfulFilenames: filenames.filter(
          (_, index) => results[index].status === 'fulfilled',
        ),
        successCount: results.filter((result) => result.status === 'fulfilled')
          .length,
      }
    },
    onSuccess: async ({ failedCount, successfulFilenames, successCount }) => {
      setSelectedKeys((current) => {
        const next = new Set(current)
        successfulFilenames.forEach((filename) => next.delete(filename))
        return next
      })
      if (selectedFilename && successfulFilenames.includes(selectedFilename)) {
        setSelectedFilename(null)
        setShowDetailOnMobile(false)
      }
      if (failedCount > 0) {
        toast.warning(`删除完成：成功 ${successCount}，失败 ${failedCount}`)
      } else {
        toast.success(`成功删除 ${successCount} 个备份`)
      }
      await invalidateBackups()
    },
  })

  const toggleSelect = (filename: string, checked: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (checked) next.add(filename)
      else next.delete(filename)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedKeys(() =>
      allSelected ? new Set() : new Set(backups.map((item) => item.filename)),
    )
  }

  const handleUploadChange = (file: File | undefined) => {
    if (!file) return
    uploadMutation.mutate(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <MasterDetailLayout
      defaultSize={0.38}
      maxSize={0.45}
      minSize={0.25}
      showDetailOnMobile={showDetailOnMobile}
      list={
        <section className="flex h-full min-h-0 flex-col">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                aria-label="选择全部备份"
                checked={allSelected}
                indeterminate={selectedKeys.size > 0 && !allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {selectedKeys.size > 0
                  ? `已选 ${selectedKeys.size} 项`
                  : '全选'}
              </span>
            </div>
            <span className="text-xs text-neutral-400">
              {backups.length} 个备份
            </span>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <Button
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
              type="button"
            >
              <Database aria-hidden="true" className="size-4" />
              立即备份
            </Button>
            <Button
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              type="button"
              variant="subtle"
            >
              <Upload aria-hidden="true" className="size-4" />
              上传恢复
            </Button>
            <Button
              className="text-red-600 dark:text-red-400"
              disabled={
                selectedKeys.size === 0 || batchDeleteMutation.isPending
              }
              onClick={() => {
                if (
                  window.confirm(
                    `确定要删除选中的 ${selectedKeys.size} 个备份吗？`,
                  )
                ) {
                  batchDeleteMutation.mutate()
                }
              }}
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              批量删除
            </Button>
            <input
              accept=".zip"
              className="hidden"
              onChange={(event) => handleUploadChange(event.target.files?.[0])}
              ref={fileInputRef}
              type="file"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {backupsQuery.isLoading && backups.length === 0 ? (
              <BackupListSkeleton />
            ) : backups.length === 0 ? (
              <BackupListEmptyState
                onCreate={() => createMutation.mutate()}
                onRestore={() => fileInputRef.current?.click()}
              />
            ) : (
              backups.map((item) => (
                <BackupListItem
                  checked={selectedKeys.has(item.filename)}
                  item={item}
                  key={item.filename}
                  onSelect={() => {
                    setSelectedFilename(item.filename)
                    setShowDetailOnMobile(true)
                  }}
                  onToggleCheck={toggleSelect}
                  selected={selectedFilename === item.filename}
                />
              ))
            )}
          </div>
        </section>
      }
      detail={
        <section className="h-full min-h-0">
          {selectedBackup ? (
            <BackupDetail
              item={selectedBackup}
              onBack={() => setShowDetailOnMobile(false)}
              onDelete={() => deleteMutation.mutate(selectedBackup.filename)}
              onDownload={() =>
                downloadMutation.mutate(selectedBackup.filename)
              }
              onRollback={() =>
                rollbackMutation.mutate(selectedBackup.filename)
              }
            />
          ) : (
            <BackupDetailEmptyState />
          )}
        </section>
      }
    />
  )
}

function BackupListItem(props: {
  checked: boolean
  item: BackupFile
  onSelect: () => void
  onToggleCheck: (filename: string, checked: boolean) => void
  selected: boolean
}) {
  return (
    <article
      className={[
        'flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 transition-colors last:border-b-0 dark:border-neutral-900',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
      ].join(' ')}
      onClick={props.onSelect}
    >
      <Checkbox
        aria-label="选择备份"
        checked={props.checked}
        className="shrink-0"
        onCheckedChange={(checked) =>
          props.onToggleCheck(props.item.filename, checked)
        }
        onClick={(event) => event.stopPropagation()}
      />
      <div className="flex size-8 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400">
        <HardDrive aria-hidden="true" className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {formatBackupDate(props.item.filename)}
        </div>
        <div className="mt-0.5 text-xs text-neutral-400">{props.item.size}</div>
      </div>
    </article>
  )
}

function BackupDetail(props: {
  item: BackupFile
  onBack: () => void
  onDelete: () => void
  onDownload: () => void
  onRollback: () => void
}) {
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [rollbackConfirming, setRollbackConfirming] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            onClick={props.onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            备份详情
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            className="h-8 px-2"
            onClick={props.onDownload}
            type="button"
            variant="subtle"
          >
            <Download aria-hidden="true" className="size-3.5" />
            下载
          </Button>
          <Button
            className="h-8 px-2"
            onClick={() => {
              if (rollbackConfirming) {
                props.onRollback()
                setRollbackConfirming(false)
              } else {
                setRollbackConfirming(true)
              }
            }}
            onMouseLeave={() => setRollbackConfirming(false)}
            type="button"
            variant="subtle"
          >
            <History aria-hidden="true" className="size-3.5" />
            {rollbackConfirming ? '确认回滚' : '回滚'}
          </Button>
          <Button
            className="h-8 px-2 text-red-600 dark:text-red-400"
            onClick={() => {
              if (deleteConfirming) {
                props.onDelete()
                setDeleteConfirming(false)
              } else {
                setDeleteConfirming(true)
              }
            }}
            onMouseLeave={() => setDeleteConfirming(false)}
            type="button"
            variant="subtle"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            {deleteConfirming ? '确认删除' : '删除'}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50">
              <HardDrive
                aria-hidden="true"
                className="size-10 text-blue-500 dark:text-blue-400"
              />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {formatBackupDate(props.item.filename)}
            </h3>
            <p className="mt-1 font-mono text-xs text-neutral-400">
              {props.item.filename}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard
              icon={HardDrive}
              label="文件大小"
              value={props.item.size}
            />
            <InfoCard
              icon={Calendar}
              label="创建时间"
              value={formatBackupDate(props.item.filename)}
            />
          </div>

          <Panel title="操作">
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              <ActionRow
                description="将备份文件下载到本地"
                icon={Download}
                label="下载备份"
                onClick={props.onDownload}
                tone="blue"
              />
              <ActionRow
                description="使用此备份恢复数据，当前数据将被覆盖"
                icon={History}
                label={rollbackConfirming ? '确认回滚到此备份' : '回滚到此备份'}
                onClick={() => {
                  if (rollbackConfirming) {
                    props.onRollback()
                    setRollbackConfirming(false)
                  } else {
                    setRollbackConfirming(true)
                  }
                }}
                onMouseLeave={() => setRollbackConfirming(false)}
                tone="amber"
              />
              <ActionRow
                description="永久删除此备份文件"
                icon={Trash2}
                label={deleteConfirming ? '确认删除备份' : '删除备份'}
                onClick={() => {
                  if (deleteConfirming) {
                    props.onDelete()
                    setDeleteConfirming(false)
                  } else {
                    setDeleteConfirming(true)
                  }
                }}
                onMouseLeave={() => setDeleteConfirming(false)}
                tone="red"
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function InfoCard(props: {
  icon: typeof HardDrive
  label: string
  value: string
}) {
  const Icon = props.icon

  return (
    <div className="rounded border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center gap-2 text-neutral-400">
        <Icon aria-hidden="true" className="size-4" />
        <span className="text-xs">{props.label}</span>
      </div>
      <div className="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {props.value}
      </div>
    </div>
  )
}

function ActionRow(props: {
  description: string
  icon: typeof Download
  label: string
  onClick: () => void
  onMouseLeave?: () => void
  tone: 'amber' | 'blue' | 'red'
}) {
  const Icon = props.icon
  const toneClass = {
    amber:
      'bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400',
    red: 'bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400',
  }[props.tone]

  return (
    <button
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
      onClick={props.onClick}
      onMouseLeave={props.onMouseLeave}
      type="button"
    >
      <div
        className={`flex size-10 items-center justify-center rounded ${toneClass}`}
      >
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div>
        <div
          className={
            props.tone === 'red'
              ? 'text-sm font-medium text-red-600 dark:text-red-400'
              : 'text-sm font-medium text-neutral-900 dark:text-neutral-100'
          }
        >
          {props.label}
        </div>
        <div className="text-xs text-neutral-400">{props.description}</div>
      </div>
    </button>
  )
}

function BackupListEmptyState(props: {
  onCreate: () => void
  onRestore: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Database
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <p className="text-sm text-neutral-500">暂无备份</p>
      <p className="mb-4 mt-1 text-xs text-neutral-400">创建备份以保护数据</p>
      <div className="flex items-center gap-2">
        <Button onClick={props.onCreate} type="button">
          立即备份
        </Button>
        <Button onClick={props.onRestore} type="button" variant="subtle">
          <Upload aria-hidden="true" className="size-4" />
          上传恢复
        </Button>
      </div>
    </div>
  )
}

function BackupDetailEmptyState() {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
      <Database
        aria-hidden="true"
        className="mb-4 size-10 text-neutral-300 dark:text-neutral-700"
      />
      <h3 className="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
        选择一个备份
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        从左侧列表选择查看详情
      </p>
    </div>
  )
}

function BackupListSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4].map((index) => (
        <div
          className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-900"
          key={index}
        >
          <div className="size-4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="size-8 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mt-2 h-3 w-16 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatBackupDate(filename: string) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/)
  if (match) {
    return `${match[1]} ${match[2].replace(/-/g, ':')}`
  }
  return filename
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
