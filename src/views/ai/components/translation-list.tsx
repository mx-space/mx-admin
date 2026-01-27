/**
 * AI Translation List Panel Component
 * AI 翻译文章列表面板 - 用于 MasterDetailLayout 左侧
 */
import {
  FileText as FileTextIcon,
  Inbox as InboxIcon,
  Languages as LanguagesIcon,
  StickyNote as StickyNoteIcon,
} from 'lucide-vue-next'
import { NScrollbar } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { ArticleInfo, GroupedTranslationData } from '~/api/ai'
import type { PropType } from 'vue'

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

interface Pager {
  currentPage: number
  totalPage: number
  total: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

export const TranslationList = defineComponent({
  name: 'TranslationList',
  props: {
    data: {
      type: Array as PropType<GroupedTranslationData[]>,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    selectedId: {
      type: String as PropType<string | null>,
      default: null,
    },
    pager: {
      type: Object as PropType<Pager | null>,
      default: null,
    },
    onSelect: {
      type: Function as PropType<(article: ArticleInfo) => void>,
      required: true,
    },
    onPageChange: {
      type: Function as PropType<(page: number) => void>,
    },
  },
  setup(props) {
    const totalCount = computed(() => props.pager?.total ?? props.data.length)

    return () => (
      <div class="flex h-full flex-col">
        <div class="flex h-12 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span class="flex items-center gap-1.5 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            <LanguagesIcon class="h-4 w-4" />
            AI 翻译
          </span>
          {totalCount.value > 0 && (
            <span class="text-xs text-neutral-400">
              {totalCount.value} 篇文章
            </span>
          )}
        </div>

        <div class="min-h-0 flex-1">
          {props.loading && props.data.length === 0 ? (
            <div class="flex items-center justify-center py-24">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : props.data.length === 0 ? (
            <div class="flex flex-col items-center justify-center py-24 text-center">
              <InboxIcon class="mb-4 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
              <p class="text-sm text-neutral-500">暂无 AI 翻译</p>
              <p class="mt-1 text-xs text-neutral-400">
                为文章生成 AI 翻译后会显示在这里
              </p>
            </div>
          ) : (
            <NScrollbar class="h-full">
              <div>
                {props.data.map((group) => (
                  <TranslationListItem
                    key={group.article.id}
                    article={group.article}
                    translationCount={group.translations.length}
                    languages={group.translations.map((t) => t.lang)}
                    selected={props.selectedId === group.article.id}
                    onSelect={() => props.onSelect(group.article)}
                  />
                ))}
              </div>
            </NScrollbar>
          )}
        </div>
      </div>
    )
  },
})

const TranslationListItem = defineComponent({
  name: 'TranslationListItem',
  props: {
    article: {
      type: Object as PropType<ArticleInfo>,
      required: true,
    },
    translationCount: {
      type: Number,
      required: true,
    },
    languages: {
      type: Array as PropType<string[]>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    onSelect: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const RefIcon = computed(() => RefTypeIcons[props.article.type])

    return () => (
      <div
        class={[
          'cursor-pointer border-b border-neutral-100 px-4 py-3 transition-colors last:border-b-0 dark:border-neutral-800/50',
          props.selected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
        ]}
        onClick={props.onSelect}
      >
        {/* Title */}
        <div class="flex items-center gap-2">
          <RefIcon.value class="size-4 shrink-0 text-neutral-400" />
          <h3 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.article.title}
          </h3>
        </div>

        {/* Meta */}
        <div class="mt-1.5 flex items-center gap-2 pl-6 text-xs text-neutral-400">
          <span class="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
            {RefTypeLabels[props.article.type]}
          </span>
          <span>{props.translationCount} 种语言</span>
          <div class="flex gap-1">
            {props.languages.slice(0, 3).map((lang) => (
              <span
                key={lang}
                class="rounded bg-blue-50 px-1 py-0.5 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              >
                {lang.toUpperCase()}
              </span>
            ))}
            {props.languages.length > 3 && (
              <span class="text-neutral-400">
                +{props.languages.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  },
})
