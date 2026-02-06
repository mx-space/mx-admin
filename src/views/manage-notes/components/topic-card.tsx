import { Hash, Pencil, Search, Trash2 } from 'lucide-vue-next'
import { NButton, NPopconfirm } from 'naive-ui'
import { defineComponent } from 'vue'
import type { TopicModel } from '~/models/topic'
import type { PropType } from 'vue'

import { textToBigCharOrWord } from '~/utils/word'

export const TopicListItem = defineComponent({
  name: 'TopicListItem',
  props: {
    topic: {
      type: Object as PropType<TopicModel>,
      required: true,
    },
    onEdit: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onViewDetail: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="group flex items-center gap-4 border-b border-neutral-200 px-4 py-4 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
        <div class="shrink-0">
          {props.topic.icon ? (
            <img
              src={props.topic.icon}
              alt={`${props.topic.name} 图标`}
              class="size-12 rounded-xl object-cover"
              loading="lazy"
            />
          ) : (
            <div class="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 text-lg font-semibold text-neutral-600 dark:from-neutral-800 dark:to-neutral-700 dark:text-neutral-300">
              {textToBigCharOrWord(props.topic.name)}
            </div>
          )}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 items-center gap-2">
            <h3
              class="shrink-0 truncate text-base font-medium text-neutral-900 dark:text-neutral-100"
              style={{ maxWidth: '40%' }}
            >
              {props.topic.name}
            </h3>
            <span class="flex min-w-0 items-center gap-1 text-sm text-neutral-400">
              <Hash class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="truncate font-mono">{props.topic.slug}</span>
            </span>
          </div>
          {props.topic.introduce && (
            <p class="mt-1 line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
              {props.topic.introduce}
            </p>
          )}
          {props.topic.description && (
            <p class="mt-0.5 line-clamp-1 text-sm text-neutral-400 dark:text-neutral-500">
              {props.topic.description}
            </p>
          )}
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <NButton
            size="tiny"
            quaternary
            onClick={() => props.onViewDetail(props.topic.id!)}
            aria-label={`查看 ${props.topic.name} 详情`}
          >
            {{
              icon: () => <Search class="size-3.5 text-neutral-500" />,
              default: () => <span class="hidden sm:inline">详情</span>,
            }}
          </NButton>

          <NButton
            size="tiny"
            quaternary
            type="primary"
            onClick={() => props.onEdit(props.topic.id!)}
            aria-label={`编辑 ${props.topic.name}`}
          >
            {{
              icon: () => <Pencil class="size-3.5" />,
              default: () => <span class="hidden sm:inline">编辑</span>,
            }}
          </NButton>

          <NPopconfirm onPositiveClick={() => props.onDelete(props.topic.id!)}>
            {{
              trigger: () => (
                <NButton
                  size="tiny"
                  quaternary
                  type="error"
                  aria-label={`删除 ${props.topic.name}`}
                >
                  <Trash2 class="size-3.5" />
                </NButton>
              ),
              default: () => <span>确定要删除「{props.topic.name}」吗？</span>,
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

export const TopicEmptyState = defineComponent({
  name: 'TopicEmptyState',
  props: {
    onAdd: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Hash class="size-8 text-neutral-400" aria-hidden="true" />
        </div>
        <h3 class="mb-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">
          暂无专栏
        </h3>
        <p class="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          创建专栏来组织和分类你的日记
        </p>
        <NButton type="primary" onClick={props.onAdd}>
          创建第一个专栏
        </NButton>
      </div>
    )
  },
})

export const TopicListSkeleton = defineComponent({
  name: 'TopicListSkeleton',
  setup() {
    return () => (
      <div class="animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            class="flex items-center gap-4 border-b border-neutral-200 px-4 py-4 last:border-b-0 dark:border-neutral-800"
          >
            <div class="size-12 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
            <div class="flex-1">
              <div class="h-5 w-36 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div class="mt-2 h-4 w-56 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div class="flex gap-2">
              <div class="h-7 w-14 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div class="h-7 w-14 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    )
  },
})
