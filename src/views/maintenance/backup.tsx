/**
 * Backup Management Page
 * 备份管理页面 - Master-Detail 布局
 */
import {
  ArrowLeft,
  Calendar,
  Database,
  Download,
  HardDrive,
  History,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import { NButton, NCheckbox, NPopconfirm, NScrollbar, NTooltip } from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { BackupFile } from '~/api/backup'
import type { PropType } from 'vue'

import { backupApi } from '~/api/backup'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { useLayout } from '~/layouts/content'
import { responseBlobToFile } from '~/utils'

const formatDate = (filename: string) => {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/)
  if (match) {
    const date = match[1]
    const time = match[2].replace(/-/g, ':')
    return `${date} ${time}`
  }
  return filename
}

export default defineComponent({
  setup() {
    const { setActions } = useLayout()
    const { isMobile } = useMasterDetailLayout()

    const data = ref<BackupFile[]>([])
    const loading = ref(false)
    const selectedFilename = ref<string | null>(null)
    const showDetailOnMobile = ref(false)
    const selectedKeys = ref<Set<string>>(new Set())

    const selectedItem = computed(() =>
      data.value.find((item) => item.filename === selectedFilename.value),
    )

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
      if (selectedFilename.value === filename) {
        selectedFilename.value = null
        showDetailOnMobile.value = false
      }
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

      if (toDelete.includes(selectedFilename.value!)) {
        selectedFilename.value = null
        showDetailOnMobile.value = false
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

    const toggleSelect = (filename: string, e?: Event) => {
      e?.stopPropagation()
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

    const handleSelectItem = (item: BackupFile) => {
      selectedFilename.value = item.filename
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleBack = () => {
      showDetailOnMobile.value = false
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
      <MasterDetailLayout
        showDetailOnMobile={showDetailOnMobile.value}
        defaultSize={0.35}
        min={0.25}
        max={0.45}
      >
        {{
          list: () => (
            <BackupListPanel
              data={data.value}
              loading={loading.value}
              selectedFilename={selectedFilename.value}
              selectedKeys={selectedKeys.value}
              isAllSelected={isAllSelected.value}
              onSelect={handleSelectItem}
              onToggleCheck={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onCreate={handleBackup}
              onRestore={handleUploadAndRestore}
            />
          ),
          detail: () =>
            selectedItem.value ? (
              <BackupDetailPanel
                item={selectedItem.value}
                isMobile={isMobile.value}
                onBack={handleBack}
                onDownload={() => handleDownload(selectedItem.value!.filename)}
                onRollback={() => handleRollback(selectedItem.value!.filename)}
                onDelete={() => handleDelete(selectedItem.value!.filename)}
              />
            ) : null,
          empty: () => <BackupDetailEmptyState />,
        }}
      </MasterDetailLayout>
    )
  },
})

/**
 * Backup List Panel (left side)
 */
const BackupListPanel = defineComponent({
  props: {
    data: { type: Array as PropType<BackupFile[]>, required: true },
    loading: { type: Boolean, default: false },
    selectedFilename: {
      type: String as PropType<string | null>,
      default: null,
    },
    selectedKeys: {
      type: Object as PropType<Set<string>>,
      required: true,
    },
    isAllSelected: { type: Boolean, default: false },
    onSelect: {
      type: Function as PropType<(item: BackupFile) => void>,
      required: true,
    },
    onToggleCheck: {
      type: Function as PropType<(filename: string, e?: Event) => void>,
      required: true,
    },
    onToggleSelectAll: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onCreate: { type: Function as PropType<() => void>, required: true },
    onRestore: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="flex h-full flex-col">
        {/* Header */}
        <div class="flex h-12 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            <NCheckbox
              checked={props.isAllSelected}
              indeterminate={
                props.selectedKeys.size > 0 && !props.isAllSelected
              }
              onUpdateChecked={props.onToggleSelectAll}
            />
            <span class="text-sm text-neutral-500 dark:text-neutral-400">
              {props.selectedKeys.size > 0
                ? `已选 ${props.selectedKeys.size} 项`
                : '全选'}
            </span>
          </div>
          <span class="text-xs text-neutral-400">
            {props.data.length} 个备份
          </span>
        </div>

        {/* List */}
        <div class="min-h-0 flex-1">
          {props.loading ? (
            <div class="flex items-center justify-center py-24">
              <div class="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : props.data.length === 0 ? (
            <BackupListEmptyState
              onCreate={props.onCreate}
              onRestore={props.onRestore}
            />
          ) : (
            <NScrollbar class="h-full">
              {props.data.map((item) => (
                <div
                  key={item.filename}
                  class={[
                    'flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3',
                    'transition-colors last:border-b-0 dark:border-neutral-800/50',
                    props.selectedFilename === item.filename
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
                  ]}
                  onClick={() => props.onSelect(item)}
                >
                  <span
                    onClick={(e: Event) => e.stopPropagation()}
                    class="shrink-0"
                  >
                    <NCheckbox
                      checked={props.selectedKeys.has(item.filename)}
                      onUpdateChecked={() => props.onToggleCheck(item.filename)}
                    />
                  </span>
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400">
                    <HardDrive class="size-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {formatDate(item.filename)}
                    </div>
                    <div class="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                      {item.size}
                    </div>
                  </div>
                </div>
              ))}
            </NScrollbar>
          )}
        </div>
      </div>
    )
  },
})

/**
 * Backup Detail Panel (right side)
 */
const BackupDetailPanel = defineComponent({
  props: {
    item: { type: Object as PropType<BackupFile>, required: true },
    isMobile: { type: Boolean, default: false },
    onBack: { type: Function as PropType<() => void>, required: true },
    onDownload: { type: Function as PropType<() => void>, required: true },
    onRollback: { type: Function as PropType<() => void>, required: true },
    onDelete: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="flex h-full flex-col bg-white dark:bg-black">
        {/* Header */}
        <div class="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {props.isMobile && (
              <button
                onClick={props.onBack}
                class="-ml-2 flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeft class="size-5" />
              </button>
            )}
            <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              备份详情
            </h2>
          </div>
          <div class="flex items-center gap-1">
            <DetailActionButton
              icon={Download}
              label="下载"
              onClick={props.onDownload}
            />
            <NPopconfirm
              positiveText="取消"
              negativeText="回滚"
              onNegativeClick={props.onRollback}
            >
              {{
                trigger: () => (
                  <DetailActionButton icon={History} label="回滚" />
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
                  <DetailActionButton icon={Trash2} label="删除" danger />
                ),
                default: () => <span>确定要删除此备份吗？</span>,
              }}
            </NPopconfirm>
          </div>
        </div>

        {/* Content */}
        <NScrollbar class="min-h-0 flex-1">
          <div class="mx-auto max-w-3xl space-y-6 p-6">
            {/* Backup Icon */}
            <div class="flex flex-col items-center py-8">
              <div class="mb-4 flex size-20 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50">
                <HardDrive class="size-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(props.item.filename)}
              </h3>
              <p class="mt-1 font-mono text-xs text-neutral-400 dark:text-neutral-500">
                {props.item.filename}
              </p>
            </div>

            {/* Info Cards */}
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div class="mb-2 flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                  <HardDrive class="size-4" />
                  <span class="text-xs">文件大小</span>
                </div>
                <div class="text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {props.item.size}
                </div>
              </div>
              <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div class="mb-2 flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                  <Calendar class="size-4" />
                  <span class="text-xs">创建时间</span>
                </div>
                <div class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatDate(props.item.filename)}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                操作
              </h4>
              <div class="space-y-2">
                <button
                  onClick={props.onDownload}
                  class="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                >
                  <div class="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400">
                    <Download class="size-5" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      下载备份
                    </div>
                    <div class="text-xs text-neutral-400 dark:text-neutral-500">
                      将备份文件下载到本地
                    </div>
                  </div>
                </button>

                <NPopconfirm
                  positiveText="取消"
                  negativeText="回滚"
                  onNegativeClick={props.onRollback}
                >
                  {{
                    trigger: () => (
                      <button class="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
                        <div class="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400">
                          <History class="size-5" />
                        </div>
                        <div>
                          <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            回滚到此备份
                          </div>
                          <div class="text-xs text-neutral-400 dark:text-neutral-500">
                            使用此备份恢复数据，当前数据将被覆盖
                          </div>
                        </div>
                      </button>
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
                      <button class="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:bg-red-50 dark:border-neutral-800 dark:hover:bg-red-950/20">
                        <div class="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400">
                          <Trash2 class="size-5" />
                        </div>
                        <div>
                          <div class="text-sm font-medium text-red-600 dark:text-red-400">
                            删除备份
                          </div>
                          <div class="text-xs text-neutral-400 dark:text-neutral-500">
                            永久删除此备份文件
                          </div>
                        </div>
                      </button>
                    ),
                    default: () => <span>确定要删除此备份吗？</span>,
                  }}
                </NPopconfirm>
              </div>
            </div>
          </div>
        </NScrollbar>
      </div>
    )
  },
})

