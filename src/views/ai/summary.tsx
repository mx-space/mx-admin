import { useQuery } from '@tanstack/vue-query'
import { format } from 'date-fns'
import {
  Plus as AddIcon,
  ArrowLeft as ArrowLeftIcon,
  Calendar as CalendarIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  FileText as FileTextIcon,
  Pencil as PencilIcon,
  Sparkles as SparklesIcon,
  StickyNote as StickyNoteIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCollapseTransition,
  NFlex,
  NInput,
  NPagination,
  NPopconfirm,
  NSkeleton,
  NTooltip,
} from 'naive-ui'
import { Transition } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { PropType } from 'vue'

import { aiApi, type AISummary, type ArticleInfo } from '~/api/ai'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/layouts/content'

import styles from './summary.module.css'

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

export default defineComponent({
  setup() {
    const route = useRoute()

    return () => {
      const refId = route.query.refId as string
      return (
        <div class={styles.container}>
          {refId ? <SummaryRefIdContent refId={refId} /> : <Summaries />}
        </div>
      )
    }
  },
})

const Summaries = defineComponent({
  setup() {
    const pageRef = ref(1)
    const { data, refetch, isPending } = useQuery({
      queryKey: computed(() =>
        queryKeys.ai.summariesGrouped({ page: pageRef.value }),
      ),
      queryFn: () => aiApi.getSummariesGrouped({ page: pageRef.value }),
    })

    const loading = computed(() => isPending.value)

    return () => (
      <Transition name="fade" mode="out-in">
        {loading.value ? (
          <LoadingSkeleton key="loading" />
        ) : !data.value || data.value.data.length === 0 ? (
          <EmptyState key="empty" />
        ) : (
          <div key="content">
            <div class={styles.list} role="feed" aria-label="AI 摘要列表">
              {data.value.data.map((group) => (
                <ArticleGroup
                  key={group.article.id}
                  article={group.article}
                  summaries={group.summaries}
                  onMutate={refetch}
                />
              ))}
            </div>
            {data.value.pagination.totalPage > 1 && (
              <div class={styles.pagination}>
                <NPagination
                  page={data.value.pagination.currentPage}
                  pageCount={data.value.pagination.totalPage}
                  onUpdatePage={(page) => {
                    pageRef.value = page
                    refetch()
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Transition>
    )
  },
})

const ArticleGroup = defineComponent({
  props: {
    article: {
      type: Object as PropType<ArticleInfo>,
      required: true,
    },
    summaries: {
      type: Array as PropType<AISummary[]>,
      required: true,
    },
    onMutate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const expanded = ref(true)
    const RefIcon = RefTypeIcons[props.article.type]

    return () => (
      <section
        class={styles.articleGroup}
        aria-label={`${props.article.title} 的摘要`}
      >
        {/* Article Header */}
        <header class={styles.articleHeader}>
          <button
            type="button"
            class={styles.expandToggle}
            onClick={() => (expanded.value = !expanded.value)}
            aria-expanded={expanded.value}
            aria-label={expanded.value ? '收起' : '展开'}
          >
            {expanded.value ? (
              <ChevronDownIcon class={styles.expandIcon} />
            ) : (
              <ChevronRightIcon class={styles.expandIcon} />
            )}
          </button>

          <RouterLink
            to={`/${props.article.type}/edit?id=${props.article.id}`}
            class={styles.articleHeaderLink}
          >
            <RefIcon class={styles.articleTypeIcon} />
            <h2 class={styles.articleHeaderTitle}>{props.article.title}</h2>
          </RouterLink>

          <span class={styles.articleTypeBadge}>
            {RefTypeLabels[props.article.type]}
          </span>

          <span class={styles.summaryCount}>
            {props.summaries.length} 条摘要
          </span>

          <NTooltip trigger="hover" placement="top">
            {{
              trigger: () => (
                <RouterLink
                  to={`/ai/summary?refId=${props.article.id}`}
                  class={styles.manageLink}
                  aria-label="管理此文章的摘要"
                >
                  <SparklesIcon class="size-4" />
                </RouterLink>
              ),
              default: () => '管理摘要',
            }}
          </NTooltip>
        </header>

        {/* Summaries List */}
        <NCollapseTransition show={expanded.value}>
          <div class={styles.summariesList}>
            {props.summaries.map((summary) => (
              <SummaryItem
                key={summary.id}
                item={summary}
                onMutate={props.onMutate}
              />
            ))}
          </div>
        </NCollapseTransition>
      </section>
    )
  },
})

const SummaryItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<AISummary>,
      required: true,
    },
    onMutate: {
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
      <div class={styles.summaryItem}>
        <div class={styles.summaryItemHeader}>
          <span class={styles.langBadge}>{props.item.lang.toUpperCase()}</span>
          <span class={styles.summaryTime}>
            <CalendarIcon class={styles.timeIcon} />
            <time datetime={props.item.created}>
              {format(new Date(props.item.created), 'yyyy-MM-dd HH:mm')}
            </time>
          </span>
        </div>

        <div class={styles.summaryItemContent}>
          <p
            class={[
              styles.summaryText,
              !expanded.value && shouldShowExpand.value
                ? styles.summaryTextCollapsed
                : '',
            ]}
          >
            {props.item.summary}
          </p>
          {shouldShowExpand.value && (
            <button
              type="button"
              class={styles.expandButton}
              onClick={() => (expanded.value = !expanded.value)}
              aria-expanded={expanded.value}
            >
              {expanded.value ? (
                <>
                  <ChevronUpIcon class="mr-1 inline size-3" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDownIcon class="mr-1 inline size-3" />
                  展开
                </>
              )}
            </button>
          )}
        </div>

        <div class={styles.summaryItemActions}>
          <NTooltip trigger="hover" placement="top">
            {{
              trigger: () => (
                <button
                  type="button"
                  class={styles.actionButton}
                  onClick={() => showEditDialog(props.item, props.onMutate)}
                  aria-label="编辑摘要"
                >
                  <PencilIcon />
                </button>
              ),
              default: () => '编辑',
            }}
          </NTooltip>

          <NPopconfirm
            placement="left"
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={async () => {
              await aiApi.deleteSummary(props.item.id)
              props.onMutate()
            }}
          >
            {{
              trigger: () => (
                <NTooltip trigger="hover" placement="top">
                  {{
                    trigger: () => (
                      <button
                        type="button"
                        class={[styles.actionButton, styles.deleteButton]}
                        aria-label="删除摘要"
                      >
                        <TrashIcon />
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
    )
  },
})

const SummaryRefIdContent = defineComponent({
  props: {
    refId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter()
    const refId = props.refId
    const { data, refetch, isPending } = useQuery({
      queryKey: queryKeys.ai.summaryByRef(refId),
      queryFn: () => aiApi.getSummaryByRef(refId),
    })

    const { setActions } = useLayout()

    setActions(
      <HeaderActionButton
        icon={<AddIcon />}
        name="生成摘要"
        onClick={() => {
          showGenerateDialog(refId, (res) => {
            res && data.value?.summaries.push(res)
          })
        }}
      />,
    )

    onUnmounted(() => {
      setActions(null)
    })

    const loading = computed(() => isPending.value)

    return () => (
      <div>
        {/* Page Header */}
        <header class={styles.pageHeader}>
          <button
            type="button"
            class={styles.backButton}
            onClick={() => router.back()}
            aria-label="返回"
          >
            <ArrowLeftIcon />
          </button>
          <h1 class={styles.pageTitle}>
            {data.value?.article.document.title || '摘要管理'}
          </h1>
        </header>

        <Transition name="fade" mode="out-in">
          {loading.value ? (
            <LoadingSkeleton key="loading" count={2} />
          ) : !data.value || data.value.summaries.length === 0 ? (
            <EmptyState
              key="empty"
              title="暂无摘要"
              description="为这篇文章生成 AI 摘要"
              showAction
              onAction={() => {
                showGenerateDialog(refId, (res) => {
                  res && data.value?.summaries.push(res)
                })
              }}
            />
          ) : (
            <div key="content" class={styles.list}>
              {data.value.summaries.map((item) => (
                <SummaryCard key={item.id} item={item} onMutate={refetch} />
              ))}
            </div>
          )}
        </Transition>
      </div>
    )
  },
})

const SummaryCard = defineComponent({
  props: {
    item: {
      type: Object as PropType<AISummary>,
      required: true,
    },
    onMutate: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const expanded = ref(false)
    const shouldShowExpand = computed(
      () =>
        props.item.summary.length > 200 || props.item.summary.includes('\n'),
    )

    return () => (
      <article class={styles.card} aria-label="AI 摘要">
        {/* Header */}
        <header class={styles.cardHeader}>
          <span class={styles.langBadge}>{props.item.lang.toUpperCase()}</span>
        </header>

        {/* Summary Content */}
        <div class={styles.summaryContent}>
          <p
            class={[
              styles.summaryText,
              !expanded.value && shouldShowExpand.value
                ? styles.summaryTextCollapsed
                : '',
            ]}
          >
            {props.item.summary}
          </p>
          {shouldShowExpand.value && (
            <button
              type="button"
              class={styles.expandButton}
              onClick={() => (expanded.value = !expanded.value)}
              aria-expanded={expanded.value}
            >
              {expanded.value ? (
                <>
                  <ChevronUpIcon class="mr-1 inline size-3" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDownIcon class="mr-1 inline size-3" />
                  展开全部
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <footer class={styles.cardFooter}>
          <div class={styles.meta}>
            <span class={styles.metaItem} aria-label="创建时间">
              <CalendarIcon class={styles.metaIcon} />
              <time datetime={props.item.created}>
                {format(new Date(props.item.created), 'yyyy-MM-dd HH:mm')}
              </time>
            </span>
          </div>

          {/* Actions */}
          <div class={styles.actions} role="group" aria-label="操作">
            <NTooltip trigger="hover" placement="top">
              {{
                trigger: () => (
                  <button
                    type="button"
                    class={styles.actionButton}
                    onClick={() => showEditDialog(props.item, props.onMutate)}
                    aria-label="编辑摘要"
                  >
                    <PencilIcon />
                  </button>
                ),
                default: () => '编辑',
              }}
            </NTooltip>

            <NPopconfirm
              placement="left"
              positiveText="取消"
              negativeText="删除"
              onNegativeClick={async () => {
                await aiApi.deleteSummary(props.item.id)
                props.onMutate()
              }}
            >
              {{
                trigger: () => (
                  <NTooltip trigger="hover" placement="top">
                    {{
                      trigger: () => (
                        <button
                          type="button"
                          class={[styles.actionButton, styles.deleteButton]}
                          aria-label="删除摘要"
                        >
                          <TrashIcon />
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
        </footer>
      </article>
    )
  },
})

const EmptyState = defineComponent({
  props: {
    title: {
      type: String,
      default: '暂无 AI 摘要',
    },
    description: {
      type: String,
      default: '这里会显示所有文章的 AI 生成摘要',
    },
    showAction: {
      type: Boolean,
      default: false,
    },
    onAction: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props) {
    return () => (
      <div class={styles.empty} role="status" aria-label="暂无内容">
        <div class={styles.emptyIcon} aria-hidden="true">
          <SparklesIcon />
        </div>
        <h3 class={styles.emptyTitle}>{props.title}</h3>
        <p class={styles.emptyDescription}>{props.description}</p>
        {props.showAction && props.onAction && (
          <NButton type="primary" onClick={props.onAction}>
            <AddIcon class="mr-1.5" />
            生成摘要
          </NButton>
        )}
      </div>
    )
  },
})

const LoadingSkeleton = defineComponent({
  props: {
    count: {
      type: Number,
      default: 3,
    },
  },
  setup(props) {
    return () => (
      <div class={styles.list} aria-busy="true" aria-label="加载中">
        {Array.from({ length: props.count }).map((_, i) => (
          <div key={i} class={styles.skeleton}>
            <div class={styles.skeletonHeader}>
              <NSkeleton text style={{ width: '200px' }} />
              <NSkeleton text style={{ width: '60px' }} />
            </div>
            <div class={styles.skeletonContent}>
              <NSkeleton text repeat={2} />
            </div>
          </div>
        ))}
      </div>
    )
  },
})

// Helper functions for dialogs
function showGenerateDialog(
  refId: string,
  onSuccess: (res: AISummary | null) => void,
) {
  const loadingRef = ref(false)
  const langRef = ref('zh')

  const $dialog = dialog.create({
    title: '生成 AI 摘要',
    content() {
      return (
        <NFlex vertical size="large">
          <div>
            <label class="mb-2 block text-sm text-neutral-600">目标语言</label>
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
                    refId,
                    lang: langRef.value,
                  })
                  .then((res) => {
                    onSuccess(res)
                    $dialog.destroy()
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

function showEditDialog(item: AISummary, onSuccess: () => void) {
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
                    onSuccess()
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
