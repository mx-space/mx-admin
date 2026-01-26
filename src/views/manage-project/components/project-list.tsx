/**
 * Project List Panel Component
 * 项目列表面板 - 用于 MasterDetailLayout 左侧
 */
import { ExternalLink, Folder, Inbox as InboxIcon } from 'lucide-vue-next'
import { NAvatar, NScrollbar } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { ProjectModel } from '~/models/project'
import type { PropType } from 'vue'

import { RelativeTime } from '~/components/time/relative-time'
import { textToBigCharOrWord } from '~/utils/word'

interface Pager {
  currentPage: number
  totalPage: number
  total: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

export const ProjectList = defineComponent({
  name: 'ProjectList',
  props: {
    data: {
      type: Array as PropType<ProjectModel[]>,
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
      type: Function as PropType<(project: ProjectModel) => void>,
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
            <Folder class="h-4 w-4" />
            项目列表
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
              <p class="text-sm text-neutral-500">暂无项目</p>
              <p class="mt-1 text-xs text-neutral-400">
                点击右上角按钮创建项目
              </p>
            </div>
          ) : (
            <NScrollbar class="h-full">
              <div>
                {props.data.map((item) => (
                  <ProjectListItem
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
      </div>
    )
  },
})

const ProjectListItem = defineComponent({
  name: 'ProjectListItem',
  props: {
    data: {
      type: Object as PropType<ProjectModel>,
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
        {/* Avatar */}
        <div class="shrink-0">
          {props.data.avatar ? (
            <NAvatar
              round
              size={40}
              src={props.data.avatar}
              fallbackSrc=""
              class="ring-1 ring-neutral-200 dark:ring-neutral-700"
            />
          ) : (
            <div class="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-sm font-semibold uppercase text-neutral-600 ring-1 ring-neutral-200 dark:from-neutral-800 dark:to-neutral-700 dark:text-neutral-300 dark:ring-neutral-700">
              {textToBigCharOrWord(props.data.name)}
            </div>
          )}
        </div>

        {/* Content */}
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {props.data.name}
            </h3>
            {props.data.projectUrl && (
              <ExternalLink class="h-3 w-3 shrink-0 text-neutral-400" />
            )}
          </div>
          {props.data.description && (
            <p class="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
              {props.data.description}
            </p>
          )}
          <div class="mt-1 text-xs text-neutral-400">
            <RelativeTime time={props.data.created} />
          </div>
        </div>
      </div>
    )
  },
})
