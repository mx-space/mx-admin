/**
 * Backup Management Page
 * 备份管理页面 - 列表形式
 */
import {
  Database,
  Download,
  HardDrive,
  History,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import { NButton, NCheckbox, NPopconfirm, NSpin } from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { PropType } from 'vue'

import { backupApi } from '~/api/backup'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { useLayout } from '~/layouts/content'
import { responseBlobToFile } from '~/utils'

interface BackupFile {
  filename: string
  size: string
}

export default defineComponent({
  setup() {
    const { setActions } = useLayout()
    const data = ref<BackupFile[]>([])
    const loading = ref(false)
    const selectedKeys = ref<Set<string>>(new Set())

    const fetchData = async () => {
      loading.value = true
      try {
        const list = await backupApi.getList()
        list.sort((b, a) => a.filename.localeCompare(b.filename))
        data.value = list
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchData()
    })

    const handleBackup = async () => {
      const info = toast.info('备份中...', {
        duration: 10e8,
        closeButton: true,
      })
      try {
        const blob = await backupApi.createNew()
        toast.dismiss(info)
        toast.success('备份完成')
        responseBlobToFile(blob, 'backup.zip')
        fetchData()
      } catch {
        toast.dismiss(info)
        toast.error('备份失败')
      }
    }

    const handleUploadAndRestore = async () => {
      const $file = document.createElement('input')
      $file.type = 'file'
      $file.style.cssText = `position: absolute; opacity: 0; z-index: -9999; top: 0; left: 0`
      $file.accept = '.zip'
      document.body.append($file)
      $file.click()
      $file.addEventListener('change', async () => {
        const file = $file.files![0]
        if (!file) return
        $file.remove()

        const info = toast.info('上传恢复中...', {
          duration: 10e8,
          closeButton: true,
        })
        try {
          await backupApi.uploadAndRestore(file)
          toast.dismiss(info)
          toast.success('恢复成功，页面将会重载')
          setTimeout(() => {
            location.reload()
          }, 1000)
        } catch {
          toast.dismiss(info)
          toast.error('上传恢复失败')
        }
      })
    }

    const handleDelete = async (filename: string) => {
      await backupApi.delete(filename)
      toast.success('删除成功')
      const index = data.value.findIndex((i) => i.filename === filename)
      if (index !== -1) {
        data.value.splice(index, 1)
      }
      selectedKeys.value.delete(filename)
    }

    const handleBatchDelete = async () => {
      const toDelete = Array.from(selectedKeys.value)
      const results = await Promise.allSettled(
        toDelete.map((filename) => backupApi.delete(filename)),
      )

      let successCount = 0
      for (const [i, result] of results.entries()) {
        if (result.status === 'fulfilled') {
          successCount++
          const index = data.value.findIndex(
            (item) => item.filename === toDelete[i],
          )
          if (index !== -1) {
            data.value.splice(index, 1)
          }
        }
      }

      selectedKeys.value.clear()
      if (successCount === toDelete.length) {
        toast.success(`成功删除 ${successCount} 个备份`)
      } else {
        toast.warning(
          `删除完成：成功 ${successCount}，失败 ${toDelete.length - successCount}`,
        )
      }
    }

    const toggleSelect = (filename: string) => {
      if (selectedKeys.value.has(filename)) {
        selectedKeys.value.delete(filename)
      } else {
        selectedKeys.value.add(filename)
      }
    }

    const isAllSelected = computed(
      () =>
        data.value.length > 0 && selectedKeys.value.size === data.value.length,
    )

    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedKeys.value.clear()
      } else {
        selectedKeys.value = new Set(data.value.map((item) => item.filename))
      }
    }

    const handleRollback = async (filename: string) => {
      const info = toast.info('回滚中...', {
        duration: 10e8,
        closeButton: true,
      })
      try {
        await backupApi.rollback(filename)
        toast.dismiss(info)
        toast.success('回滚成功，页面将会重载')
        setTimeout(() => {
          location.reload()
        }, 1000)
      } catch {
        toast.dismiss(info)
        toast.error('回滚失败')
      }
    }

    const handleDownload = async (filename: string) => {
      const info = toast.info('下载中...', {
        duration: 10e8,
        closeButton: true,
      })
      try {
        const blob = await backupApi.download(filename)
        toast.dismiss(info)
        toast.success('下载完成')
        responseBlobToFile(blob, `${filename}.zip`)
      } catch {
        toast.dismiss(info)
        toast.error('下载失败')
      }
    }

    watchEffect(() => {
      setActions(
        <>
          <DeleteConfirmButton
            checkedRowKeys={selectedKeys.value}
            onDelete={handleBatchDelete}
            customButtonTip="批量删除"
            message={`确定要删除选中的 ${selectedKeys.value.size} 个备份吗？`}
          />
          <HeaderActionButton
            icon={<Upload />}
            onClick={handleUploadAndRestore}
            name="上传恢复"
            variant="info"
          />
          <HeaderActionButton
            icon={<Database />}
            name="立即备份"
            variant="primary"
            onClick={handleBackup}
          />
        </>,
      )
    })

    return () => (
      <div class="space-y-4">
        <NSpin show={loading.value}>
          <div class="min-h-[200px]">
            {data.value.length === 0 && !loading.value ? (
              <BackupEmptyState onCreate={handleBackup} />
            ) : (
              <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                {/* Select All Header */}
                <div class="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <NCheckbox
                    checked={isAllSelected.value}
                    indeterminate={
                      selectedKeys.value.size > 0 && !isAllSelected.value
                    }
                    onUpdateChecked={toggleSelectAll}
                  />
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">
                    {selectedKeys.value.size > 0
                      ? `已选择 ${selectedKeys.value.size} 项`
                      : '全选'}
                  </span>
                </div>
                {data.value.map((item) => (
                  <BackupListItem
                    key={item.filename}
                    item={item}
                    selected={selectedKeys.value.has(item.filename)}
                    onSelect={() => toggleSelect(item.filename)}
                    onDownload={() => handleDownload(item.filename)}
                    onRollback={() => handleRollback(item.filename)}
                    onDelete={() => handleDelete(item.filename)}
                  />
                ))}
              </div>
            )}
          </div>
        </NSpin>
      </div>
    )
  },
})

