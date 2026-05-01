import {
  File as FileIcon,
  FileText as FileTextIcon,
  Search as SearchIcon,
  StickyNote as StickyNoteIcon,
  Telescope as TelescopeIcon,
  X as XIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCheckbox,
  NInput,
  NModal,
  NScrollbar,
  NSelect,
  NSpin,
} from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { PropType } from 'vue'

import { debouncedRef } from '@vueuse/core'

import { aiApi, AITaskType } from '~/api/ai'
import { notesApi } from '~/api/notes'
import { pagesApi } from '~/api/pages'
import { postsApi } from '~/api/posts'
import { searchApi } from '~/api/search'
import { useAiTaskQueue } from '~/components/ai-task-queue'

type ArticleRefType = 'Post' | 'Note' | 'Page'

interface SelectableArticle {
  id: string
  title: string
  type: ArticleRefType
  selected: boolean
}

const RefTypeLabels: Record<ArticleRefType, string> = {
  Post: '文章',
  Note: '手记',
  Page: '页面',
}

const RefTypeIcons: Record<ArticleRefType, typeof FileTextIcon> = {
  Post: FileTextIcon,
  Note: StickyNoteIcon,
  Page: FileIcon,
}

const typeFilterOptions = [
  { label: '全部类型', value: 'all' },
  { label: '文章', value: 'Post' },
  { label: '手记', value: 'Note' },
  { label: '页面', value: 'Page' },
]

