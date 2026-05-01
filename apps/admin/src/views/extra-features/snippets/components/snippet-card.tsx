import {
  Code as CodeIcon,
  ExternalLink as ExternalLinkIcon,
  FileCode as FileCodeIcon,
  FileJson as FileJsonIcon,
  FileText as FileTextIcon,
  FunctionSquare as FunctionIcon,
  Lock as LockIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import { NPopconfirm } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { SnippetModel } from '../../../../models/snippet'

import { RelativeTime } from '~/components/time/relative-time'
import { API_URL } from '~/constants/env'

import { SnippetType } from '../../../../models/snippet'

export const SnippetCard = defineComponent({
  name: 'SnippetCard',
  props: {
    snippet: {
      type: Object as PropType<SnippetModel>,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: false,
    },
    onSelect: {
      type: Function as PropType<(snippet: SnippetModel) => void>,
    },
    onDelete: {
      type: Function as PropType<(snippet: SnippetModel) => void>,
    },
  },
  setup(props) {
    const isFunction = computed(
      () => props.snippet.type === SnippetType.Function,
    )
    const isBuiltIn = computed(() => isFunction.value && props.snippet.builtIn)

    const typeIcon = computed(() => {
      switch (props.snippet.type) {
        case SnippetType.JSON:
          return FileJsonIcon
        case SnippetType.JSON5:
          return CodeIcon
        case SnippetType.Function:
          return FunctionIcon
        case SnippetType.Text:
          return FileTextIcon
        case SnippetType.YAML:
          return FileCodeIcon
        default:
          return FileTextIcon
      }
    })

    const typeIconColor = computed(() => {
      switch (props.snippet.type) {
        case SnippetType.JSON:
          return 'text-orange-500'
        case SnippetType.JSON5:
          return 'text-purple-500'
        case SnippetType.Function:
          return 'text-blue-500'
        case SnippetType.Text:
          return 'text-neutral-500'
        case SnippetType.YAML:
          return 'text-red-500'
        default:
          return 'text-neutral-500'
      }
    })

    const snippetUrl = computed(() => {
      const s = props.snippet
      if (s.customPath) return `${API_URL}/s/${s.customPath}`
      const path =
        s.type === SnippetType.Function
          ? `/fn/${s.reference}/${s.name}`
          : `/snippets/${s.reference}/${s.name}`
      return `${API_URL}${path}`
    })

    const handleClick = () => {
      props.onSelect?.(props.snippet)
    }

    const handleDoubleClick = (e: MouseEvent) => {
      // Avoid triggering when double-clicking interactive controls inside the card
      const target = e.target as HTMLElement | null
      if (target?.closest('button, a, input, textarea, [role="button"]')) return

      window.open(snippetUrl.value, '_blank')
    }

    const handleExternalLink = (e: MouseEvent) => {
      e.stopPropagation()
      window.open(snippetUrl.value, '_blank')
    }

    const handleDelete = () => {
      props.onDelete?.(props.snippet)
    }

    return () => {
      const { snippet, selected, compact } = props
      const deleteText = isBuiltIn.value ? '重置' : '删除'

      if (compact) {
        return (
          <div
            class={[
              'group relative flex cursor-pointer items-center gap-1.5 px-2 py-1.5 transition-colors',
              'hover:bg-neutral-100 dark:hover:bg-neutral-800/50',
              selected && 'bg-neutral-100 dark:bg-neutral-800',
            ]}
            onClick={handleClick}
            onDblclick={handleDoubleClick}
            title="双击打开访问地址"
          >
            {(() => {
              const Icon = typeIcon.value
              return (
                <Icon class={`size-3 flex-shrink-0 ${typeIconColor.value}`} />
              )
            })()}

            <span
              class={[
                'flex-1 truncate text-sm',
                snippet.enable === false
                  ? 'text-neutral-400 line-through dark:text-neutral-500'
                  : 'text-neutral-700 dark:text-neutral-300',
                selected && 'font-medium text-neutral-900 dark:text-white',
              ]}
            >
              {snippet.name}
            </span>

            {snippet.private && (
              <LockIcon class="size-3 flex-shrink-0 text-neutral-400" />
            )}

            <NPopconfirm
              positiveText="取消"
              negativeText={deleteText}
              onNegativeClick={handleDelete}
            >
              {{
                trigger: () => (
                  <button
                    class="rounded p-0.5 text-red-500 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100 dark:hover:bg-red-900/50"
                    onClick={(e: MouseEvent) => e.stopPropagation()}
                  >
                    <TrashIcon class="size-3" />
                  </button>
                ),
                default: () => (
                  <span class="max-w-48">
                    确定要{deleteText} {snippet.name}?
                  </span>
                ),
              }}
            </NPopconfirm>
          </div>
        )
      }

      return (
        <div
          class={[
            'group relative cursor-pointer border-b border-neutral-200 px-3 py-2.5 transition-colors',
            'hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50',
            selected && 'bg-neutral-100 dark:bg-neutral-800/80',
          ]}
          onClick={handleClick}
          onDblclick={handleDoubleClick}
          title="双击打开访问地址"
        >
          <div class="flex items-center gap-1.5">
            {(() => {
              const Icon = typeIcon.value
              return (
                <Icon class={`size-3.5 flex-shrink-0 ${typeIconColor.value}`} />
              )
            })()}

            <span
              class={[
                'truncate text-sm font-medium',
                snippet.enable === false
                  ? 'text-neutral-400 line-through dark:text-neutral-500'
                  : 'text-neutral-900 dark:text-neutral-100',
                selected && 'text-neutral-900 dark:text-white',
              ]}
            >
              {snippet.name}
            </span>

            {snippet.private && (
              <LockIcon class="size-3 flex-shrink-0 text-neutral-400" />
            )}
          </div>

          <div class="mt-1 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span class="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-700">
              {snippet.type.toUpperCase()}
            </span>

            {isFunction.value && snippet.method !== 'GET' && (
              <span class="text-amber-600 dark:text-amber-400">
                {snippet.method}
              </span>
            )}

            {snippet.created && (
              <RelativeTime
                time={snippet.created}
                class="ml-auto flex-shrink-0"
              />
            )}
          </div>

          {snippet.comment && (
            <div class="mt-1 truncate text-xs text-neutral-400 dark:text-neutral-500">
              {snippet.comment}
            </div>
          )}

          {/* Hover Actions */}
          <div
            class={[
              'absolute right-2 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity',
              'group-hover:opacity-100',
            ]}
          >
            <button
              class="rounded p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              onClick={handleExternalLink}
              title="在新窗口打开"
            >
              <ExternalLinkIcon class="size-3.5 text-neutral-500" />
            </button>

            <NPopconfirm
              positiveText="取消"
              negativeText={deleteText}
              onNegativeClick={handleDelete}
            >
              {{
                trigger: () => (
                  <button
                    class="rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                    onClick={(e: MouseEvent) => e.stopPropagation()}
                    title={deleteText}
                  >
                    <TrashIcon class="size-3.5" />
                  </button>
                ),
                default: () => (
                  <span class="max-w-48">
                    确定要{deleteText} {snippet.name} ?
                  </span>
                ),
              }}
            </NPopconfirm>
          </div>
        </div>
      )
    }
  },
})
