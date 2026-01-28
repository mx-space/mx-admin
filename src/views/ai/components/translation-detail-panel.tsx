/**
 * AI Translation Detail Panel Component
 * AI 翻译详情面板 - 用于 MasterDetailLayout 右侧
 */
import { format } from 'date-fns'
import {
  ArrowLeft as ArrowLeftIcon,
  Calendar as CalendarIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  FileText as FileTextIcon,
  Languages as LanguagesIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  RotateCw as RotateCwIcon,
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
import type { AITranslation, ArticleInfo } from '~/api/ai'
import type { PropType } from 'vue'

import { aiApi } from '~/api/ai'
import { MarkdownRender } from '~/components/markdown/markdown-render'

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
    const article = ref<{
      type: ArticleRefType
      document: { title: string }
    } | null>(null)
    const translations = ref<AITranslation[]>([])
    const loading = ref(false)
    const regenerationLoadingMap = ref<Record<string, boolean>>({})

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
        } else {
          article.value = null
          translations.value = []
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
    }

    const handleGenerate = () => {
      if (!props.articleId) return

      const loadingRef = ref(false)
      const langsRef = ref('')

      const $dialog = dialog.create({
        title: '生成 AI 翻译',
        content() {
          return (
            <NFlex vertical size="large">
              <div>
                <label class="mb-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  目标语言（多个语言用逗号分隔，留空使用默认配置）
                </label>
                <NInput
                  value={langsRef.value}
                  onUpdateValue={(v) => (langsRef.value = v)}
                  placeholder="如：en, ja, ko 或留空"
                />
              </div>
              <div class="text-right">
                <NButton
                  size="small"
                  type="primary"
                  loading={loadingRef.value}
                  onClick={() => {
                    loadingRef.value = true
                    const targetLanguages = langsRef.value
                      .split(',')
                      .map((l) => l.trim().toLowerCase())
                      .filter((l) => l.length === 2)

                    aiApi
                      .generateTranslation({
                        refId: props.articleId!,
                        targetLanguages:
                          targetLanguages.length > 0
                            ? targetLanguages
                            : undefined,
                      })
                      .then((res) => {
                        if (res && res.length > 0) {
                          // Merge by language to avoid duplicates / handle upsert responses
                          const next = [...translations.value]
                          for (const t of res) {
                            const idxByLang = next.findIndex(
                              (x) => x.lang === t.lang,
                            )
                            if (idxByLang !== -1) next[idxByLang] = t
                            else next.push(t)
                          }
                          translations.value = next
                          toast.success(`生成了 ${res.length} 个翻译`)
                          if (article.value) {
                            props.onOptimisticUpdate?.({
                              type: 'upsert',
                              article: {
                                id: props.articleId!,
                                type: article.value.type,
                                title: article.value.document.title,
                              },
                              translations: res,
                            })
                          }
                        } else {
                          toast.info('没有生成新的翻译')
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
            </NFlex>
          )
        },
      })
    }

    const handleEdit = (item: AITranslation) => {
      const titleRef = ref(item.title)
      const textRef = ref(item.text)
      const summaryRef = ref(item.summary || '')

      const $dialog = dialog.create({
        title: `编辑翻译 (${item.lang.toUpperCase()})`,
        style: { width: '600px' },
        content() {
          return (
            <NFlex vertical size="large">
              <div>
                <label class="mb-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  标题
                </label>
                <NInput
                  value={titleRef.value}
                  onUpdateValue={(v) => (titleRef.value = v)}
                  placeholder="标题"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  内容
                </label>
                <NInput
                  value={textRef.value}
                  onUpdateValue={(v) => (textRef.value = v)}
                  type="textarea"
                  rows={8}
                  placeholder="翻译内容"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm text-neutral-600 dark:text-neutral-400">
                  摘要（可选）
                </label>
                <NInput
                  value={summaryRef.value}
                  onUpdateValue={(v) => (summaryRef.value = v)}
                  type="textarea"
                  rows={3}
                  placeholder="翻译摘要"
                />
              </div>
              <div class="text-right">
                <NButton
                  type="primary"
                  onClick={() => {
                    if (!titleRef.value || !textRef.value) {
                      toast.warning('标题和内容不能为空')
                      return
                    }
                    aiApi
                      .updateTranslation(item.id, {
                        title: titleRef.value,
                        text: textRef.value,
                        summary: summaryRef.value || undefined,
                      })
                      .then(() => {
                        const idx = translations.value.findIndex(
                          (t) => t.id === item.id,
                        )
                        if (idx !== -1) {
                          translations.value[idx].title = titleRef.value
                          translations.value[idx].text = textRef.value
                          translations.value[idx].summary =
                            summaryRef.value || undefined
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

    const handleRegeneration = async (item: AITranslation) => {
      if (regenerationLoadingMap.value[item.id]) return
      regenerationLoadingMap.value[item.id] = true
      try {
        const res = await aiApi.generateTranslation({
          refId: item.refId,
          targetLanguages: [item.lang],
        })

        if (!res || res.length === 0) {
          toast.info('没有生成新的翻译')
          return
        }

        // backend may upsert or return a new record; replace current locale translation
        const regenerated = res.find((t) => t.lang === item.lang) ?? res[0]

        const idxById = translations.value.findIndex((t) => t.id === item.id)
        if (idxById !== -1) {
          translations.value[idxById] = regenerated
        } else {
          const idxByLang = translations.value.findIndex(
            (t) => t.lang === item.lang,
          )
          if (idxByLang !== -1) translations.value[idxByLang] = regenerated
          else translations.value.unshift(regenerated)
        }

        toast.success(`已重新生成 ${item.lang.toUpperCase()} 翻译`)
        if (article.value) {
          props.onOptimisticUpdate?.({
            type: 'upsert',
            article: {
              id: item.refId,
              type: article.value.type,
              title: article.value.document.title,
            },
            translations: [regenerated],
          })
        }
      } finally {
        regenerationLoadingMap.value[item.id] = false
      }
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

        {/* Content */}
        <NScrollbar class="min-h-0 flex-1">
          {loading.value ? (
            <div class="absolute inset-0 flex items-center justify-center">
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

              {/* Translations */}
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
                  <div>
                    {translations.value.map((translation) => (
                      <TranslationItem
                        key={translation.id}
                        item={translation}
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
  },
})

const TranslationItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<AITranslation>,
      required: true,
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
    const expanded = ref(false)
    const shouldShowExpand = computed(
      () => props.item.text.length > 200 || props.item.text.includes('\n'),
    )

    return () => (
      <div class="group border-b border-neutral-100 py-4 last:border-b-0 dark:border-neutral-800">
        {/* Header */}
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              {props.item.lang.toUpperCase()}
            </span>
            <span class="text-xs text-neutral-400">
              来自 {props.item.sourceLang.toUpperCase()}
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
                default: () => '确定要删除这条翻译吗？',
              }}
            </NPopconfirm>
          </div>
        </div>

        {/* Title */}
        <h5 class="mb-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {props.item.title}
        </h5>

        {/* Content */}
        <div
          class={[
            !expanded.value && shouldShowExpand.value
              ? 'max-h-[4.5rem] overflow-hidden'
              : '',
          ]}
        >
          <MarkdownRender
            text={props.item.text}
            class="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
          />
        </div>

        {/* Summary */}
        {props.item.summary && expanded.value && (
          <div class="mt-3 rounded bg-neutral-50 p-3 dark:bg-neutral-900">
            <span class="mb-1 block text-xs font-medium text-neutral-500">
              摘要
            </span>
            <p class="m-0 text-sm text-neutral-600 dark:text-neutral-400">
              {props.item.summary}
            </p>
          </div>
        )}

        {/* Tags */}
        {props.item.tags && props.item.tags.length > 0 && expanded.value && (
          <div class="mt-3 flex flex-wrap gap-1">
            {props.item.tags.map((tag) => (
              <span
                key={tag}
                class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

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
