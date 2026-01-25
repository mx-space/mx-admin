import { NAvatar, NCheckbox } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { CommentModel } from '~/models/comment'
import type { PropType } from 'vue'

import { RelativeTime } from '~/components/time/relative-time'

export const CommentListItem = defineComponent({
  name: 'CommentListItem',
  props: {
    data: {
      type: Object as PropType<CommentModel>,
      required: true,
    },
    checked: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    onCheck: {
      type: Function as PropType<(checked: boolean) => void>,
      required: true,
    },
    onSelect: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const comment = computed(() => props.data)
    const isReply = computed(() => !!(comment.value as any).parent)

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.n-checkbox')) {
        return
      }
      props.onSelect()
    }

    const handleCheckboxClick = (e: MouseEvent) => {
      e.stopPropagation()
    }

    return () => (
      <div
        class={[
          'flex cursor-pointer items-start gap-2.5 px-4 py-3 transition-colors',
          props.selected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : props.checked
              ? 'bg-neutral-50 dark:bg-neutral-800/50'
              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
        ]}
        onClick={handleClick}
      >
        <div class="mt-0.5 shrink-0" onClick={handleCheckboxClick}>
          <NCheckbox
            checked={props.checked}
            onUpdateChecked={props.onCheck}
            size="small"
          />
        </div>

        <NAvatar
          circle
          src={comment.value.avatar}
          size={32}
          class="mt-0.5 shrink-0 bg-neutral-100 dark:bg-neutral-800"
        />

        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-1.5">
            <span class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {comment.value.author}
            </span>
            {isReply.value && (
              <span class="shrink-0 text-xs text-neutral-400">回复</span>
            )}
            <span class="ml-auto shrink-0 text-xs text-neutral-400">
              <RelativeTime time={comment.value.created} />
            </span>
          </div>
          <p class="mt-0.5 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {comment.value.text}
          </p>
          {comment.value.isWhispers && (
            <span class="mt-1 inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
              悄悄话
            </span>
          )}
        </div>
      </div>
    )
  },
})
