import {
  Book as BookIcon,
  Code as CodeIcon,
  FileEdit,
  File as FileIcon,
  History,
  Pencil,
  Plus as PlusIcon,
  Trash2,
} from 'lucide-vue-next'
import {
  NButton,
  NDropdown,
  NPopconfirm,
  NSelect,
  NSpin,
  useMessage,
} from 'naive-ui'
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { DraftModel } from '~/models/draft'
import type { PropType } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { RelativeTime } from '~/components/time/relative-time'
import { useLayout } from '~/layouts/content'
import { DraftRefType } from '~/models/draft'
import { RouteName } from '~/router/name'

import { HistoryPanel } from './components/history-panel'

// 类型映射
const refTypeConfig = {
  [DraftRefType.Post]: {
    label: '文章',
    icon: CodeIcon,
    editRoute: RouteName.EditPost,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  [DraftRefType.Note]: {
    label: '手记',
    icon: BookIcon,
    editRoute: RouteName.EditNote,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50',
  },
  [DraftRefType.Page]: {
    label: '页面',
    icon: FileIcon,
    editRoute: RouteName.EditPage,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
  },
}

// 草稿列表项组件
const DraftItem = defineComponent({
  name: 'DraftItem',
  props: {
    draft: {
      type: Object as PropType<DraftModel>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()
    const showHistory = ref(false)

    const config = computed(() => refTypeConfig[props.draft.refType])

    const handleEdit = () => {
      router.push({
        name: config.value.editRoute,
        query: { draftId: props.draft.id },
      })
    }

    return () => (
      <div class="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
        {/* 左侧内容 */}
        <div class="min-w-0 flex-1">
          {/* 标题行 */}
          <div class="flex items-center gap-2">
            <RouterLink
              to={{
                name: config.value.editRoute,
                query: { draftId: props.draft.id },
              }}
              class="truncate text-sm font-medium text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
            >
              {props.draft.title || '无标题'}
            </RouterLink>
          </div>

          {/* 元信息行 */}
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span
              class={[
                'rounded px-1.5 py-0.5 text-xs',
                config.value.bgColor,
                config.value.color,
              ]}
            >
              {config.value.label}
            </span>
            {props.draft.refId ? (
              <span class="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                编辑中
              </span>
            ) : (
              <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                新建
              </span>
            )}
            <span class="text-neutral-300 dark:text-neutral-600">·</span>
            <span class="text-neutral-400 dark:text-neutral-500">
              v{props.draft.version}
            </span>
            <span class="text-neutral-300 dark:text-neutral-600">·</span>
            <RelativeTime
              time={props.draft.updated}
              class="text-neutral-400 dark:text-neutral-500"
            />
          </div>
        </div>

        {/* 右侧操作 */}
        <div class="flex shrink-0 items-center gap-1">
          <NButton quaternary size="tiny" onClick={handleEdit}>
            {{
              icon: () => <Pencil class="h-3.5 w-3.5 text-neutral-500" />,
            }}
          </NButton>
          <NButton
            quaternary
            size="tiny"
            onClick={() => (showHistory.value = true)}
          >
            {{
              icon: () => <History class="h-3.5 w-3.5 text-neutral-500" />,
            }}
          </NButton>
          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={() => props.onDelete(props.draft.id)}
          >
            {{
              trigger: () => (
                <NButton quaternary size="tiny">
                  {{
                    icon: () => <Trash2 class="h-3.5 w-3.5 text-red-500" />,
                  }}
                </NButton>
              ),
              default: () => (
                <span class="max-w-48">
                  确定要删除「{props.draft.title || '无标题'}」？
                </span>
              ),
            }}
          </NPopconfirm>
        </div>

        {/* 版本历史面板 */}
        <HistoryPanel
          draftId={props.draft.id}
          show={showHistory.value}
          onUpdateShow={(v: boolean) => (showHistory.value = v)}
        />
      </div>
    )
  },
})

// 空状态组件
const EmptyState = defineComponent({
  name: 'EmptyState',
  setup() {
    const newOptions = [
      { label: '新建文章', key: 'post', route: RouteName.EditPost },
      { label: '新建手记', key: 'note', route: RouteName.EditNote },
      { label: '新建页面', key: 'page', route: RouteName.EditPage },
    ]

    return () => (
      <div class="flex flex-col items-center justify-center py-16">
        <FileEdit class="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        <p class="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          暂无草稿
        </p>
        <p class="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          草稿会在编辑时自动保存到这里
        </p>
        <div class="mt-6 flex gap-2">
          {newOptions.map((option) => (
            <RouterLink key={option.key} to={{ name: option.route }}>
              <NButton size="small" tertiary>
                {option.label}
              </NButton>
            </RouterLink>
          ))}
        </div>
      </div>
    )
  },
})

// 主页面组件
export default defineComponent({
  name: 'DraftsView',
  setup() {
    const message = useMessage()
    const queryClient = useQueryClient()

    // 筛选状态
    const filterType = ref<DraftRefType | 'all'>('all')

    // 查询草稿列表
    const { data, isLoading } = useQuery({
      queryKey: ['drafts', 'list', filterType],
      queryFn: () =>
        draftsApi.getList({
          page: 1,
          size: 50,
          refType: filterType.value === 'all' ? undefined : filterType.value,
        }),
    })

    // 删除草稿
    const deleteMutation = useMutation({
      mutationFn: draftsApi.delete,
      onSuccess: () => {
        message.success('删除成功')
        queryClient.invalidateQueries({ queryKey: ['drafts'] })
      },
      onError: () => {
        message.error('删除失败')
      },
    })

    const handleDelete = (id: string) => {
      deleteMutation.mutate(id)
    }

    // 所有草稿（不分组）
    const allDrafts = computed(() => data.value?.data || [])

    // 筛选选项
    const filterOptions = [
      { label: '全部', value: 'all' },
      { label: '文章', value: DraftRefType.Post },
      { label: '手记', value: DraftRefType.Note },
      { label: '页面', value: DraftRefType.Page },
    ]

    // 新建下拉菜单
    const newOptions = [
      { label: '新建文章', key: 'post' },
      { label: '新建手记', key: 'note' },
      { label: '新建页面', key: 'page' },
    ]

    const router = useRouter()
    const handleNewSelect = (key: string) => {
      const routeMap: Record<string, string> = {
        post: RouteName.EditPost,
        note: RouteName.EditNote,
        page: RouteName.EditPage,
      }
      router.push({ name: routeMap[key] })
    }

    // 设置 Header 操作按钮
    const { setActions, setHeaderSubtitle } = useLayout()

    watchEffect(() => {
      const total = allDrafts.value.length
      setHeaderSubtitle(
        total > 0 ? (
          <span class="text-sm text-neutral-500">{total} 个草稿</span>
        ) : null,
      )

      setActions(
        <>
          <NSelect
            value={filterType.value}
            onUpdateValue={(v) => (filterType.value = v)}
            options={filterOptions}
            size="small"
            style={{ width: '100px' }}
          />
          <NDropdown
            options={newOptions}
            onSelect={handleNewSelect}
            trigger="click"
          >
            <HeaderActionButton icon={<PlusIcon />} name="新建" />
          </NDropdown>
        </>,
      )
    })

    return () => {
      if (isLoading.value) {
        return (
          <div class="flex items-center justify-center py-16">
            <NSpin />
          </div>
        )
      }

      if (allDrafts.value.length === 0) {
        return <EmptyState />
      }

      return (
        <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {allDrafts.value.map((draft) => (
            <DraftItem key={draft.id} draft={draft} onDelete={handleDelete} />
          ))}
        </div>
      )
    }
  },
})
