import {
  Copy,
  ExternalLink,
  RefreshCw as RefreshIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NEmpty,
  NImage,
  NPagination,
  NPopconfirm,
  NScrollbar,
  NSpin,
  NTooltip,
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
    const orphanFiles = ref<OrphanFile[]>([])
    const pagination = ref({
      currentPage: 1,
      totalPage: 1,
      size: 24,
      total: 0,
    })

    const fetchOrphanFiles = async (page = 1) => {
      loading.value = true
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
        pagination.value.total--
      } catch (error: any) {
        toast.error(error.message || '删除失败')
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

    onMounted(() => {
      fetchOrphanFiles()
    })

    const { setActions } = useLayout()

    const renderActions = () => (
      <div class="flex items-center gap-2">
        <HeaderActionButton
          variant="warning"
          onClick={handleCleanup}
          disabled={pagination.value.total === 0 || cleaning.value}
          icon={
            cleaning.value ? (
              <RefreshIcon class="animate-spin" />
            ) : (
              <TrashIcon />
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
      () => pagination.value.total,
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
            <NScrollbar class="h-full max-h-[calc(100vh-320px)]">
              <div class="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {orphanFiles.value.map((file) => (
                  <OrphanFileCard
                    key={file.id}
                    file={file}
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
  },
  emits: ['delete', 'copy'],
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

    return () => (
      <div class="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
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