export const InsightsArticleSelectorModal = defineComponent({
  name: 'InsightsArticleSelectorModal',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onSuccess: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props) {
    const taskQueue = useAiTaskQueue()

    const loading = ref(false)
    const generating = ref(false)
    const articles = ref<SelectableArticle[]>([])
    const searchQuery = ref('')
    const debouncedSearch = debouncedRef(searchQuery, 300)
    const typeFilter = ref<string>('all')

    const selectedIds = ref<Set<string>>(new Set())

    const unwrapResponse = (res: unknown): { id: string; title: string }[] => {
      return Array.isArray(res) ? res : ((res as any)?.data ?? [])
    }

    const toSelectableArticles = (
      items: { id: string; title: string }[],
      type: ArticleRefType,
    ): SelectableArticle[] =>
      items.map((item) => ({
        id: item.id,
        title: item.title,
        type,
        selected: selectedIds.value.has(item.id),
      }))

    const fetchArticles = async (keyword?: string) => {
      loading.value = true
      try {
        const shouldFetchPosts =
          typeFilter.value === 'all' || typeFilter.value === 'Post'
        const shouldFetchNotes =
          typeFilter.value === 'all' || typeFilter.value === 'Note'
        const shouldFetchPages =
          typeFilter.value === 'all' || typeFilter.value === 'Page'

        const hasKeyword = keyword && keyword.trim()

        const [postsRes, notesRes, pagesRes] = await Promise.all([
          shouldFetchPosts
            ? hasKeyword
              ? searchApi.searchPosts({ keyword, size: 50 })
              : postsApi.getList({ size: 50, select: 'title' })
            : Promise.resolve({ data: [] }),
          shouldFetchNotes
            ? hasKeyword
              ? searchApi.searchNotes({ keyword, size: 50 })
              : notesApi.getList({ size: 50, select: 'title' })
            : Promise.resolve({ data: [] }),
          shouldFetchPages
            ? pagesApi.getList({ select: 'title' })
            : Promise.resolve({ data: [] }),
        ])

        const posts = toSelectableArticles(unwrapResponse(postsRes), 'Post')
        const notes = toSelectableArticles(unwrapResponse(notesRes), 'Note')

        let pages = unwrapResponse(pagesRes)
        if (hasKeyword) {
          const lowerKeyword = keyword.toLowerCase()
          pages = pages.filter((page) =>
            page.title.toLowerCase().includes(lowerKeyword),
          )
        }
        const pageArticles = toSelectableArticles(pages, 'Page')

        articles.value = [...posts, ...notes, ...pageArticles]
      } finally {
        loading.value = false
      }
    }

    watch(
      () => props.show,
      (show) => {
        if (show) {
          selectedIds.value.clear()
          searchQuery.value = ''
          typeFilter.value = 'all'
          fetchArticles()
        }
      },
    )

    watch(debouncedSearch, (keyword) => {
      fetchArticles(keyword)
    })

    watch(typeFilter, () => {
      fetchArticles(debouncedSearch.value)
    })

    const selectedCount = computed(() => selectedIds.value.size)

    const isAllSelected = computed(() => {
      return (
        articles.value.length > 0 &&
        articles.value.every((a) => selectedIds.value.has(a.id))
      )
    })

    const toggleArticle = (article: SelectableArticle) => {
      if (selectedIds.value.has(article.id)) {
        selectedIds.value.delete(article.id)
        article.selected = false
      } else {
        selectedIds.value.add(article.id)
        article.selected = true
      }
    }

    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        articles.value.forEach((article) => {
          selectedIds.value.delete(article.id)
          article.selected = false
        })
      } else {
        articles.value.forEach((article) => {
          selectedIds.value.add(article.id)
          article.selected = true
        })
      }
    }

    const clearSelection = () => {
      selectedIds.value.clear()
      articles.value.forEach((article) => {
        article.selected = false
      })
    }

    const handleGenerateBatch = async () => {
      if (selectedIds.value.size === 0) {
        toast.warning('请至少选择一篇文章')
        return
      }

      generating.value = true

      const refIds = Array.from(selectedIds.value)
      const articleMap = new Map(articles.value.map((a) => [a.id, a]))

      try {
        const results = await Promise.allSettled(
          refIds.map(async (refId) => {
            const taskPayload = { refId }
            const res = await aiApi.createInsightsTask(taskPayload)
            const article = articleMap.get(refId)
            if (res.created) {
              taskQueue.trackTask({
                taskId: res.taskId,
                type: AITaskType.Insights,
                label: `精读: ${article?.title || refId}`,
                onComplete: () => {
                  props.onSuccess?.()
                },
                retryFn: () => aiApi.createInsightsTask(taskPayload),
              })
            }
            return res
          }),
        )

        const created = results.filter(
          (r) => r.status === 'fulfilled' && r.value.created,
        ).length
        const existed = results.filter(
          (r) => r.status === 'fulfilled' && !r.value.created,
        ).length
        const failed = results.filter((r) => r.status === 'rejected').length

        if (created > 0) {
          toast.success(`已创建 ${created} 个精读任务`)
        }
        if (existed > 0) {
          toast.info(`${existed} 个任务已存在`)
        }
        if (failed > 0) {
          toast.error(`${failed} 个任务提交失败`)
        }

        props.onClose()
      } finally {
        generating.value = false
      }
    }

    const RefIcon = (type: ArticleRefType) => RefTypeIcons[type]

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={(show) => {
          if (!show && !generating.value) props.onClose()
        }}
        closeOnEsc={!generating.value}
        maskClosable={!generating.value}
        transformOrigin="center"
      >
        <div
          class="flex h-[600px] w-[700px] max-w-[90vw] flex-col rounded-xl bg-white shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div class="flex items-center gap-2">
              <TelescopeIcon class="size-5 text-neutral-500" />
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                批量生成 AI 精读
              </h2>
            </div>
            <button
              type="button"
              class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50 dark:hover:bg-neutral-800"
              onClick={props.onClose}
              disabled={generating.value}
              aria-label="关闭"
            >
              <XIcon class="size-5" />
            </button>
          </div>

          <div class="flex flex-shrink-0 items-center gap-3 border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
            <NInput
              value={searchQuery.value}
              onUpdateValue={(val) => (searchQuery.value = val)}
              placeholder="搜索文章..."
              clearable
              disabled={generating.value}
            >
              {{
                prefix: () => <SearchIcon class="size-4 text-neutral-400" />,
              }}
            </NInput>
            <NSelect
              value={typeFilter.value}
              onUpdateValue={(val) => (typeFilter.value = val)}
              options={typeFilterOptions}
              style={{ width: '120px' }}
              disabled={generating.value}
            />
          </div>

          <div class="flex flex-shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-2 dark:border-neutral-800/50">
            <div class="flex items-center gap-3">
              <NCheckbox
                checked={isAllSelected.value}
                indeterminate={selectedCount.value > 0 && !isAllSelected.value}
                onUpdateChecked={toggleSelectAll}
                disabled={generating.value || articles.value.length === 0}
              >
                全选当前列表
              </NCheckbox>
              {selectedCount.value > 0 && (
                <span class="text-sm text-neutral-500">
                  已选 {selectedCount.value} 篇
                </span>
              )}
            </div>
            {selectedCount.value > 0 && (
              <button
                class="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                onClick={clearSelection}
                disabled={generating.value}
              >
                清除选择
              </button>
            )}
          </div>

          <div class="min-h-0 flex-1">
            {loading.value ? (
              <div class="flex h-full items-center justify-center">
                <NSpin size="medium" />
              </div>
            ) : articles.value.length === 0 ? (
              <div class="flex h-full flex-col items-center justify-center text-neutral-400">
                <FileTextIcon class="mb-2 size-10" />
                <p>没有找到文章</p>
              </div>
            ) : (
              <NScrollbar class="h-full">
                <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {articles.value.map((article) => {
                    const Icon = RefIcon(article.type)
                    return (
                      <div
                        key={article.id}
                        class={[
                          'flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors',
                          selectedIds.value.has(article.id)
                            ? 'bg-neutral-100 dark:bg-neutral-800'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
                          generating.value && 'pointer-events-none opacity-60',
                        ]}
                        onClick={() =>
                          !generating.value && toggleArticle(article)
                        }
                      >
                        <NCheckbox
                          checked={selectedIds.value.has(article.id)}
                          disabled={generating.value}
                        />
                        <Icon class="size-4 shrink-0 text-neutral-400" />
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {article.title}
                          </p>
                        </div>
                        <span class="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                          {RefTypeLabels[article.type]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </NScrollbar>
            )}
          </div>

          <div class="flex flex-shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <NButton
              size="small"
              onClick={props.onClose}
              disabled={generating.value}
            >
              取消
            </NButton>
            <NButton
              size="small"
              type="primary"
              onClick={handleGenerateBatch}
              disabled={selectedCount.value === 0 || generating.value}
              loading={generating.value}
            >
              {{
                icon: () => <TelescopeIcon class="size-4" />,
                default: () => `生成精读 (${selectedCount.value})`,
              }}
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})
