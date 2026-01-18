import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  ExternalLink,
  FileText,
  GripVertical,
  Pencil,
  Plus as AddIcon,
  Trash2,
} from 'lucide-vue-next'
import { NButton, NPopconfirm } from 'naive-ui'
import Sortable from 'sortablejs'
import { defineComponent, onBeforeUnmount, ref, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import type { PageModel } from '~/models/page'
import type { PropType } from 'vue'

import { pagesApi } from '~/api/pages'
import { RelativeTime } from '~/components/time/relative-time'
import { queryKeys } from '~/hooks/queries/keys'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { useLayout } from '../../layouts/content'

const PageItem = defineComponent({
  name: 'PageItem',
  props: {
    data: {
      type: Object as PropType<PageModel>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const row = props.data
      return (
        <div class="group flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
          <GripVertical class="drag-handle w-4 h-4 text-neutral-300 dark:text-neutral-600 cursor-grab active:cursor-grabbing shrink-0 hover:text-neutral-500 dark:hover:text-neutral-400" />

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-4">
              <span class="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {row.title}
              </span>
            </div>
            <div class="flex items-center gap-3 mt-0.5">
              <span class="text-xs text-neutral-500 dark:text-neutral-400">
                /{row.slug}
              </span>
              {row.subtitle && (
                <span class="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                  {row.subtitle}
                </span>
              )}
            </div>
          </div>

          <div class="shrink-0 flex items-center">
            <RelativeTime
              time={row.created}
              class="text-xs text-neutral-400 dark:text-neutral-500 group-hover:hidden"
            />
            <div class="hidden group-hover:flex items-center gap-1">
            <RouterLink to={`/pages/edit?id=${row.id}`}>
              <NButton quaternary size="tiny" class="!px-2">
                {{
                  icon: () => (
                    <Pencil class="w-3.5 h-3.5 text-neutral-500" />
                  ),
                }}
              </NButton>
            </RouterLink>

            <a
              href={`/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <NButton quaternary size="tiny" class="!px-2">
                {{
                  icon: () => (
                    <ExternalLink class="w-3.5 h-3.5 text-neutral-500" />
                  ),
                }}
              </NButton>
            </a>

            <NPopconfirm
              positiveText="取消"
              negativeText="删除"
              onNegativeClick={() => props.onDelete(row.id)}
            >
              {{
                trigger: () => (
                  <NButton quaternary size="tiny" class="!px-2">
                    {{
                      icon: () => (
                        <Trash2 class="w-3.5 h-3.5 text-red-500" />
                      ),
                    }}
                  </NButton>
                ),
                default: () => (
                  <span class="max-w-48">确定要删除「{row.title}」？</span>
                ),
              }}
            </NPopconfirm>
            </div>
          </div>
        </div>
      )
    }
  },
})

const EmptyState = defineComponent({
  name: 'EmptyState',
  setup() {
    return () => (
      <div class="flex flex-col items-center justify-center py-16">
        <FileText class="w-12 h-12 mb-4 text-neutral-300 dark:text-neutral-600" />
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          还没有页面
        </p>
        <RouterLink
          to="/pages/edit"
          class="mt-4 text-sm text-blue-500 hover:text-blue-600 hover:underline"
        >
          创建第一个页面
        </RouterLink>
      </div>
    )
  },
})

const reorder = (data: any[], oldIndex: number, newIndex: number) => {
  const result = Array.from(data)
  const [removed] = result.splice(oldIndex, 1)
  result.splice(newIndex, 0, removed)
  return result
}

export const ManagePageListView = defineComponent({
  name: 'PageList',
  setup() {
    const queryClient = useQueryClient()

    // 获取页面列表
    const { data: pagesData, isLoading } = useQuery({
      queryKey: queryKeys.pages.list(),
      queryFn: () =>
        pagesApi.getList({
          page: 1,
          size: 50,
          select: 'title subtitle _id id created modified slug',
        }),
    })

    const data = ref<PageModel[]>([])

    // 同步 query 数据到本地 ref（用于拖拽排序）
    watchEffect(() => {
      if (pagesData.value?.data) {
        data.value = [...pagesData.value.data]
      }
    })

    // 删除 mutation
    const deleteMutation = useMutation({
      mutationFn: pagesApi.delete,
      onSuccess: () => {
        message.success('删除成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
      },
    })

    // 排序 mutation
    const reorderMutation = useMutation({
      mutationFn: pagesApi.reorder,
      onSuccess: () => {
        message.success('排序成功')
      },
    })

    const handleDelete = (id: string) => {
      // 乐观更新
      data.value = data.value.filter((i) => i.id !== id)
      deleteMutation.mutate(id)
    }

    const wrapperRef = ref<HTMLDivElement>()
    let sortable: Sortable | null = null

    watchOnce(
      () => data.value,
      () => {
        if (data.value.length === 0) return

        requestAnimationFrame(() => {
          if (!wrapperRef.value) return
          sortable = new Sortable(wrapperRef.value, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'opacity-50',
            chosenClass: '!bg-neutral-100 dark:!bg-neutral-800',
            onEnd(evt) {
              if (
                typeof evt.oldIndex === 'undefined' ||
                typeof evt.newIndex === 'undefined'
              )
                return
              if (evt.oldIndex === evt.newIndex) return

              const reorderData = reorder(
                data.value,
                evt.oldIndex,
                evt.newIndex,
              )
              data.value = reorderData

              const seq = [...reorderData]
                .reverse()
                .map((item, idx) => ({ id: item.id, order: idx + 1 }))
              reorderMutation.mutate(seq)
            },
          })
        })
      },
    )

    onBeforeUnmount(() => sortable?.destroy())

    const { setActions } = useLayout()
    setActions(<HeaderActionButton to="/pages/edit" icon={<AddIcon />} />)

    return () => (
      <div class="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
        {isLoading.value ? (
          <div class="flex items-center justify-center py-16">
            <span class="text-sm text-neutral-400">加载中...</span>
          </div>
        ) : data.value.length === 0 ? (
          <EmptyState />
        ) : (
          <div ref={wrapperRef}>
            {data.value.map((item) => (
              <PageItem
                data={item}
                key={item.id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    )
  },
})