/**
 * Backup List Item
 */
const BackupListItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<BackupFile>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    onSelect: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onDownload: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onRollback: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    // 解析文件名中的日期 (格式: backup-2024-01-18_12-30-45)
    const formatDate = (filename: string) => {
      const match = filename.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/)
      if (match) {
        const date = match[1]
        const time = match[2].replace(/-/g, ':')
        return `${date} ${time}`
      }
      return filename
    }

    return () => (
      <div class="group flex items-center gap-4 border-b border-neutral-200 px-4 py-4 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
        {/* Checkbox */}
        <NCheckbox
          checked={props.selected}
          onUpdateChecked={props.onSelect}
          class="shrink-0"
        />

        {/* Icon */}
        <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400">
          <HardDrive class="size-5" />
        </div>

        {/* Content */}
        <div class="min-w-0 flex-1">
          <div class="text-base font-medium text-neutral-900 dark:text-neutral-100">
            {formatDate(props.item.filename)}
          </div>
          <div class="mt-0.5 flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
            <span class="tabular-nums">{props.item.size}</span>
            <span class="font-mono text-xs text-neutral-400 dark:text-neutral-500">
              {props.item.filename}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div class="flex shrink-0 items-center gap-1">
          <NButton
            size="tiny"
            quaternary
            type="primary"
            onClick={props.onDownload}
            aria-label="下载备份"
          >
            {{
              icon: () => <Download class="size-3.5" />,
              default: () => <span class="hidden sm:inline">下载</span>,
            }}
          </NButton>

          <NPopconfirm
            positiveText="取消"
            negativeText="回滚"
            onNegativeClick={props.onRollback}
          >
            {{
              trigger: () => (
                <NButton
                  size="tiny"
                  quaternary
                  type="warning"
                  aria-label="回滚到此备份"
                >
                  {{
                    icon: () => <History class="size-3.5" />,
                    default: () => <span class="hidden sm:inline">回滚</span>,
                  }}
                </NButton>
              ),
              default: () => (
                <span class="max-w-48">
                  确定要回滚到此备份吗？当前数据将被覆盖。
                </span>
              ),
            }}
          </NPopconfirm>

          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={props.onDelete}
          >
            {{
              trigger: () => (
                <NButton
                  size="tiny"
                  quaternary
                  type="error"
                  aria-label="删除备份"
                >
                  <Trash2 class="size-3.5" />
                </NButton>
              ),
              default: () => <span>确定要删除此备份吗？</span>,
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

/**
 * Empty State
 */
const BackupEmptyState = defineComponent({
  props: {
    onCreate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Database class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">
          暂无备份
        </h3>
        <p class="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          创建备份以保护你的数据
        </p>
        <NButton type="primary" onClick={props.onCreate}>
          立即备份
        </NButton>
      </div>
    )
  },
})
