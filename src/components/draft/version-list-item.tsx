import { CheckIcon, ClockIcon, FileTextIcon } from 'lucide-vue-next'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

import { RelativeTime } from '~/components/time/relative-time'

export interface DiffStats {
  added: number
  removed: number
}

export const VersionListItem = defineComponent({
  name: 'VersionListItem',
  props: {
    version: {
      type: [Number, String] as PropType<number | 'published' | 'current'>,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    savedAt: {
      type: String,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    diffStats: {
      type: Object as PropType<DiffStats>,
      default: undefined,
    },
    onClick: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const getVersionLabel = () => {
      if (props.version === 'published') {
        return '已发布版本'
      }
      if (props.version === 'current') {
        return '当前草稿'
      }
      return `草稿 v${props.version}`
    }

    return () => (
      <div
        class={[
          'cursor-pointer rounded-lg border p-3 transition-all',
          props.isSelected
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800',
        ]}
        onClick={props.onClick}
      >
        <div class="flex items-start gap-2">
          <div class="mt-0.5 flex-shrink-0">
            {props.isSelected ? (
              <div class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                <CheckIcon class="h-3 w-3 text-white" />
              </div>
            ) : (
              <div class="h-4 w-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
            )}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span
                class={[
                  'text-sm font-medium',
                  props.isSelected
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-neutral-900 dark:text-neutral-100',
                ]}
              >
                {getVersionLabel()}
              </span>
              {props.isCurrent && (
                <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  当前
                </span>
              )}
            </div>

            <p class="mt-1 flex items-center gap-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
              <FileTextIcon class="h-3 w-3 flex-shrink-0" />
              <span class="truncate">{props.title || '无标题'}</span>
            </p>

            <div class="mt-1 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
              <span class="flex items-center gap-1">
                <ClockIcon class="h-3 w-3" />
                <RelativeTime
                  time={props.savedAt}
                  showPopoverInfoAbsoluteTime
                />
              </span>

              {props.diffStats && (
                <span class="flex items-center gap-1">
                  <span class="text-green-600 dark:text-green-400">
                    +{props.diffStats.added}
                  </span>
                  <span class="text-red-600 dark:text-red-400">
                    -{props.diffStats.removed}
                  </span>
                  <span>字</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  },
})
