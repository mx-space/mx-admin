import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Database, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  createBackup,
  deleteBackup,
  downloadBackup,
  getBackups,
  rollbackBackup,
  uploadAndRestoreBackup,
} from '~/api/backups'
import { Button } from '~/ui/button'
import { Checkbox } from '~/ui/checkbox'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { MasterDetailLayout } from '~/ui/page-layout'
import { Scroll } from '~/ui/scroll'

import { saveBlob } from '../utils/backup-file'
import { BackupDetail } from './BackupDetail'
import { BackupDetailEmptyState } from './BackupDetailEmptyState'
import { BackupListEmptyState } from './BackupListEmptyState'
import { BackupListItem } from './BackupListItem'
import { BackupListSkeleton } from './BackupListSkeleton'

export function BackupRouteViewContent() {
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

          <Scroll className="flex-1">
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
          </Scroll>
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
