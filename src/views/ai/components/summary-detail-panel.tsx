/**
 * AI Summary Detail Panel Component
 * AI 摘要详情面板 - 用于 MasterDetailLayout 右侧
 */
import { format } from 'date-fns'
import {
  ArrowLeft as ArrowLeftIcon,
  Calendar as CalendarIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  FileText as FileTextIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  Sparkles as SparklesIcon,
  StickyNote as StickyNoteIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NEmpty,
  NFlex,
  NInput,
  NPopconfirm,
  NScrollbar,
  NTooltip,
} from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import type { AISummary, ArticleInfo } from '~/api/ai'
import type { PropType } from 'vue'

import { aiApi } from '~/api/ai'

type ArticleRefType = ArticleInfo['type']

const RefTypeLabels: Record<ArticleRefType, string> = {
  Post: '文章',
  Note: '笔记',
  Page: '页面',
  Recently: '速记',
}

const RefTypeIcons: Record<ArticleRefType, typeof FileTextIcon> = {
  Post: FileTextIcon,
  Note: StickyNoteIcon,
  Page: FileTextIcon,
  Recently: FileTextIcon,
}

export const SummaryDetailPanel = defineComponent({
  name: 'SummaryDetailPanel',
  props: {
    articleId: {
      type: String as PropType<string | null>,
      required: true,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    onBack: {
      type: Function as PropType<() => void>,
    },
    onRefresh: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props) {
    const article = ref<{
      type: ArticleRefType
      document: { title: string }
    } | null>(null)
    const summaries = ref<AISummary[]>([])
    const loading = ref(false)

    const fetchData = async (refId: string) => {
      loading.value = true
      try {
        const data = await aiApi.getSummaryByRef(refId)
        article.value = data.article
        summaries.value = data.summaries
      } finally {
        loading.value = false
      }
    }

    watch(
      () => props.articleId,
      (id) => {
        if (id) {
          fetchData(id)
        } else {
          article.value = null
          summaries.value = []
        }
      },
      { immediate: true },
    )

    const handleDelete = async (id: string) => {
      await aiApi.deleteSummary(id)
      summaries.value = summaries.value.filter((s) => s.id !== id)
      toast.success('删除成功')
      props.onRefresh?.()
    }

    const handleGenerate = () => {
      if (!props.articleId) return

      const loadingRef = ref(false)
      const langRef = ref('zh')

      const $dialog = dialog.create({
        title: '生成 AI 摘要',
        content() {
          return (
            <NFlex vertical size="large">
              <div>
                <label class="mb-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  目标语言
                </label>
                <NInput
                  value={langRef.value}
                  onUpdateValue={(v) => (langRef.value = v)}
                  placeholder="zh, en, ja..."
                />
              </div>
              <div class="text-right">
                <NButton
                  type="primary"
                  loading={loadingRef.value}
                  onClick={() => {
                    if (!langRef.value) return
                    loadingRef.value = true
                    aiApi
                      .generateSummary({
                        refId: props.articleId!,
                        lang: langRef.value,
                      })
                      .then((res) => {
                        if (res) {
                          summaries.value.push(res)
                          toast.success('生成成功')
                        }
                        $dialog.destroy()
                        props.onRefresh?.()
                      })
                      .finally(() => {
                        loadingRef.value = false
                      })
                  }}
                >
                  <SparklesIcon class="mr-1.5 size-4" />
                  生成
                </NButton>
              </div>
            </NFlex>
          )
        },
      })
    }

    const handleEdit = (item: AISummary) => {
      const summaryRef = ref(item.summary)

      const $dialog = dialog.create({
        title: '编辑摘要',
        content() {
          return (
            <NFlex vertical size="large">
              <NInput
                value={summaryRef.value}
                onUpdateValue={(v) => (summaryRef.value = v)}
                type="textarea"
                rows={6}
                placeholder="摘要内容"
              />
              <div class="text-right">
                <NButton
                  type="primary"
                  onClick={() => {
                    if (!summaryRef.value) return
                    aiApi
                      .updateSummary(item.id, { summary: summaryRef.value })
                      .then(() => {
                        const idx = summaries.value.findIndex(
                          (s) => s.id === item.id,
                        )
                        if (idx !== -1) {
                          summaries.value[idx].summary = summaryRef.value
                        }
                        toast.success('保存成功')
                        $dialog.destroy()
                      })
                  }}
                >
                  保存
                </NButton>
              </div>
            </NFlex>
          )
        },
      })
    }

    const RefIcon = computed(() =>
      article.value ? RefTypeIcons[article.value.type] : FileTextIcon,
    )

    return () => (
      <div class="flex h-full flex-col bg-white dark:bg-black">
        {/* Header */}
        <div class="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {props.isMobile && props.onBack && (
              <button
                onClick={props.onBack}
                class="-ml-2 flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeftIcon class="h-5 w-5" />
              </button>
            )}
            <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              摘要详情
            </h2>
          </div>

          {article.value && (
            <NButton size="small" type="primary" onClick={handleGenerate}>
              {{
                icon: () => <PlusIcon class="size-4" />,
                default: () => '生成摘要',
              }}
            </NButton>
          )}
        </div>

        {/* Content */}
        <NScrollbar class="min-h-0 flex-1">
          {loading.value ? (
            <div class="flex h-full items-center justify-center">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : article.value ? (
            <div class="mx-auto max-w-3xl space-y-6 p-6">
              {/* Article Info */}
              <div>
                <RouterLink
                  to={`/${article.value.type.toLowerCase()}/edit?id=${props.articleId}`}
                  class="group inline-flex items-center gap-2 no-underline"
                >
                  <RefIcon.value class="size-5 shrink-0 text-neutral-400" />
                  <h3 class="text-lg font-semibold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400">
                    {article.value.document.title}
                  </h3>
                </RouterLink>
                <div class="mt-1.5 pl-7">
                  <span class="inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {RefTypeLabels[article.value.type]}
                  </span>
                </div>
              </div>

              <div class="h-px bg-neutral-100 dark:bg-neutral-800" />

              {/* Summaries */}
              <div>
                <h4 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  摘要列表
                  <span class="ml-1 text-xs text-neutral-400">
                    ({summaries.value.length})
                  </span>
                </h4>

                {summaries.value.length === 0 ? (
                  <NEmpty description="暂无摘要">
                    {{
                      extra: () => (
                        <NButton size="small" onClick={handleGenerate}>
                          生成摘要
                        </NButton>
                      ),
                    }}
                  </NEmpty>
                ) : (
                  <div>
                    {summaries.value.map((summary) => (
                      <SummaryItem
                        key={summary.id}
                        item={summary}
                        onEdit={() => handleEdit(summary)}
                        onDelete={() => handleDelete(summary.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </NScrollbar>
      </div>
    )
  },
})

const SummaryItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<AISummary>,
      required: true,
    },
    onEdit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const expanded = ref(false)
    const shouldShowExpand = computed(
      () =>
        props.item.summary.length > 150 || props.item.summary.includes('\n'),
    )

    return () => (
      <div class="group border-b border-neutral-100 py-4 last:border-b-0 dark:border-neutral-800">
        {/* Header */}
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              {props.item.lang.toUpperCase()}
            </span>
            <span class="flex items-center gap-1 text-xs text-neutral-400">
              <CalendarIcon class="size-3" />
              <time datetime={props.item.created}>
                {format(new Date(props.item.created), 'yyyy-MM-dd HH:mm')}
              </time>
            </span>
          </div>

          <div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <NTooltip>
              {{
                trigger: () => (
                  <button
                    class="flex size-7 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    onClick={props.onEdit}
                  >
                    <PencilIcon class="size-3.5" />
                  </button>
                ),
                default: () => '编辑',
              }}
            </NTooltip>

            <NPopconfirm
              positiveText="取消"
              negativeText="删除"
              onNegativeClick={props.onDelete}
            >
              {{
                trigger: () => (
                  <NTooltip>
                    {{
                      trigger: () => (
                        <button class="flex size-7 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950 dark:hover:text-red-400">
                          <TrashIcon class="size-3.5" />
                        </button>
                      ),
                      default: () => '删除',
                    }}
                  </NTooltip>
                ),
                default: () => '确定要删除这条摘要吗？',
              }}
            </NPopconfirm>
          </div>
        </div>

        {/* Content */}
        <p
          class={[
            'm-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700 dark:text-neutral-300',
            !expanded.value && shouldShowExpand.value ? 'line-clamp-3' : '',
          ]}
        >
          {props.item.summary}
        </p>

        {shouldShowExpand.value && (
          <button
            class="mt-2 flex items-center text-xs text-neutral-500 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => (expanded.value = !expanded.value)}
          >
            {expanded.value ? (
              <>
                <ChevronUpIcon class="mr-1 size-3" />
                收起
              </>
            ) : (
              <>
                <ChevronDownIcon class="mr-1 size-3" />
                展开
              </>
            )}
          </button>
        )}
      </div>
    )
  },
})

export const SummaryDetailEmptyState = defineComponent({
  name: 'SummaryDetailEmptyState',
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <SparklesIcon class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          选择一篇文章
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择文章查看 AI 摘要
        </p>
      </div>
    )
  },
})
