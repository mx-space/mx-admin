import {
  Book as BookIcon,
  Code as CodeIcon,
  File as FileIcon,
} from 'lucide-vue-next'
import { defineComponent } from 'vue'
import type { DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

import { RelativeTime } from '~/components/time/relative-time'
import { DraftRefType } from '~/models/draft'

const refTypeConfig = {
  [DraftRefType.Post]: {
    label: '文章',
    icon: CodeIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  [DraftRefType.Note]: {
    label: '手记',
    icon: BookIcon,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50',
  },
  [DraftRefType.Page]: {
    label: '页面',
    icon: FileIcon,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
  },
}

export const DraftListItem = defineComponent({
  name: 'DraftListItem',
  props: {
    data: {
      type: Object as PropType<DraftModel>,
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
    const config = refTypeConfig[props.data.refType]

    return () => (
      <div
        class={[
          'cursor-pointer border-b border-neutral-100 px-4 py-2.5 transition-colors last:border-b-0 dark:border-neutral-800',
          props.selected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
        ]}
        onClick={props.onSelect}
      >
        <div class="flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h4 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {props.data.title || '无标题'}
              </h4>
              <span class="flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                v{props.data.version}
              </span>
            </div>

            <div class="mt-1 flex items-center gap-2 text-xs">
              <span
                class={[
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
                  config.bgColor,
                  config.color,
                ]}
              >
                <config.icon class="h-3 w-3" />
                {config.label}
              </span>

              {props.data.refId ? (
                <span class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  编辑中
                </span>
              ) : (
                <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  新建
                </span>
              )}
            </div>
          </div>

          <div class="flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
            <RelativeTime time={props.data.updated} />
          </div>
        </div>
      </div>
    )
  },
})
