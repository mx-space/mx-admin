import {
  Archive as ArchiveIcon,
  Copy,
  ExternalLink,
  File as FileIcon,
  Image as ImageIcon,
  Smile,
  Trash2,
  Upload as UploadIcon,
  User,
} from 'lucide-vue-next'
import {
  NButton,
  NCard,
  NEmpty,
  NIcon,
  NImage,
  NModal,
  NPopconfirm,
  NScrollbar,
  NSpin,
  NTabPane,
  NTabs,
  NText,
  NTooltip,
  NUpload,
  NUploadDragger,
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { UploadFileInfo } from 'naive-ui'

import { filesApi } from '~/api'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { API_URL } from '~/constants/env'
import { useLayout } from '~/layouts/content'
import { getToken } from '~/utils'

type FileType = 'file' | 'icon' | 'image' | 'avatar'

interface FileTypeConfig {
  key: FileType
  label: string
  icon: typeof FileIcon
  acceptImage: boolean
}

const FILE_TYPE_CONFIGS: FileTypeConfig[] = [
  { key: 'icon', label: '图标', icon: Smile, acceptImage: true },
  { key: 'avatar', label: '头像', icon: User, acceptImage: true },
  { key: 'image', label: '图片', icon: ImageIcon, acceptImage: true },
  { key: 'file', label: '文件', icon: FileIcon, acceptImage: false },
]

export default defineComponent({
  setup() {
    const type = ref<FileType>('icon')
    const list = ref<{ url: string; name: string; created?: number }[]>([])
    const loading = ref(false)
    const modalShow = ref(false)

    const currentConfig = computed(
      () =>
        FILE_TYPE_CONFIGS.find((c) => c.key === type.value) ||
        FILE_TYPE_CONFIGS[0],
    )

    const fetch = async () => {
      loading.value = true
      try {
        const data = await filesApi.getByType(type.value)
        list.value = data
      } finally {
        loading.value = false
      }
    }

    watch(() => type.value, fetch)
    onMounted(fetch)

    const checkUploadFile = async (data: {
      file: UploadFileInfo
      fileList: UploadFileInfo[]
    }) => {
      if (currentConfig.value.acceptImage) {
        if (!data.file.file?.type.startsWith('image')) {
          toast.error('该分类只能上传图片文件')
          return false
        }
      }
      return true
    }

    const handleFinish = ({
      file,
      event,
    }: {
      file: UploadFileInfo
      event?: ProgressEvent
    }) => {
      const xhr = event?.target as XMLHttpRequest
      const { url, name } = JSON.parse(xhr.responseText)

      file.name = name
      file.url = url

      list.value.unshift({ url, name })
      return file
    }

    const handleDelete = async (name: string) => {
      await filesApi.deleteByTypeAndName(type.value, name)
      toast.success('删除成功')
      list.value = list.value.filter((item) => item.name !== name)
    }

    const handleCopyUrl = async (url: string) => {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('已复制到剪贴板')
      } catch {
        toast.error('复制失败')
      }
    }

    const { setActions } = useLayout()
    setActions(
      <HeaderActionButton
        variant="info"
        onClick={() => {
          modalShow.value = true
        }}
        icon={<UploadIcon />}
        name="上传文件"
      />,
    )

    const isImageType = computed(() =>
      ['icon', 'avatar', 'image'].includes(type.value),
    )

    return () => (
      <div class="flex h-full flex-col">
        <NTabs
          value={type.value}
          onUpdateValue={(val) => {
            type.value = val
          }}
          type="line"
          class="mb-4"
        >
          {FILE_TYPE_CONFIGS.map((config) => (
            <NTabPane
              key={config.key}
              name={config.key}
              tab={() => (
                <div class="flex items-center gap-2">
                  <config.icon class="size-4" />
                  <span>{config.label}</span>
                </div>
              )}
            />
          ))}
        </NTabs>

        <div class="relative min-h-0 flex-1">
          {loading.value ? (
            <div class="flex h-64 items-center justify-center">
              <NSpin size="large" />
            </div>
          ) : list.value.length === 0 ? (
            <div class="flex h-64 items-center justify-center">
              <NEmpty description="暂无文件">
                {{
                  extra: () => (
                    <NButton
                      size="small"
                      onClick={() => {
                        modalShow.value = true
                      }}
                    >
                      上传文件
                    </NButton>
                  ),
                }}
              </NEmpty>
            </div>
          ) : (
            <NScrollbar class="h-full max-h-[calc(100vh-220px)]">
              {isImageType.value ? (
                <div class="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {list.value.map((item) => (
                    <FileCard
                      key={item.name}
                      item={item}
                      isImage={true}
                      onDelete={() => handleDelete(item.name)}
                      onCopy={() => handleCopyUrl(item.url)}
                    />
                  ))}
                </div>
              ) : (
                <div class="flex flex-col gap-2 p-1">
                  {list.value.map((item) => (
                    <FileListItem
                      key={item.name}
                      item={item}
                      onDelete={() => handleDelete(item.name)}
                      onCopy={() => handleCopyUrl(item.url)}
                    />
                  ))}
                </div>
              )}
            </NScrollbar>
          )}
        </div>

        <NModal
          closable
          closeOnEsc
          show={modalShow.value}
          onUpdateShow={(s) => {
            modalShow.value = s
          }}
        >
          <NCard
            title={`上传${currentConfig.value.label}`}
            class="w-full max-w-lg"
            closable
            onClose={() => {
              modalShow.value = false
            }}
          >
            <NUpload
              class="flex w-full flex-col items-center"
              headers={{
                authorization: getToken() || '',
              }}
              action={`${API_URL}/files/upload?type=${type.value}`}
              directory-dnd
              multiple
              accept={currentConfig.value.acceptImage ? 'image/*' : undefined}
              onBeforeUpload={checkUploadFile}
              onFinish={handleFinish}
              onError={(e) => {
                const xhr = e.event?.target as XMLHttpRequest
                e.file.status = 'error'
                if (!xhr) {
                  toast.warning('网络异常')
                  return e.file
                }
                const { message: errMessage } = JSON.parse(xhr.responseText)
                toast.warning(errMessage)
                return e.file
              }}
            >
              <NUploadDragger class="m-auto flex w-full flex-col items-center justify-center py-16">
                <NIcon size="48" depth="3">
                  <ArchiveIcon />
                </NIcon>
                <NText class="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                  点击或拖动文件到该区域来上传
                </NText>
                {currentConfig.value.acceptImage && (
                  <NText class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    仅支持图片格式
                  </NText>
                )}
              </NUploadDragger>
            </NUpload>
          </NCard>
        </NModal>
      </div>
    )
  },
})