const DetailActionButton = defineComponent({
  props: {
    icon: { type: Object as PropType<any>, required: true },
    label: { type: String, required: true },
    danger: { type: Boolean, default: false },
    onClick: { type: Function as PropType<() => void> },
  },
  setup(props) {
    return () => (
      <NTooltip>
        {{
          trigger: () => (
            <button
              onClick={props.onClick}
              class={[
                'flex size-8 items-center justify-center rounded-md transition-colors',
                props.danger
                  ? 'text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-900/20 dark:hover:text-red-500'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
              ]}
            >
              <props.icon class="size-4" />
            </button>
          ),
          default: () => props.label,
        }}
      </NTooltip>
    )
  },
})

/**
 * Detail Empty State (no selection)
 */
const BackupDetailEmptyState = defineComponent({
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Database class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          选择一个备份
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择查看详情
        </p>
      </div>
    )
  },
})

/**
 * List Empty State (no backups)
 */
const BackupListEmptyState = defineComponent({
  props: {
    onCreate: { type: Function as PropType<() => void>, required: true },
    onRestore: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <Database class="mb-4 size-10 text-neutral-300 dark:text-neutral-700" />
        <p class="text-sm text-neutral-500">暂无备份</p>
        <p class="mb-4 mt-1 text-xs text-neutral-400">创建备份以保护你的数据</p>
        <div class="flex items-center gap-2">
          <NButton size="small" type="primary" onClick={props.onCreate}>
            立即备份
          </NButton>
          <NButton size="small" onClick={props.onRestore}>
            {{
              icon: () => <Upload class="size-3.5" />,
              default: () => '上传恢复',
            }}
          </NButton>
        </div>
      </div>
    )
  },
})
