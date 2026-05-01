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
  NSelect,
  NSpin,
  NTag,
  NTooltip,
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { CommentUploadFile } from '~/api/files'

import { filesApi } from '~/api/files'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { useLayout } from '~/layouts/content'

type StatusFilter = '' | 'pending' | 'active' | 'detached'

const statusOptions = [
  { label: '全部', value: '' },
  { label: '已绑定 (active)', value: 'active' },
  { label: '待绑定 (pending)', value: 'pending' },
  { label: '已脱离 (detached)', value: 'detached' },
]

const statusTagType: Record<
  CommentUploadFile['status'],
  'success' | 'warning' | 'error'
> = {
  active: 'success',
  pending: 'warning',
  detached: 'error',
}

const statusLabel: Record<CommentUploadFile['status'], string> = {
  active: '已绑定',
  pending: '待绑定',
  detached: '已脱离',
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default defineComponent({
  name: 'CommentImagesPage',
  setup() {
    const { setActions } = useLayout()
    const loading = ref(false)
    const files = ref<CommentUploadFile[]>([])
    const status = ref<StatusFilter>('')
    const pagination = ref({
      currentPage: 1,
      totalPage: 1,
      size: 24,
      total: 0,
    })

    const fetch = async (page = 1) => {
      loading.value = true
      try {
        const res = await filesApi.commentUploads.list({
          page,
          size: pagination.value.size,
          status: status.value || undefined,
        })
        files.value = res.data
        pagination.value = {
          currentPage: res.pagination.currentPage,
          totalPage: res.pagination.totalPage,
          size: res.pagination.size,
          total: res.pagination.total,
        }
      } catch {
        files.value = []
      } finally {
        loading.value = false
      }
    }

    const handleDelete = async (file: CommentUploadFile) => {
      try {
        const res = await filesApi.commentUploads.delete(file.id)
        if (res.storageRemoved) {
          toast.success('已删除（含 storage 对象）')
        } else {
          toast.warning('已删除记录，但 storage 删除失败（看 mx-core 日志）')
        }
        files.value = files.value.filter((f) => f.id !== file.id)
        pagination.value.total = Math.max(0, pagination.value.total - 1)
      } catch (error: any) {
        toast.error(error?.message || '删除失败')
      }
    }

    const handleCopy = (url: string) => {
      navigator.clipboard.writeText(url)
      toast.success('链接已复制')
    }

    const handlePageChange = (p: number) => {
      fetch(p)
    }

    onMounted(() => fetch(1))

    watch(status, () => {
      fetch(1)
    })

    const renderActions = () => (
      <div class="flex items-center gap-2">
        <HeaderActionButton
          variant="info"
          onClick={() => fetch(pagination.value.currentPage)}
          disabled={loading.value}
          icon={<RefreshIcon class={loading.value ? 'animate-spin' : ''} />}
          name="刷新"
        />
      </div>
    )

    watch([loading], () => setActions(renderActions()), { immediate: true })

    const isEmpty = computed(() => !loading.value && files.value.length === 0)

    return () => (
      <div class="flex h-full flex-col">
        <div class="mb-4 text-sm text-neutral-500">
          <p>
            读者通过评论编辑器上传之图片。pending 经 2h、detached 经 30min
            自动清理； 评论删除时同步级联清。此页用于审计与手动干预。
          </p>
        </div>

        <div class="mb-4 flex items-center gap-3">
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            状态筛选
          </span>
          <NSelect
            value={status.value}
            onUpdateValue={(v: StatusFilter) => {
              status.value = v
            }}
            options={statusOptions}
            size="small"
            style={{ width: '180px' }}
          />
          <span class="ml-auto text-sm text-neutral-500">
            共 {pagination.value.total} 条
          </span>
        </div>

        <div class="relative min-h-0 flex-1">
          {loading.value ? (
            <div class="flex h-64 items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : isEmpty.value ? (
            <div class="flex h-64 items-center justify-center">
              <NEmpty description="暂无评论图片" />
            </div>
          ) : (
            <NScrollbar class="h-full max-h-[calc(100vh-380px)]">
              <div class="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {files.value.map((file) => (
                  <CommentImageCard
                    key={file.id}
                    file={file}
                    onDelete={() => handleDelete(file)}
                    onCopy={() => handleCopy(file.fileUrl)}
                  />
                ))}
              </div>
            </NScrollbar>
          )}
        </div>

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

const CommentImageCard = defineComponent({
  props: {
    file: {
      type: Object as () => CommentUploadFile,
      required: true,
    },
  },
  emits: ['delete', 'copy'],
  setup(props, { emit }) {
    return () => (
      <div class="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div class="absolute right-2 top-2 z-10">
          <NTag
            type={statusTagType[props.file.status]}
            size="small"
            bordered={false}
          >
            {statusLabel[props.file.status]}
          </NTag>
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

        <div class="space-y-1 px-3 py-2 text-xs">
          <p class="truncate font-mono text-neutral-700 dark:text-neutral-300">
            {props.file.fileName}
          </p>
          <div class="flex items-center justify-between text-neutral-500">
            <span>{formatBytes(props.file.byteSize)}</span>
            <span class="font-mono">{props.file.mimeType ?? '—'}</span>
          </div>
          <div class="text-neutral-500">
            reader: {props.file.readerId ?? '—'}
          </div>
          <div class="text-neutral-500">
            {props.file.refType && props.file.refId
              ? `→ ${props.file.refType}/${props.file.refId}`
              : '未绑定'}
          </div>
          <div class="text-neutral-400">{formatDate(props.file.created)}</div>
        </div>

        <div class="flex border-t border-neutral-200 dark:border-neutral-800">
          <NTooltip>
            {{
              trigger: () => (
                <NButton
                  size="tiny"
                  quaternary
                  class="!flex-1 !rounded-none"
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
                  class="inline-flex flex-1 items-center justify-center border-l border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
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
                        class="!flex-1 !rounded-none border-l border-neutral-200 !text-red-500 hover:!bg-red-500/10 dark:border-neutral-800"
                      >
                        {{
                          icon: () => <TrashIcon class="size-3.5" />,
                        }}
                      </NButton>
                    ),
                    default: () => '硬删除（含 storage 对象）',
                  }}
                </NTooltip>
              ),
              default: () => `确定要删除 ${props.file.fileName} 吗？无法撤销。`,
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})
