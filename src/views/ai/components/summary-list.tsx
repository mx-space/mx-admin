import {
  FileText as FileTextIcon,
  Inbox as InboxIcon,
  LoaderIcon,
  Search as SearchIcon,
  StickyNote as StickyNoteIcon,
} from 'lucide-vue-next'
import { NScrollbar } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import type { ArticleInfo, GroupedSummaryData } from '~/api/ai'
import type { PropType } from 'vue'

import { refDebounced } from '@vueuse/core'

import { BorderlessInput } from '~/components/input/borderless-input'

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

export const SummaryList = defineComponent({
  name: 'SummaryList',
  props: {
    data: {
      type: Array as PropType<GroupedSummaryData[]>,
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
    onSearchChange: {
      type: Function as PropType<(search: string) => void>,
    },
    search: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const searchInputValue = ref('')
    const debouncedSearch = refDebounced(searchInputValue, 300)

    watch(debouncedSearch, (val) => {
      props.onSearchChange?.(val)
    })

    const showSearchEmpty = computed(
      () => props.search.trim().length > 0 && props.data.length === 0,
    )

    const handleScroll = (event: Event) => {
      if (props.loading || !props.pager?.hasNextPage) return
      const target = event.target as HTMLElement
      if (!target) return
      const reachedBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 24
      if (reachedBottom) {
        props.onPageChange?.(props.pager.currentPage + 1)
      }
    }

    return () => (
      <div class="flex h-full flex-col">
        <div class="flex h-12 flex-shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <BorderlessInput
            class="-mx-4 flex-1"
            value={searchInputValue.value}
            onUpdateValue={(val) => (searchInputValue.value = val)}
            placeholder="输入文章标题关键词"
            clearable
            inputProps={{
              id: 'ai-summary-search',
              name: 'ai-summary-search',
              autocomplete: 'off',
              class: 'text-base',
            }}
          >
            {{
              prefix: () => <SearchIcon class="size-4 text-neutral-400" />,
            }}
          </BorderlessInput>
        </div>

        <div class="min-h-0 flex-1">
          {props.loading && props.data.length === 0 ? (
            <div class="flex items-center justify-center py-24">
              <LoaderIcon class="size-6 animate-spin text-neutral-400 dark:text-neutral-500" />
            </div>
          ) : props.data.length === 0 ? (
            <div class="flex flex-col items-center justify-center py-24 text-center">
              <InboxIcon class="mb-4 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
              <p class="text-sm text-neutral-500">暂无 AI 摘要</p>
              <p class="mt-1 text-xs text-neutral-400">
                为文章生成 AI 摘要后会显示在这里
              </p>
            </div>
          ) : showSearchEmpty.value ? (
            <div class="flex flex-col items-center justify-center py-24 text-center">
              <InboxIcon class="mb-4 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
              <p class="text-sm text-neutral-500">没有找到匹配的文章</p>
              <p class="mt-1 text-xs text-neutral-400">试试其他关键词</p>
            </div>
          ) : (
            <NScrollbar class="h-full" onScroll={handleScroll}>
              <div>
                {props.data.map((group) => (
                  <SummaryListItem
                    key={group.article.id}
                    article={group.article}
                    summaryCount={group.summaries.length}
                    selected={props.selectedId === group.article.id}
                    onSelect={() => props.onSelect(group.article)}
                  />
                ))}
                {props.loading && props.data.length > 0 && (
                  <div class="flex items-center justify-center py-3">
                    <LoaderIcon class="size-4 animate-spin text-neutral-400 dark:text-neutral-500" />
                  </div>
                )}
              </div>
            </NScrollbar>
          )}
        </div>
      </div>
    )
  },
})

const SummaryListItem = defineComponent({
  name: 'SummaryListItem',
  props: {
    article: {
      type: Object as PropType<ArticleInfo>,
      required: true,
    },
    summaryCount: {
      type: Number,
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
        <div class="flex items-center gap-2">
          <RefIcon.value class="size-4 shrink-0 text-neutral-400" />
          <h3 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {props.article.title}
          </h3>
        </div>

        <div class="mt-1.5 flex items-center gap-2 pl-6 text-xs text-neutral-400">
          <span class="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
            {RefTypeLabels[props.article.type]}
          </span>
          <span>{props.summaryCount} 条摘要</span>
        </div>
      </div>
    )
  },
})
