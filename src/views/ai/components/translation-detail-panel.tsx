import { format } from 'date-fns'
import {
  ArrowLeft as ArrowLeftIcon,
  Bot as BotIcon,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  Languages as LanguagesIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  RotateCw as RotateCwIcon,
  Save as SaveIcon,
  StickyNote as StickyNoteIcon,
  Trash2 as TrashIcon,
  X as XIcon,
} from 'lucide-vue-next'
import { NButton, NEmpty, NInput, NPopconfirm, NScrollbar } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import type { AITranslation, ArticleInfo } from '~/api/ai'
import type { PropType } from 'vue'

import { aiApi, AITaskType } from '~/api/ai'
import { useAiTaskQueue } from '~/components/ai-task-queue'
import { SplitPanelEmptyState, SplitPanelLayout } from '~/components/layout'
import { MarkdownRender } from '~/components/markdown/markdown-render'

type ArticleRefType = ArticleInfo['type']

const RefTypeIcons: Record<ArticleRefType, typeof FileTextIcon> = {
  Post: FileTextIcon,
  Note: StickyNoteIcon,
  Page: FileTextIcon,
  Recently: FileTextIcon,
}

type ActivePanel = { type: 'edit'; translation: AITranslation } | null

export const TranslationDetailPanel = defineComponent({
  name: 'TranslationDetailPanel',
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
    onOptimisticUpdate: {
      type: Function as PropType<
        (
          update:
            | {
                type: 'upsert'
                article: ArticleInfo
                translations: AITranslation[]
              }
            | {
                type: 'remove'
                articleId: string
                translationId: string
                lang: string
              },
        ) => void
      >,
    },
  },
  setup(props) {
    const taskQueue = useAiTaskQueue()

    const article = ref<{
      type: ArticleRefType
      document: { title: string }
    } | null>(null)
    const translations = ref<AITranslation[]>([])
    const loading = ref(false)
    const regenerationLoadingMap = ref<Record<string, boolean>>({})
    const activePanel = ref<ActivePanel>(null)

    const setActivePanel = (panel: ActivePanel) => {
      activePanel.value = panel
    }

    const fetchData = async (refId: string) => {
      loading.value = true
      try {
        const data = await aiApi.getTranslationsByRef(refId)
        article.value = data.article
        translations.value = data.translations
      } finally {
        loading.value = false
      }
    }

    watch(
      () => props.articleId,
      (id) => {
        if (id) {
          fetchData(id)
          activePanel.value = null
        } else {
          article.value = null
          translations.value = []
          activePanel.value = null
        }
      },
      { immediate: true },
    )

    const handleDelete = async (id: string) => {
      const removed = translations.value.find((t) => t.id === id)
      await aiApi.deleteTranslation(id)
      translations.value = translations.value.filter((t) => t.id !== id)
      toast.success('删除成功')
      if (props.articleId && removed) {
        props.onOptimisticUpdate?.({
          type: 'remove',
          articleId: props.articleId,
          translationId: removed.id,
          lang: removed.lang,
        })
      }
      if (
        activePanel.value?.type === 'edit' &&
        activePanel.value.translation.id === id
      ) {
        activePanel.value = null
      }
    }

    const handleGenerate = () => {
      if (!props.articleId) return

      const loadingRef = ref(false)
      const langsRef = ref('')

      const $dialog = dialog.create({
        title: '生成 AI 翻译',
        content() {
          return (
            <div class="flex flex-col gap-4">
              <form
                onSubmit={(e) => e.preventDefault()}
                class="flex flex-col gap-2"
              >
                <label class="mb-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  目标语言（多个语言用逗号分隔，留空使用默认配置）
                </label>
                <NInput
                  value={langsRef.value}
                  onUpdateValue={(v) => (langsRef.value = v)}
                  placeholder="如：en, ja, ko 或留空"
                />
                <div class="text-right">
                  <NButton
                    attrType="submit"
                    size="small"
                    type="primary"
                    loading={loadingRef.value}
                    onClick={() => {
                      loadingRef.value = true
                      const targetLanguages = langsRef.value
                        .split(',')
                        .map((l) => l.trim().toLowerCase())
                        .filter((l) => l.length === 2)

                      const taskPayload = {
                        refId: props.articleId!,
                        targetLanguages:
                          targetLanguages.length > 0
                            ? targetLanguages
                            : undefined,
                      }
                      aiApi
                        .createTranslationTask(taskPayload)
                        .then((res) => {
                          if (res.created) {
                            taskQueue.trackTask({
                              taskId: res.taskId,
                              type: AITaskType.Translation,
                              label: `翻译: ${article.value?.document.title || '文章'}`,
                              onComplete: () => {
                                fetchData(props.articleId!)
                              },
                              retryFn: () =>
                                aiApi.createTranslationTask(taskPayload),
                            })
                            toast.success('已创建翻译任务')
                          } else {
                            toast.info('任务已存在，正在处理中')
                          }
                          $dialog.destroy()
                        })
                        .catch(() => {
                          loadingRef.value = false
                        })
                        .finally(() => {
                          loadingRef.value = false
                        })
                    }}
                  >
                    生成
                  </NButton>
                </div>
              </form>
            </div>
          )
        },
      })
    }

    const handleEdit = (item: AITranslation) => {
      setActivePanel({ type: 'edit', translation: item })
    }

    const handleSaveEdit = (
      id: string,
      updates: { title: string; text: string; summary?: string },
    ) => {
      const idx = translations.value.findIndex((t) => t.id === id)
      if (idx !== -1) {
        translations.value[idx].title = updates.title
        translations.value[idx].text = updates.text
        translations.value[idx].summary = updates.summary
      }
    }

    const handleRegeneration = async (item: AITranslation) => {
      if (regenerationLoadingMap.value[item.id]) return
      regenerationLoadingMap.value[item.id] = true
      try {
        const taskPayload = {
          refId: item.refId,
          targetLanguages: [item.lang],
        }
        const res = await aiApi.createTranslationTask(taskPayload)

        if (res.created) {
          taskQueue.trackTask({
            taskId: res.taskId,
            type: AITaskType.Translation,
            label: `翻译 (${item.lang.toUpperCase()}): ${article.value?.document.title || '文章'}`,
            onComplete: () => {
              fetchData(props.articleId!)
            },
            retryFn: () => aiApi.createTranslationTask(taskPayload),
          })
          toast.success(`已创建 ${item.lang.toUpperCase()} 翻译任务`)
        } else {
          toast.info('任务已存在，正在处理中')
        }
      } finally {
        regenerationLoadingMap.value[item.id] = false
      }
    }

    const RefIcon = computed(() =>
      article.value ? RefTypeIcons[article.value.type] : FileTextIcon,
    )

    const hasPanel = computed(() => activePanel.value !== null)

    // 左侧内容：文章信息 + 翻译列表
    const ListContent = () => (
      <div class="flex h-full flex-col">
        <div class="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {props.isMobile && props.onBack && (
              <button
                onClick={props.onBack}
                class="-ml-2 flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeftIcon class="size-5" />
              </button>
            )}
            <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              翻译详情
            </h2>
          </div>

          {article.value && (
            <NButton size="small" type="primary" onClick={handleGenerate}>
              {{
                icon: () => <PlusIcon class="size-4" />,
                default: () => '生成翻译',
              }}
            </NButton>
          )}
        </div>

        <NScrollbar class="min-h-0 flex-1">
          {loading.value ? (
            <div class="flex h-full items-center justify-center">
              <div class="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : article.value ? (
            <div class="space-y-4 p-4">
              <div>
                <RouterLink
                  to={`/${article.value.type.toLowerCase()}/edit?id=${props.articleId}`}
                  class="group inline-flex items-center gap-2 no-underline"
                >
                  <RefIcon.value class="size-5 shrink-0 text-neutral-400" />
                  <h3 class="text-base font-semibold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400">
                    {article.value.document.title}
                  </h3>
                </RouterLink>
              </div>

              <div class="h-px bg-neutral-100 dark:bg-neutral-800" />

              <div>
                <h4 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  翻译列表
                  <span class="ml-1 text-xs text-neutral-400">
                    ({translations.value.length})
                  </span>
                </h4>

                {translations.value.length === 0 ? (
                  <NEmpty description="暂无翻译">
                    {{
                      extra: () => (
                        <NButton size="small" onClick={handleGenerate}>
                          生成翻译
                        </NButton>
                      ),
                    }}
                  </NEmpty>
                ) : (
                  <div class="-mx-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {translations.value.map((translation) => (
                      <TranslationListItem
                        key={translation.id}
                        item={translation}
                        selected={
                          activePanel.value?.type === 'edit' &&
                          activePanel.value.translation.id === translation.id
                        }
                        onEdit={() => handleEdit(translation)}
                        onRegeneration={() => handleRegeneration(translation)}
                        regenerationLoading={
                          !!regenerationLoadingMap.value[translation.id]
                        }
                        onDelete={() => handleDelete(translation.id)}
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

    // 右侧面板内容
    const PanelContent = () => {
      if (activePanel.value?.type === 'edit') {
        return (
          <TranslationEditPanel
            translation={activePanel.value.translation}
            onSave={handleSaveEdit}
            onClose={() => setActivePanel(null)}
          />
        )
      }
      return null
    }

    return () => (
      <SplitPanelLayout showPanel={hasPanel.value} forceMobile={props.isMobile}>
        {{
          list: ListContent,
          panel: PanelContent,
          empty: () => (
            <SplitPanelEmptyState
              icon={() => <PencilIcon class="size-6 text-neutral-400" />}
              title="选择一条翻译"
              description="从左侧列表选择翻译进行编辑"
            />
          ),
        }}
      </SplitPanelLayout>
    )
  },
})

const TranslationListItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<AITranslation>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    onEdit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onRegeneration: {
      type: Function as PropType<() => void>,
      required: true,
    },
    regenerationLoading: {
      type: Boolean,
      default: false,
    },
    onDelete: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div
        class={[
          'group cursor-pointer px-4 py-3 transition-colors',
          props.selected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        ]}
        onClick={props.onEdit}
      >
        <div class="mb-1.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              {props.item.lang.toUpperCase()}
            </span>
            <span class="text-xs text-neutral-400">
              ← {props.item.sourceLang.toUpperCase()}
            </span>
          </div>

          <div
            class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <NButton
              size="tiny"
              quaternary
              loading={props.regenerationLoading}
              onClick={props.onRegeneration}
            >
              {{
                icon: () => <RotateCwIcon class="size-3.5" />,
              }}
            </NButton>

            <NPopconfirm
              positiveText="取消"
              negativeText="删除"
              onNegativeClick={props.onDelete}
            >
              {{
                trigger: () => (
                  <button class="flex size-7 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950 dark:hover:text-red-400">
                    <TrashIcon class="size-3.5" />
                  </button>
                ),
                default: () => '确定要删除这条翻译吗？',
              }}
            </NPopconfirm>
          </div>
        </div>

        <h5 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {props.item.title}
        </h5>

        <div class="mt-1 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span class="flex items-center gap-1">
            <CalendarIcon class="size-3" />
            {format(new Date(props.item.created), 'MM-dd HH:mm')}
          </span>
          {props.item.aiModel && (
            <span class="flex items-center gap-1">
              <BotIcon class="size-3" />
              {props.item.aiModel}
            </span>
          )}
        </div>
      </div>
    )
  },
})