const FileCard = defineComponent({
  props: {
    item: {
      type: Object as () => { url: string; name: string },
      required: true,
    },
    isImage: Boolean,
  },
  emits: ['delete', 'copy'],
  setup(props, { emit }) {
    return () => (
      <div class="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
        <div class="aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-800/50">
          <NImage
            src={props.item.url}
            objectFit="cover"
            class="size-full"
            showToolbar={false}
            imgProps={{
              class: 'size-full object-cover',
            }}
          />
        </div>

        <div class="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 pt-8 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <p class="mb-2 truncate text-xs text-white/90">{props.item.name}</p>
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
                    href={props.item.url}
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
                            icon: () => <Trash2 class="size-3.5" />,
                          }}
                        </NButton>
                      ),
                      default: () => '删除',
                    }}
                  </NTooltip>
                ),
                default: () => `确定要删除 ${props.item.name} 吗？`,
              }}
            </NPopconfirm>
          </div>
        </div>
      </div>
    )
  },
})

const FileListItem = defineComponent({
  props: {
    item: {
      type: Object as () => { url: string; name: string },
      required: true,
    },
  },
  emits: ['delete', 'copy'],
  setup(props, { emit }) {
    return () => (
      <div class="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <FileIcon class="size-5 text-neutral-500" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {props.item.name}
          </p>
          <a
            href={props.item.url}
            target="_blank"
            rel="noreferrer"
            class="truncate text-xs text-neutral-500 hover:text-blue-500 dark:text-neutral-400"
          >
            {props.item.url}
          </a>
        </div>

        <div class="flex shrink-0 gap-1">
          <NTooltip>
            {{
              trigger: () => (
                <NButton size="tiny" quaternary onClick={() => emit('copy')}>
                  {{
                    icon: () => (
                      <Copy class="size-4 text-neutral-500 dark:text-neutral-400" />
                    ),
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
                  href={props.item.url}
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex size-6 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <ExternalLink class="size-4" />
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
                      <NButton size="tiny" quaternary type="error">
                        {{
                          icon: () => <Trash2 class="size-4" />,
                        }}
                      </NButton>
                    ),
                    default: () => '删除',
                  }}
                </NTooltip>
              ),
              default: () => `确定要删除 ${props.item.name} 吗？`,
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})
