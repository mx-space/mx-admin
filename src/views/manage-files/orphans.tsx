import {
  Eraser as CleanupIcon,
  Copy,
  ExternalLink,
  RefreshCw as RefreshIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCheckbox,
  NEmpty,
  NImage,
  NPagination,
  NPopconfirm,
  NScrollbar,
  NSpin,
  NTooltip,
  useDialog,
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { OrphanFile } from '~/api/files'

import { filesApi } from '~/api/files'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { useLayout } from '~/layouts/content'

export default defineComponent({
  name: 'OrphanImagesPage',
  setup() {
    const loading = ref(false)
    const cleaning = ref(false)
    const batchDeleting = ref(false)
    const orphanFiles = ref<OrphanFile[]>([])
    const pagination = ref({
      currentPage: 1,
      totalPage: 1,
      size: 24,
      total: 0,
    })

    const checkedRowKeys = ref<string[]>([])
    const selectAllMode = ref(false)

    const dialog = useDialog()

    const fetchOrphanFiles = async (page = 1) => {
      loading.value = true
      checkedRowKeys.value = []
      selectAllMode.value = false
      try {
        const res = await filesApi.orphans.list(page, pagination.value.size)
        orphanFiles.value = res.data
        pagination.value = {
          currentPage: res.pagination.currentPage,
          totalPage: res.pagination.totalPage,
          size: res.pagination.size,
          total: res.pagination.total,
        }
      } catch {
        orphanFiles.value = []
      } finally {
        loading.value = false
      }
    }

    const handleCleanup = async () => {
      cleaning.value = true
      try {
        const res = await filesApi.orphans.cleanup(60)
        toast.success(`已清理 ${res.deletedCount} 个孤儿文件`)
        await fetchOrphanFiles(1)
      } catch (error: any) {
        toast.error(error.message || '清理失败')
      } finally {
        cleaning.value = false
      }
    }

    const handleDelete = async (file: OrphanFile) => {
      try {
        await filesApi.deleteByTypeAndName('image', file.fileName)
        toast.success('删除成功')
        orphanFiles.value = orphanFiles.value.filter((f) => f.id !== file.id)
        checkedRowKeys.value = checkedRowKeys.value.filter(
          (id) => id !== file.id,
        )
        pagination.value.total--
      } catch (error: any) {
        toast.error(error.message || '删除失败')
      }
    }

    const handleBatchDelete = async () => {
      if (selectAllMode.value) {
        batchDeleting.value = true
        try {
          const res = await filesApi.orphans.batchDelete({ all: true })
          toast.success(`已删除 ${res.deletedCount} 个孤儿文件`)
          await fetchOrphanFiles(1)
        } catch (error: any) {
          toast.error(error.message || '批量删除失败')
        } finally {
          batchDeleting.value = false
        }
      } else if (checkedRowKeys.value.length > 0) {
        batchDeleting.value = true
        try {
          const res = await filesApi.orphans.batchDelete({
            ids: checkedRowKeys.value,
          })
          toast.success(`已删除 ${res.deletedCount} 个孤儿文件`)
          await fetchOrphanFiles(pagination.value.currentPage)
        } catch (error: any) {
          toast.error(error.message || '批量删除失败')
        } finally {
          batchDeleting.value = false
        }
      }
    }

    const handleCopyUrl = async (url: string) => {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('已复制到剪贴板')
      } catch {
        toast.error('复制失败')
      }
    }

    const handlePageChange = (page: number) => {
      fetchOrphanFiles(page)
    }

    const handleCheck = (id: string, checked: boolean) => {
      if (selectAllMode.value) {
        selectAllMode.value = false
      }
      if (checked) {
        checkedRowKeys.value = [...checkedRowKeys.value, id]
      } else {
        checkedRowKeys.value = checkedRowKeys.value.filter((key) => key !== id)
      }
    }

    const isAllCurrentPageChecked = computed(() => {
      if (orphanFiles.value.length === 0) return false
      return orphanFiles.value.every((file) =>
        checkedRowKeys.value.includes(file.id),
      )
    })

    const isSomeCurrentPageChecked = computed(() => {
      if (orphanFiles.value.length === 0) return false
      const checkedCount = orphanFiles.value.filter((file) =>
        checkedRowKeys.value.includes(file.id),
      ).length
      return checkedCount > 0 && checkedCount < orphanFiles.value.length
    })

    const handleCheckAllCurrentPage = (checked: boolean) => {
      selectAllMode.value = false
      if (checked) {
        checkedRowKeys.value = orphanFiles.value.map((file) => file.id)
      } else {
        checkedRowKeys.value = []
      }
    }

    const handleSelectAll = () => {
      selectAllMode.value = true
      checkedRowKeys.value = orphanFiles.value.map((file) => file.id)
    }

    const handleCancelSelectAll = () => {
      selectAllMode.value = false
      checkedRowKeys.value = []
    }

    const hasSelection = computed(
      () => checkedRowKeys.value.length > 0 || selectAllMode.value,
    )

    const hasMultiplePages = computed(() => pagination.value.totalPage > 1)

    const showSelectAllHint = computed(
      () =>
        isAllCurrentPageChecked.value &&
        hasMultiplePages.value &&
        !selectAllMode.value,
    )

    onMounted(() => {
      fetchOrphanFiles()
    })

    const { setActions } = useLayout()

    const renderActions = () => (
      <div class="flex items-center gap-2">
        {hasSelection.value && (
          <HeaderActionButton
            variant="error"
            disabled={batchDeleting.value}
            icon={
              batchDeleting.value ? (
                <RefreshIcon class="animate-spin" />
              ) : (
                <TrashIcon />
              )
            }
            name={
              selectAllMode.value
                ? `删除全部 (${pagination.value.total})`
                : `删除选中 (${checkedRowKeys.value.length})`
            }
            onClick={() => {
              dialog.warning({
                title: '删除确认',
                content: selectAllMode.value
                  ? `确定要删除全部 ${pagination.value.total} 个孤儿文件吗？`
                  : `确定要删除选中的 ${checkedRowKeys.value.length} 个文件吗？`,
                positiveText: '删除',
                negativeText: '取消',
                onPositiveClick: handleBatchDelete,
              })
            }}
          />
        )}
        <HeaderActionButton
          variant="warning"
          onClick={handleCleanup}
          disabled={pagination.value.total === 0 || cleaning.value}
          icon={
            cleaning.value ? (
              <RefreshIcon class="animate-spin" />
            ) : (
              <CleanupIcon />
            )
          }
          name="清理孤儿图片"
        />
        <HeaderActionButton
          variant="info"
          onClick={() => fetchOrphanFiles(pagination.value.currentPage)}
          disabled={loading.value}
          icon={<RefreshIcon class={loading.value ? 'animate-spin' : ''} />}
          name="刷新"
        />
      </div>
    )

    watch(
      [
        () => pagination.value.total,
        checkedRowKeys,
        selectAllMode,
        batchDeleting,
      ],
      () => {
        setActions(renderActions())
      },
      { immediate: true },
    )

    const isEmpty = computed(
      () => !loading.value && orphanFiles.value.length === 0,
    )

    return () => (
      <div class="flex h-full flex-col">
        <div class="mb-4 text-sm text-neutral-500">
          <p>孤儿图片是上传后未被任何文章引用的图片。</p>
          <p>
            清理操作仅删除超过 1 小时的孤儿图片，以避免误删正在编辑中的图片。
          </p>
        </div>

        {/* 选择操作栏 */}
        {orphanFiles.value.length > 0 && (
          <div class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
            <NCheckbox
              checked={isAllCurrentPageChecked.value || selectAllMode.value}
              indeterminate={
                isSomeCurrentPageChecked.value && !selectAllMode.value
              }
              onUpdateChecked={handleCheckAllCurrentPage}
              size="small"
            />
            <span class="text-sm font-medium text-neutral-500">
              {selectAllMode.value
                ? `已选择全部 ${pagination.value.total} 个孤儿文件`
                : isAllCurrentPageChecked.value
                  ? `已选择当前页 ${orphanFiles.value.length} 项`
                  : checkedRowKeys.value.length > 0
                    ? `已选 ${checkedRowKeys.value.length} 项`
                    : '全选'}
            </span>

            {showSelectAllHint.value && (
              <button
                onClick={handleSelectAll}
                class="text-sm text-neutral-600 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                选择全部 {pagination.value.total} 个孤儿文件
              </button>
            )}

            {selectAllMode.value && (
              <button
                onClick={handleCancelSelectAll}
                class="text-sm text-neutral-600 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                取消全选
              </button>
            )}
          </div>
        )}

        {/* 图片列表 */}
        <div class="relative min-h-0 flex-1">
          {loading.value ? (
            <div class="flex h-64 items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : isEmpty.value ? (
            <div class="flex h-64 items-center justify-center">
              <NEmpty description="暂无孤儿图片" />
            </div>
          ) : (
            <NScrollbar class="h-full max-h-[calc(100vh-380px)]">
              <div class="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {orphanFiles.value.map((file) => (
                  <OrphanFileCard
                    key={file.id}
                    file={file}
                    checked={checkedRowKeys.value.includes(file.id)}
                    onCheck={(checked: boolean) =>
                      handleCheck(file.id, checked)
                    }
                    onDelete={() => handleDelete(file)}
                    onCopy={() => handleCopyUrl(file.fileUrl)}
                  />
                ))}
              </div>
            </NScrollbar>
          )}
        </div>

        {/* 分页 */}
        {pagination.value.totalPage > 1 && (
          <div class="mt-4 flex justify-center">
            <NPagination
              page={pagination.value.currentPage}
              pageCount={pagination.value.totalPage}
              onUpdatePage={handlePageChange}
            />
          </div>
        )}
      </div>
    )
  },
})

