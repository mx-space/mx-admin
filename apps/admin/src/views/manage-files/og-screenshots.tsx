import {
  Camera,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
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
import { computed, defineComponent, ref } from 'vue'
import { toast } from 'vue-sonner'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { enrichmentApi } from '~/api/enrichment'
import { queryKeys } from '~/hooks/queries/keys'

import { formatBytes } from '../enrichment/utils'

const PAGE_SIZE = 24

export const OgScreenshotsTab = defineComponent({
  name: 'OgScreenshotsTab',
  setup() {
    const page = ref(1)
    const queryClient = useQueryClient()

    const params = computed(() => ({
      page: page.value,
      size: PAGE_SIZE,
      sort: 'last_accessed' as const,
      order: 'desc' as const,
    }))

    const { data, isPending, isFetching } = useQuery({
      queryKey: computed(() =>
        queryKeys.enrichment.screenshots.list(params.value),
      ),
      queryFn: () => enrichmentApi.screenshots.list(params.value),
      placeholderData: (prev) => prev,
      staleTime: 30_000,
    })

    const rows = computed(() => data.value?.data ?? [])
    const pageCount = computed(() => data.value?.pagination.totalPage ?? 1)
    const total = computed(() => data.value?.pagination.total ?? 0)

    const invalidate = () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.enrichment.screenshots.all(),
      })

    const deleteMutation = useMutation({
      mutationFn: (enrichmentId: string) =>
        enrichmentApi.screenshots.delete(enrichmentId),
      onSuccess: () => {
        toast.success('截图已删除')
        invalidate()
      },
      onError: (err) => toast.error(`删除失败：${(err as Error).message}`),
    })

    const recaptureMutation = useMutation({
      mutationFn: (enrichmentId: string) =>
        enrichmentApi.screenshots.recapture(enrichmentId),
      onSuccess: () => {
        toast.success('重新抓取成功')
        invalidate()
      },
      onError: (err) => toast.error(`重新抓取失败：${(err as Error).message}`),
    })

    const handleCopy = async (url: string) => {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('已复制截图链接')
      } catch {
        toast.error('复制失败')
      }
    }

    return () => {
      if (isPending.value) {
        return (
          <div class="flex h-64 items-center justify-center">
            <NSpin size="large" />
          </div>
        )
      }
      if (rows.value.length === 0) {
        return (
          <div class="flex h-64 items-center justify-center">
            <NEmpty description="尚无抓取截图" />
          </div>
        )
      }
      return (
        <div class="flex h-full min-h-0 flex-col gap-3">
          <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span class="tabular-nums">共 {total.value} 张</span>
            {isFetching.value && <span class="text-neutral-400">加载中…</span>}
          </div>
          <NScrollbar class="min-h-0 flex-1">
            <div class="grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {rows.value.map((row) => (
                <ScreenshotCard
                  key={row.enrichmentId}
                  row={row}
                  onCopy={() => handleCopy(row.publicUrl)}
                  onDelete={() => deleteMutation.mutate(row.enrichmentId)}
                  onRecapture={() => recaptureMutation.mutate(row.enrichmentId)}
                  recapturing={
                    recaptureMutation.isPending.value &&
                    recaptureMutation.variables.value === row.enrichmentId
                  }
                />
              ))}
            </div>
          </NScrollbar>
          <div class="flex justify-center pt-2">
            <NPagination
              page={page.value}
              pageCount={pageCount.value}
              onUpdatePage={(p) => (page.value = p)}
              showSizePicker={false}
            />
          </div>
        </div>
      )
    }
  },
})

const ScreenshotCard = defineComponent({
  name: 'OgScreenshotCard',
  props: {
    row: {
      type: Object as () => import('~/models/enrichment').EnrichmentScreenshotJoinedRow,
      required: true,
    },
    recapturing: Boolean,
  },
  emits: ['copy', 'delete', 'recapture'],
  setup(props, { emit }) {
    const errored = ref(false)
    return () => {
      const { row } = props
      const hasImage = !!row.publicUrl && !errored.value
      return (
        <div class="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
          <div class="aspect-video overflow-hidden bg-neutral-50 dark:bg-neutral-800/50">
            {hasImage ? (
              <NImage
                src={row.publicUrl}
                objectFit="cover"
                class="size-full"
                showToolbar={false}
                imgProps={{
                  class: 'size-full object-cover',
                  loading: 'lazy',
                  onError: () => (errored.value = true),
                }}
              />
            ) : (
              <div class="flex size-full items-center justify-center">
                <ImageIcon class="size-8 text-neutral-300 dark:text-neutral-600" />
              </div>
            )}
          </div>

          <div class="flex flex-col gap-0.5 px-2 py-1.5">
            <span
              class="line-clamp-1 text-xs font-medium text-neutral-800 dark:text-neutral-200"
              title={row.title || row.url}
            >
              {row.title || row.url}
            </span>
            <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span class="tabular-nums">
                {row.width}×{row.height}
              </span>
              <span class="tabular-nums">{formatBytes(row.bytes)}</span>
            </div>
          </div>

          <div class="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 pt-8 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <p class="mb-2 truncate text-xs text-white/90">{row.url}</p>
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
                      {{ icon: () => <Copy class="size-3.5" /> }}
                    </NButton>
                  ),
                  default: () => '复制截图链接',
                }}
              </NTooltip>
              <NTooltip>
                {{
                  trigger: () => (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      class="inline-flex size-6 items-center justify-center rounded text-white hover:bg-white/20"
                    >
                      <ExternalLink class="size-3.5" />
                    </a>
                  ),
                  default: () => '访问原页面',
                }}
              </NTooltip>
              <NPopconfirm onPositiveClick={() => emit('recapture')}>
                {{
                  trigger: () => (
                    <NTooltip>
                      {{
                        trigger: () => (
                          <NButton
                            size="tiny"
                            quaternary
                            loading={props.recapturing}
                            class="!text-white hover:!bg-white/20"
                          >
                            {{
                              icon: () => <RefreshCw class="size-3.5" />,
                            }}
                          </NButton>
                        ),
                        default: () => '重新抓取',
                      }}
                    </NTooltip>
                  ),
                  default: () =>
                    '重新抓取将打开无头浏览器请求页面并覆盖现有截图，确定吗？',
                }}
              </NPopconfirm>
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
                            {{ icon: () => <Trash2 class="size-3.5" /> }}
                          </NButton>
                        ),
                        default: () => '删除截图',
                      }}
                    </NTooltip>
                  ),
                  default: () =>
                    `确定要删除 "${row.title || row.url}" 的截图吗？`,
                }}
              </NPopconfirm>
            </div>
          </div>
        </div>
      )
    }
  },
})

export const OG_SCREENSHOT_TAB_KEY = 'og-screenshot'
export const OG_SCREENSHOT_TAB_ICON = Camera
export const OG_SCREENSHOT_TAB_LABEL = 'OG 截图'
