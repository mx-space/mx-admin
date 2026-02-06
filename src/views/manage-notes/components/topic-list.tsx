import { Hash, Inbox as InboxIcon } from 'lucide-vue-next'
import { NButton, NScrollbar } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { TopicModel } from '~/models/topic'
import type { PropType } from 'vue'

import { textToBigCharOrWord } from '~/utils/word'

interface Pager {
  currentPage: number
  totalPage: number
  total: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

export const TopicList = defineComponent({
  name: 'TopicList',
  props: {
    data: {
      type: Array as PropType<TopicModel[]>,
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
      type: Function as PropType<(topic: TopicModel) => void>,
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
            <Hash class="h-4 w-4" />
            专栏列表
          </span>
          {totalCount.value > 0 && (
            <span class="text-xs text-neutral-400">{totalCount.value} 个</span>
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
              <p class="text-sm text-neutral-500">暂无专栏</p>
              <p class="mt-1 text-xs text-neutral-400">
                点击右上角按钮创建专栏
              </p>
            </div>
          ) : (
            <NScrollbar class="h-full">
              <div>
                {props.data.map((item) => (
                  <TopicListItem
                    key={item.id}
                    data={item}
                    selected={props.selectedId === item.id}
                    onSelect={() => props.onSelect(item)}
                  />
                ))}
              </div>
            </NScrollbar>
          )}
        </div>

        {props.pager && props.pager.totalPage > 1 && props.onPageChange && (
          <div class="flex items-center justify-center gap-2 border-t border-neutral-200 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
            <NButton
              size="small"
              disabled={!props.pager.hasPrevPage}
              onClick={() => props.onPageChange!(props.pager!.currentPage - 1)}
            >
              上一页
            </NButton>
            <span class="text-xs text-neutral-500">
              {props.pager.currentPage} / {props.pager.totalPage}
            </span>
            <NButton
              size="small"
              disabled={!props.pager.hasNextPage}
              onClick={() => props.onPageChange!(props.pager!.currentPage + 1)}
            >
              下一页
            </NButton>
          </div>
        )}
      </div>
    )
  },
})

const TopicListItem = defineComponent({
  name: 'TopicListItem',
  props: {
    data: {
      type: Object as PropType<TopicModel>,
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
    return () => (
      <div
        class={[
          'flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 transition-colors last:border-b-0 dark:border-neutral-800/50',
          props.selected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
        ]}
        onClick={props.onSelect}
      >
        <div class="shrink-0">
          {props.data.icon ? (
            <img
              src={props.data.icon}
              alt={`${props.data.name} 图标`}
              class="size-10 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div class="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 text-sm font-semibold text-neutral-600 dark:from-neutral-800 dark:to-neutral-700 dark:text-neutral-300">
              {textToBigCharOrWord(props.data.name)}
            </div>
          )}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {props.data.name}
            </h3>
          </div>
          <div class="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
            <Hash class="size-3 shrink-0" />
            <span class="truncate font-mono">{props.data.slug}</span>
          </div>
        </div>
      </div>
    )
  },
})
