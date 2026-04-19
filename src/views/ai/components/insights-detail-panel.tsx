import { format } from 'date-fns'
import {
  ArrowLeft as ArrowLeftIcon,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  Languages as LanguagesIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  RotateCw as RotateCwIcon,
  Save as SaveIcon,
  StickyNote as StickyNoteIcon,
  Telescope as TelescopeIcon,
  Trash2 as TrashIcon,
  X as XIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NEmpty,
  NInput,
  NPopconfirm,
  NScrollbar,
  NSelect,
} from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import type { AIInsights, ArticleInfo } from '~/api/ai'
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

type ActivePanel = { type: 'edit'; insights: AIInsights } | null

export const InsightsDetailPanel = defineComponent({
  name: 'InsightsDetailPanel',
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
    const taskQueue = useAiTaskQueue()

    const article = ref<ArticleInfo | null>(null)
    const insightsList = ref<AIInsights[]>([])
    const loading = ref(false)
    const regenerationLoadingMap = ref<Record<string, boolean>>({})
    const activePanel = ref<ActivePanel>(null)

    const setActivePanel = (panel: ActivePanel) => {
      activePanel.value = panel
    }

    const fetchData = async (refId: string) => {
      loading.value = true
      try {
        const data = await aiApi.getInsightsByRef(refId)
        article.value = data.article
        insightsList.value = data.insights
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
          insightsList.value = []
          activePanel.value = null
        }
      },
      { immediate: true },
    )

    const handleDelete = async (id: string) => {
      await aiApi.deleteInsights(id)
      insightsList.value = insightsList.value.filter((s) => s.id !== id)
      toast.success('删除成功')
      props.onRefresh?.()
      if (
        activePanel.value?.type === 'edit' &&
        activePanel.value.insights.id === id
      ) {
        activePanel.value = null
      }
    }

    const handleGenerateSource = () => {
      if (!props.articleId) return
      const taskPayload = { refId: props.articleId }
      aiApi.createInsightsTask(taskPayload).then((res) => {
        if (res.created) {
          taskQueue.trackTask({
            taskId: res.taskId,
            type: AITaskType.Insights,
            label: `精读: ${article.value?.title || '文章'}`,
            onComplete: () => {
              if (props.articleId) fetchData(props.articleId)
            },
            retryFn: () => aiApi.createInsightsTask(taskPayload),
          })
          toast.success('已创建精读生成任务')
        } else {
          toast.info('任务已存在，正在处理中')
        }
      })
    }

    const handleAddTranslation = () => {
      if (!props.articleId) return
      const loadingRef = ref(false)
      const langRef = ref('')

      const $dialog = dialog.create({
        title: '添加精读翻译',
        content() {
          return (
            <div class="flex flex-col gap-4">
              <div>
                <label class="mb-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  目标语言（ISO 639-1，如 en, ja, ko）
                </label>
                <NInput
                  value={langRef.value}
                  onUpdateValue={(v) => (langRef.value = v)}
                  placeholder="en"
                />
              </div>
              <div class="text-right">
                <NButton
                  size="small"
                  type="primary"
                  loading={loadingRef.value}
                  onClick={() => {
                    const targetLang = langRef.value.trim().toLowerCase()
                    if (targetLang.length !== 2) {
                      toast.warning('请填写合法的 ISO 639-1 语言代码')
                      return
                    }
                    loadingRef.value = true
                    const taskPayload = {
                      refId: props.articleId!,
                      targetLang,
                    }
                    aiApi
                      .createInsightsTranslationTask(taskPayload)
                      .then((res) => {
                        if (res.created) {
                          taskQueue.trackTask({
                            taskId: res.taskId,
                            type: AITaskType.InsightsTranslation,
                            label: `精读翻译 (${targetLang.toUpperCase()}): ${article.value?.title || '文章'}`,
                            onComplete: () => {
                              if (props.articleId) fetchData(props.articleId)
                            },
                            retryFn: () =>
                              aiApi.createInsightsTranslationTask(taskPayload),
                          })
                          toast.success('已创建精读翻译任务')
                        } else {
                          toast.info('任务已存在，正在处理中')
                        }
                        $dialog.destroy()
                      })
                      .finally(() => {
                        loadingRef.value = false
                      })
                  }}
                >
                  <PlusIcon class="mr-1.5 size-4" />
                  添加
                </NButton>
              </div>
            </div>
          )
        },
      })
    }

    const handleRegenerateSource = (item: AIInsights) => {
      if (regenerationLoadingMap.value[item.id]) return
      regenerationLoadingMap.value[item.id] = true
      const taskPayload = { refId: item.refId }
      aiApi
        .createInsightsTask(taskPayload)
        .then((res) => {
          if (res.created) {
            taskQueue.trackTask({
              taskId: res.taskId,
              type: AITaskType.Insights,
              label: `精读: ${article.value?.title || '文章'}`,
              onComplete: () => {
                if (props.articleId) fetchData(props.articleId)
              },
              retryFn: () => aiApi.createInsightsTask(taskPayload),
            })
            toast.success('已创建精读重新生成任务')
          } else {
            toast.info('任务已存在，正在处理中')
          }
        })
        .finally(() => {
          regenerationLoadingMap.value[item.id] = false
        })
    }

    const handleRegenerateTranslation = (item: AIInsights) => {
      if (regenerationLoadingMap.value[item.id]) return
      regenerationLoadingMap.value[item.id] = true
      const taskPayload = { refId: item.refId, targetLang: item.lang }
      aiApi
        .createInsightsTranslationTask(taskPayload)
        .then((res) => {
          if (res.created) {
            taskQueue.trackTask({
              taskId: res.taskId,
              type: AITaskType.InsightsTranslation,
              label: `精读翻译 (${item.lang.toUpperCase()}): ${article.value?.title || '文章'}`,
              onComplete: () => {
                if (props.articleId) fetchData(props.articleId)
              },
              retryFn: () => aiApi.createInsightsTranslationTask(taskPayload),
            })
            toast.success(`已创建 ${item.lang.toUpperCase()} 翻译任务`)
          } else {
            toast.info('任务已存在，正在处理中')
          }
        })
        .finally(() => {
          regenerationLoadingMap.value[item.id] = false
        })
    }

    const handleEdit = (item: AIInsights) => {
      setActivePanel({ type: 'edit', insights: item })
    }

    const handleSaveEdit = (id: string, content: string) => {
      const idx = insightsList.value.findIndex((s) => s.id === id)
      if (idx !== -1) {
        insightsList.value[idx].content = content
      }
    }

    const RefIcon = computed(() =>
      article.value ? RefTypeIcons[article.value.type] : FileTextIcon,
    )

    const hasPanel = computed(() => activePanel.value !== null)

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
              精读详情
            </h2>
          </div>

          {article.value && (
            <div class="flex items-center gap-2">
              <NButton size="small" onClick={handleAddTranslation}>
                {{
                  icon: () => <LanguagesIcon class="size-4" />,
                  default: () => '添加翻译',
                }}
              </NButton>
              <NButton
                size="small"
                type="primary"
                onClick={handleGenerateSource}
              >
                {{
                  icon: () => <PlusIcon class="size-4" />,
                  default: () => '生成精读',
                }}
              </NButton>
            </div>
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
                    {article.value.title}
                  </h3>
                </RouterLink>
              </div>

              <div class="h-px bg-neutral-100 dark:bg-neutral-800" />

              <div>
                <h4 class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  精读列表
                  <span class="ml-1 text-xs text-neutral-400">
                    ({insightsList.value.length})
                  </span>
                </h4>

                {insightsList.value.length === 0 ? (
                  <NEmpty description="暂无精读">
                    {{
                      extra: () => (
                        <NButton size="small" onClick={handleGenerateSource}>
                          生成精读
                        </NButton>
                      ),
                    }}
                  </NEmpty>
                ) : (
                  <div class="-mx-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {insightsList.value.map((item) => (
                      <InsightsListItem
                        key={item.id}
                        item={item}
                        selected={
                          activePanel.value?.type === 'edit' &&
                          activePanel.value.insights.id === item.id
                        }
                        regenerationLoading={
                          !!regenerationLoadingMap.value[item.id]
                        }
                        onSelect={() => handleEdit(item)}
                        onRegenerateSource={() => handleRegenerateSource(item)}
                        onRegenerateTranslation={() =>
                          handleRegenerateTranslation(item)
                        }
                        onDelete={() => handleDelete(item.id)}
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

    const PanelContent = () => {
      if (activePanel.value?.type === 'edit') {
        return (
          <InsightsDetailEditor
            insights={activePanel.value.insights}
            allInsights={insightsList.value}
            onSave={handleSaveEdit}
            onDelete={handleDelete}
            onRegenerateSource={handleRegenerateSource}
            onRegenerateTranslation={handleRegenerateTranslation}
            onSelectLang={(id) => {
              const target = insightsList.value.find((s) => s.id === id)
              if (target) setActivePanel({ type: 'edit', insights: target })
            }}
            regenerationLoading={
              !!regenerationLoadingMap.value[activePanel.value.insights.id]
            }
            onClose={() => setActivePanel(null)}
          />
        )
      }
      return null
    }

    return () => (
      <SplitPanelLayout
        showPanel={hasPanel.value}
        forceMobile={props.isMobile}
        defaultSize="360px"
        min="300px"
        max="480px"
      >
        {{
          list: ListContent,
          panel: PanelContent,
          empty: () => (
            <SplitPanelEmptyState
              icon={() => <PencilIcon class="size-6 text-neutral-400" />}
              title="选择一条精读"
              description="从左侧列表选择精读进行查看或编辑"
            />
          ),
        }}
      </SplitPanelLayout>
    )
  },
})

const InsightsListItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<AIInsights>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    regenerationLoading: {
      type: Boolean,
      default: false,
    },
    onSelect: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onRegenerateSource: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onRegenerateTranslation: {
      type: Function as PropType<() => void>,
      required: true,
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
        onClick={props.onSelect}
      >
        <div class="mb-1.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              {props.item.lang.toUpperCase()}
            </span>
            {props.item.isTranslation && props.item.sourceLang ? (
              <span class="text-xs text-neutral-400">
                ← {props.item.sourceLang.toUpperCase()}
              </span>
            ) : (
              <span class="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                源
              </span>
            )}
            <span class="flex items-center gap-1 text-xs text-neutral-400">
              <CalendarIcon class="size-3" />
              {format(new Date(props.item.created), 'MM-dd HH:mm')}
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
              onClick={
                props.item.isTranslation
                  ? props.onRegenerateTranslation
                  : props.onRegenerateSource
              }
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
                default: () => '确定要删除这条精读吗？',
              }}
            </NPopconfirm>
          </div>
        </div>

        <p class="line-clamp-2 text-sm text-neutral-700 dark:text-neutral-300">
          {props.item.content.slice(0, 200)}
        </p>
      </div>
    )
  },
})