const TranslationEditPanel = defineComponent({
  props: {
    translation: {
      type: Object as PropType<AITranslation>,
      required: true,
    },
    onSave: {
      type: Function as PropType<
        (
          id: string,
          updates: { title: string; text: string; summary?: string },
        ) => void
      >,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const titleRef = ref(props.translation.title)
    const textRef = ref(props.translation.text)
    const summaryRef = ref(props.translation.summary || '')
    const saving = ref(false)

    watch(
      () => props.translation.id,
      () => {
        titleRef.value = props.translation.title
        textRef.value = props.translation.text
        summaryRef.value = props.translation.summary || ''
      },
    )

    const handleSave = async () => {
      if (!titleRef.value || !textRef.value) {
        toast.warning('标题和内容不能为空')
        return
      }
      saving.value = true
      try {
        await aiApi.updateTranslation(props.translation.id, {
          title: titleRef.value,
          text: textRef.value,
          summary: summaryRef.value || undefined,
        })
        props.onSave(props.translation.id, {
          title: titleRef.value,
          text: textRef.value,
          summary: summaryRef.value || undefined,
        })
        toast.success('保存成功')
        props.onClose()
      } finally {
        saving.value = false
      }
    }

    return () => (
      <div class="flex h-full flex-col">
        <div class="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex size-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              onClick={props.onClose}
            >
              <ArrowLeftIcon class="size-5" />
            </button>
            <div>
              <h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                编辑翻译
              </h2>
              <span class="text-xs text-neutral-500">
                {props.translation.lang.toUpperCase()}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <NButton size="small" onClick={props.onClose}>
              <XIcon class="mr-1 size-4" />
              取消
            </NButton>
            <NButton
              size="small"
              type="primary"
              loading={saving.value}
              onClick={handleSave}
            >
              <SaveIcon class="mr-1 size-4" />
              保存
            </NButton>
          </div>
        </div>

        <NScrollbar class="min-h-0 flex-1">
          <div class="space-y-4 p-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                标题
              </label>
              <NInput
                value={titleRef.value}
                onUpdateValue={(v) => (titleRef.value = v)}
                placeholder="翻译标题"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                内容
              </label>
              <NInput
                value={textRef.value}
                onUpdateValue={(v) => (textRef.value = v)}
                type="textarea"
                rows={12}
                placeholder="翻译内容"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                摘要
                <span class="ml-1 text-xs text-neutral-400">（可选）</span>
              </label>
              <NInput
                value={summaryRef.value}
                onUpdateValue={(v) => (summaryRef.value = v)}
                type="textarea"
                rows={3}
                placeholder="翻译摘要"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                预览
              </label>
              <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 class="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {titleRef.value || '无标题'}
                </h3>
                <MarkdownRender
                  text={textRef.value || '无内容'}
                  class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
                />
                {summaryRef.value && (
                  <div class="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                    <span class="text-xs font-medium text-neutral-500">
                      摘要
                    </span>
                    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {summaryRef.value}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {props.translation.tags && props.translation.tags.length > 0 && (
              <div>
                <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  标签
                </label>
                <div class="flex flex-wrap gap-1">
                  {props.translation.tags.map((tag) => (
                    <span
                      key={tag}
                      class="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div class="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
              <h4 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                元信息
              </h4>
              <div class="space-y-2 text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-neutral-500">创建时间</span>
                  <span class="text-neutral-700 dark:text-neutral-300">
                    {format(
                      new Date(props.translation.created),
                      'yyyy-MM-dd HH:mm:ss',
                    )}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-neutral-500">源语言</span>
                  <span class="text-neutral-700 dark:text-neutral-300">
                    {props.translation.sourceLang.toUpperCase()}
                  </span>
                </div>
                {props.translation.aiModel && (
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">AI 模型</span>
                    <span class="text-neutral-700 dark:text-neutral-300">
                      {props.translation.aiModel}
                    </span>
                  </div>
                )}
                {props.translation.aiProvider && (
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">提供商</span>
                    <span class="text-neutral-700 dark:text-neutral-300">
                      {props.translation.aiProvider}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </NScrollbar>
      </div>
    )
  },
})

export const TranslationDetailEmptyState = defineComponent({
  name: 'TranslationDetailEmptyState',
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <LanguagesIcon class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          选择一篇文章
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择文章查看 AI 翻译
        </p>
      </div>
    )
  },
})