const OrphanFileCard = defineComponent({
  props: {
    file: {
      type: Object as () => OrphanFile,
      required: true,
    },
    checked: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['delete', 'copy', 'check'],
  setup(props, { emit }) {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const handleCardClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.n-checkbox') ||
        target.closest('.n-image')
      ) {
        return
      }
      emit('check', !props.checked)
    }

    return () => (
      <div
        class={[
          'group relative cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-sm',
          props.checked
            ? 'border-neutral-400 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800/50'
            : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700',
        ]}
        onClick={handleCardClick}
      >
        {/* Checkbox */}
        <div class="absolute left-2 top-2 z-10">
          <NCheckbox
            checked={props.checked}
            onUpdateChecked={(checked) => emit('check', checked)}
            size="small"
          />
        </div>

        <div class="aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-800/50">
          <NImage
            src={props.file.fileUrl}
            objectFit="cover"
            class="size-full"
            showToolbar={false}
            imgProps={{
              class: 'size-full object-cover',
            }}
          />
        </div>

        <div class="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 pt-8 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <p class="mb-1 truncate text-xs text-white/90">
            {props.file.fileName}
          </p>
          <p class="mb-2 text-xs text-white/60">
            {formatDate(props.file.created)}
          </p>
          <div class="flex gap-1">
            <NTooltip>
              {{
                trigger: () => (
                  <NButton
                    size="tiny"
                    quaternary
                    class="!text-white hover:!bg-white/20"
                    onClick={() => emit('copy')}
                  >
                    {{
                      icon: () => <Copy class="size-3.5" />,
                    }}
                  </NButton>
                ),
                default: () => '复制链接',
              }}
            </NTooltip>
            <NTooltip>
              {{
                trigger: () => (
                  <a
                    href={props.file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    class="inline-flex size-6 items-center justify-center rounded text-white hover:bg-white/20"
                  >
                    <ExternalLink class="size-3.5" />
                  </a>
                ),
                default: () => '新窗口打开',
              }}
            </NTooltip>
            <NPopconfirm onPositiveClick={() => emit('delete')}>
              {{
                trigger: () => (
                  <NTooltip>
                    {{
                      trigger: () => (
                        <NButton
                          size="tiny"
                          quaternary
                          class="!text-red-400 hover:!bg-red-500/20"
                        >
                          {{
                            icon: () => <TrashIcon class="size-3.5" />,
                          }}
                        </NButton>
                      ),
                      default: () => '删除',
                    }}
                  </NTooltip>
                ),
                default: () => `确定要删除 ${props.file.fileName} 吗？`,
              }}
            </NPopconfirm>
          </div>
        </div>
      </div>
    )
  },
})