const InsightsDetailEditor = defineComponent({
  props: {
    insights: {
      type: Object as PropType<AIInsights>,
      required: true,
    },
    allInsights: {
      type: Array as PropType<AIInsights[]>,
      required: true,
    },
    regenerationLoading: {
      type: Boolean,
      default: false,
    },
    onSave: {
      type: Function as PropType<(id: string, content: string) => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onRegenerateSource: {
      type: Function as PropType<(item: AIInsights) => void>,
      required: true,
    },
    onRegenerateTranslation: {
      type: Function as PropType<(item: AIInsights) => void>,
      required: true,
    },
    onSelectLang: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const contentRef = ref(props.insights.content)
    const saving = ref(false)
    const editMode = ref(false)

    watch(
      () => props.insights.id,
      () => {
        contentRef.value = props.insights.content
        editMode.value = false
      },
    )

    const langOptions = computed(() =>
      props.allInsights.map((item) => ({
        label: `${item.lang.toUpperCase()}${item.isTranslation ? '' : ' · 源'}`,
        value: item.id,
      })),
    )

    const handleSave = async () => {
      if (!contentRef.value) {
        toast.warning('精读内容不能为空')
        return
      }
      saving.value = true
      try {
        await aiApi.updateInsights(props.insights.id, {
          content: contentRef.value,
        })
        props.onSave(props.insights.id, contentRef.value)
        toast.success('保存成功')
        editMode.value = false
      } finally {
        saving.value = false
      }
    }

    const handleCancelEdit = () => {
      contentRef.value = props.insights.content
      editMode.value = false
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
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                精读 {editMode.value ? '编辑' : '查看'}
              </h2>
              <NSelect
                value={props.insights.id}
                options={langOptions.value}
                onUpdateValue={(v: string) => props.onSelectLang(v)}
                size="small"
                class="w-36"
              />
              {!props.insights.isTranslation && (
                <span class="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  源
                </span>
              )}
            </div>
          </div>
          <div class="flex items-center gap-2">
            {editMode.value ? (
              <>
                <NButton size="small" onClick={handleCancelEdit}>
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
              </>
            ) : (
              <NButton size="small" onClick={() => (editMode.value = true)}>
                <PencilIcon class="mr-1 size-4" />
                编辑
              </NButton>
            )}
          </div>
        </div>

        <NScrollbar class="min-h-0 flex-1">
          <div class="space-y-4 p-4">
            {!editMode.value && (
              <div class="flex flex-wrap items-center gap-2">
                {props.insights.isTranslation ? (
                  <NButton
                    size="small"
                    secondary
                    loading={props.regenerationLoading}
                    onClick={() =>
                      props.onRegenerateTranslation(props.insights)
                    }
                  >
                    <RotateCwIcon class="mr-1 size-4" />
                    重新翻译本语言
                  </NButton>
                ) : (
                  <NButton
                    size="small"
                    secondary
                    loading={props.regenerationLoading}
                    onClick={() => props.onRegenerateSource(props.insights)}
                  >
                    <RotateCwIcon class="mr-1 size-4" />
                    重新生成源
                  </NButton>
                )}
                <NPopconfirm
                  positiveText="取消"
                  negativeText="删除"
                  onNegativeClick={() => props.onDelete(props.insights.id)}
                >
                  {{
                    trigger: () => (
                      <NButton size="small" secondary type="error">
                        <TrashIcon class="mr-1 size-4" />
                        删除
                      </NButton>
                    ),
                    default: () => '确定要删除这条精读吗？',
                  }}
                </NPopconfirm>
              </div>
            )}

            {editMode.value ? (
              <div>
                <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  精读 Markdown
                </label>
                <NInput
                  value={contentRef.value}
                  onUpdateValue={(v) => (contentRef.value = v)}
                  type="textarea"
                  rows={20}
                  placeholder="精读 Markdown 内容"
                />
              </div>
            ) : (
              <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <MarkdownRender
                  text={props.insights.content || ''}
                  class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
                />
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
                      new Date(props.insights.created),
                      'yyyy-MM-dd HH:mm:ss',
                    )}
                  </span>
                </div>
                {props.insights.updated && (
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">更新时间</span>
                    <span class="text-neutral-700 dark:text-neutral-300">
                      {format(
                        new Date(props.insights.updated),
                        'yyyy-MM-dd HH:mm:ss',
                      )}
                    </span>
                  </div>
                )}
                <div class="flex items-center gap-2">
                  <span class="text-neutral-500">语言</span>
                  <span class="text-neutral-700 dark:text-neutral-300">
                    {props.insights.lang.toUpperCase()}
                  </span>
                </div>
                {props.insights.isTranslation && props.insights.sourceLang && (
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">源语言</span>
                    <span class="text-neutral-700 dark:text-neutral-300">
                      {props.insights.sourceLang.toUpperCase()}
                    </span>
                  </div>
                )}
                <div class="flex items-center gap-2">
                  <span class="text-neutral-500">哈希</span>
                  <span class="font-mono text-neutral-700 dark:text-neutral-300">
                    {props.insights.hash.slice(0, 12)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </NScrollbar>
      </div>
    )
  },
})

export const InsightsDetailEmptyState = defineComponent({
  name: 'InsightsDetailEmptyState',
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <TelescopeIcon class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          选择一篇文章
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择文章查看 AI 精读
        </p>
      </div>
    )
  },
})
