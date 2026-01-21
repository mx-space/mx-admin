import {
  Plus as AddIcon,
  Book as BookIcon,
  ExternalLink,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Pencil,
  Pin as PhPushPin,
  Search as SearchIcon,
  ThumbsUp as ThumbsUpIcon,
  Trash2,
} from 'lucide-vue-next'
import { NButton, NIcon, NInput, NPopconfirm, NPopover, NSpace } from 'naive-ui'
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  watchEffect,
} from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import type {
  FilterOption,
  FilterState,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import type { ComputedRef, PropType } from 'vue'
import type { PostModel } from '../../models/post'

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { debouncedRef } from '@vueuse/core'

import { postsApi } from '~/api/posts'
import { searchApi } from '~/api/search'
import { TableTitleLink } from '~/components/link/title-link'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { StatusToggle } from '~/components/status-toggle'
import { Table } from '~/components/table'
import { EditColumn } from '~/components/table/edit-column'
import { RelativeTime } from '~/components/time/relative-time'
import { WEB_URL } from '~/constants/env'
import { queryKeys } from '~/hooks/queries/keys'
import { useDataTable } from '~/hooks/use-data-table'
import { useStoreRef } from '~/hooks/use-store-ref'
import { CategoryStore } from '~/stores/category'
import { UIStore } from '~/stores/ui'
import { parseDate } from '~/utils'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { useLayout } from '../../layouts/content'

// Mobile card item component
const PostItem = defineComponent({
  name: 'PostItem',
  props: {
    data: {
      type: Object as PropType<PostModel>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onTogglePublish: {
      type: Function as PropType<
        (id: string, status: boolean) => Promise<void>
      >,
      required: true,
    },
    categoryName: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const row = computed(() => props.data)

    return () => (
      <div class="flex items-center gap-2 border-b border-neutral-200 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
        <div class="min-w-0 flex-1">
          {/* Title row */}
          <div class="flex items-center gap-1.5">
            {row.value.pin && (
              <PhPushPin class="h-3 w-3 shrink-0 text-orange-400" />
            )}
            <RouterLink
              to={`/posts/edit?id=${row.value.id}`}
              class="truncate text-sm font-medium text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
            >
              {row.value.title}
            </RouterLink>
          </div>

          {/* Meta row - all in one line with consistent sizing */}
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {props.categoryName && (
              <span class="rounded bg-neutral-100 px-1 py-px text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {props.categoryName}
              </span>
            )}
            {row.value.tags && row.value.tags.length > 0 && (
              <span class="max-w-24 truncate text-xs text-neutral-500 dark:text-neutral-400">
                {row.value.tags.slice(0, 2).join('、')}
                {row.value.tags.length > 2 && '…'}
              </span>
            )}
            <span class="flex items-center gap-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              <BookIcon class="h-2.5 w-2.5" />
              {row.value.count?.read || 0}
            </span>
            <span class="flex items-center gap-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              <ThumbsUpIcon class="h-2.5 w-2.5" />
              {row.value.count?.like || 0}
            </span>
            <span class="text-xs text-neutral-400 dark:text-neutral-500">
              ·
            </span>
            <RelativeTime
              time={row.value.created}
              class="text-xs text-neutral-400 dark:text-neutral-500"
            />
            <StatusToggle
              isPublished={row.value.isPublished ?? false}
              size="small"
              onToggle={(status) => props.onTogglePublish(row.value.id, status)}
            />
          </div>
        </div>

        {/* Actions */}
        <div class="flex shrink-0 items-center">
          <a
            href={`${WEB_URL}/posts/${row.value.category?.slug}/${row.value.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="在新窗口打开文章"
          >
            <NButton quaternary size="tiny" class="!px-1.5">
              {{
                icon: () => (
                  <ExternalLink class="h-3.5 w-3.5 text-neutral-500" />
                ),
              }}
            </NButton>
          </a>

          <RouterLink
            to={`/posts/edit?id=${row.value.id}`}
            aria-label="编辑文章"
          >
            <NButton quaternary size="tiny" class="!px-1.5">
              {{
                icon: () => <Pencil class="h-3.5 w-3.5 text-neutral-500" />,
              }}
            </NButton>
          </RouterLink>

          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={() => props.onDelete(row.value.id)}
          >
            {{
              trigger: () => (
                <NButton
                  quaternary
                  size="tiny"
                  class="!px-1.5"
                  aria-label="删除文章"
                >
                  {{
                    icon: () => <Trash2 class="h-3.5 w-3.5 text-red-500" />,
                  }}
                </NButton>
              ),
              default: () => (
                <span class="max-w-48">确定要删除「{row.value.title}」？</span>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

export const ManagePostListView = defineComponent({
  name: 'PostList',
  setup() {
    const queryClient = useQueryClient()
    // 搜索关键词
    const searchKeyword = ref('')
    const debouncedSearch = debouncedRef(searchKeyword, 300)

    // 分类筛选条件（支持多选）
    const categoryFilter = ref<string[] | undefined>(undefined)

    const {
      isLoading: loading,
      checkedRowKeys,
      data,
      pager,
      refresh,
      setSort,
      setPage,
    } = useDataTable<PostModel>({
      queryKey: (params) => queryKeys.posts.list(params),
      queryFn: (params) => {
        const keyword = params.filters?.search
        // 有搜索关键词时使用搜索 API
        if (keyword) {
          return searchApi.searchPosts({
            keyword,
            page: params.page,
            size: params.size,
          })
        }
        // 否则使用列表 API
        return postsApi.getList({
          page: params.page,
          size: params.size,
          select:
            'title _id id created modified slug categoryId copyright tags count pin meta isPublished',
          categoryIds: params.filters?.categoryIds,
          ...(params.sortBy
            ? {
                sortBy: params.sortBy,
                sortOrder: params.sortOrder,
              }
            : {}),
        })
      },
      pageSize: 20,
      filters: () => ({
        categoryIds: categoryFilter.value,
        search: debouncedSearch.value || undefined,
      }),
    })

    const ui = useStoreRef(UIStore)
    const isMobile = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )

    const categoryStore = useStoreRef(CategoryStore)

    onMounted(async () => {
      await categoryStore.fetch()
    })

    // 删除 mutation
    const deleteMutation = useMutation({
      mutationFn: postsApi.delete,
      onSuccess: () => {
        toast.success('删除成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
      },
    })

    // 更新发布状态 mutation
    const patchMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<PostModel> }) =>
        postsApi.patch(id, data),
    })

    const handleDelete = async (id: string) => {
      deleteMutation.mutate(id)
    }

    const handleTogglePublish = async (id: string, newStatus: boolean) => {
      try {
        await patchMutation.mutateAsync({
          id,
          data: { isPublished: newStatus },
        })
        // 乐观更新
        const item = data.value.find((i) => i.id === id)
        if (item) item.isPublished = newStatus
        toast.success(newStatus ? '已发布' : '已设为草稿')
      } catch {
        toast.error('操作失败')
      }
    }

    const fetchData = refresh

    // Mobile card list view
    const CardList = defineComponent({
      setup() {
        return () => (
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {loading.value ? (
              <div class="flex items-center justify-center py-16">
                <span class="text-sm text-neutral-400">加载中…</span>
              </div>
            ) : data.value.length === 0 ? (
              <div class="flex flex-col items-center justify-center py-16">
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  暂无文章
                </p>
                <RouterLink
                  to="/posts/edit"
                  class="mt-4 text-sm text-blue-500 hover:text-blue-600 hover:underline"
                >
                  创建第一篇文章
                </RouterLink>
              </div>
            ) : (
              <div>
                {data.value.map((item) => (
                  <PostItem
                    key={item.id}
                    data={item}
                    categoryName={
                      categoryStore.map.value?.get(item.categoryId)?.name ?? ''
                    }
                    onDelete={handleDelete}
                    onTogglePublish={handleTogglePublish}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pager.value && pager.value.totalPage > 1 && (
              <div class="flex items-center justify-center gap-4 border-t border-neutral-200 py-4 dark:border-neutral-800">
                <button
                  class="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  disabled={!pager.value.hasPrevPage}
                  onClick={() => {
                    if (pager.value?.hasPrevPage) {
                      setPage(pager.value.currentPage - 1)
                    }
                  }}
                >
                  上一页
                </button>
                <span class="text-sm text-neutral-500 dark:text-neutral-400">
                  {pager.value.currentPage} / {pager.value.totalPage}
                </span>
                <button
                  class="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  disabled={!pager.value.hasNextPage}
                  onClick={() => {
                    if (pager.value?.hasNextPage) {
                      setPage(pager.value.currentPage + 1)
                    }
                  }}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )
      },
    })

    // Desktop table view
    const DataTable = defineComponent({
      setup() {
        const categoryFilterOptions: ComputedRef<FilterOption[]> = computed(
          () =>
            categoryStore.data.value?.map((i) => ({
              label: i.name,
              value: i.id,
            })) || [],
        )

        const columns = reactive<TableColumns<PostModel>>([
          {
            type: 'selection',
            fixed: 'left',
            options: ['none', 'all'],
          },
          {
            title: '标题',
            key: 'title',
            width: 280,
            fixed: 'left',
            render(row) {
              return (
                <div class={'flex flex-grow items-center space-x-2'}>
                  {row.pin && (
                    <NPopover>
                      {{
                        trigger() {
                          return (
                            <NIcon class={'shrink-0 text-orange-400'}>
                              <PhPushPin />
                            </NIcon>
                          )
                        },
                        default() {
                          if (!row.pin) return null
                          return (
                            <span>
                              置顶于{' '}
                              {parseDate(row.pin, 'yyyy 年 M 月 d 日 HH:mm:ss')}
                            </span>
                          )
                        },
                      }}
                    </NPopover>
                  )}
                  <div class={'w-0 flex-grow'}>
                    <TableTitleLink
                      id={row.id}
                      title={row.title}
                      inPageTo={`/posts/edit?id=${row.id}`}
                      externalLinkTo={`/posts/${row.category.slug}/${row.slug}`}
                    />
                  </div>
                </div>
              )
            },
          },
          {
            title: '分类',
            sortOrder: false,
            sorter: 'default',
            key: 'category',
            width: 100,
            ellipsis: true,
            // @ts-expect-error
            filterOptions: categoryFilterOptions,
            filter: true,
            render(row) {
              const map = categoryStore.map.value

              if (!map) {
                return ''
              }

              return (
                <EditColumn
                  returnToConfrim={false}
                  initialValue={
                    categoryStore.map.value.get(row.categoryId)?.name ?? ''
                  }
                  onSubmit={async (v) => {
                    await postsApi.patch(row.id, { categoryId: v })
                    toast.success('修改成功')
                    data.value.find((i) => i.id === row.id)!.categoryId = v
                  }}
                  type="select"
                  options={
                    categoryStore.data.value?.map((i) => ({
                      label: i.name,
                      value: i.id,
                      key: i.id,
                    })) || []
                  }
                />
              )
            },
          },
          {
            title: '标签',
            key: 'tags',
            width: 100,
            ellipsis: true,
            render(row) {
              return row.tags?.join('，')
            },
          },
          {
            title: () => <BookIcon class="h-4 w-4" />,
            key: 'count.read',
            width: 50,
            render(row) {
              return row.count?.read || 0
            },
          },
          {
            title: () => <ThumbsUpIcon class="h-4 w-4" />,
            width: 50,
            key: 'count.like',
            render(row) {
              return row.count?.like || 0
            },
          },
          {
            title: '创建于',
            width: 100,
            key: 'created',
            sortOrder: 'descend',
            sorter: 'default',
            render(row) {
              return <RelativeTime time={row.created} />
            },
          },
          {
            title: '修改于',
            key: 'modified',
            sorter: 'default',
            sortOrder: false,
            width: 100,
            render(row) {
              return <RelativeTime time={row.modified} />
            },
          },
          {
            title: '状态',
            key: 'isPublished',
            width: 120,
            render(row) {
              return (
                <StatusToggle
                  isPublished={row.isPublished ?? false}
                  onToggle={(newStatus) =>
                    handleTogglePublish(row.id, newStatus)
                  }
                />
              )
            },
          },
          {
            title: '操作',
            fixed: 'right',
            width: 60,
            key: 'id',
            render(row) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={() => handleDelete(row.id)}
                  >
                    {{
                      trigger: () => (
                        <NButton quaternary type="error" size="tiny">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">确定要删除 {row.title} ?</span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ])

        return () => (
          <Table
            loading={loading.value}
            columns={columns}
            data={data}
            nTableProps={{
              onUpdateFilters: (filterState: FilterState) => {
                const categoryIds = filterState.category as string[] | null
                categoryFilter.value =
                  categoryIds && categoryIds.length > 0
                    ? categoryIds
                    : undefined
                setPage(1)
              },
            }}
            onFetchData={fetchData}
            pager={pager as any}
            onUpdateCheckedRowKeys={(keys) => {
              checkedRowKeys.value = keys
            }}
            onUpdateSorter={async (props) => {
              setSort(props.sortBy, props.sortOrder as 0 | 1 | -1)
            }}
          />
        )
      },
    })

    const { setActions } = useLayout()

    watchEffect(() => {
      setActions(
        <>
          <DeleteConfirmButton
            checkedRowKeys={checkedRowKeys.value}
            onDelete={async () => {
              const status = await Promise.allSettled(
                checkedRowKeys.value.map((id) => postsApi.delete(id as string)),
              )

              for (const s of status) {
                if (s.status === 'rejected') {
                  toast.success(`删除失败，${(s.reason as Error).message}`)
                }
              }

              checkedRowKeys.value.length = 0
              queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
            }}
          />

          <HeaderActionButton
            name="批量发布"
            disabled={checkedRowKeys.value.length === 0}
            icon={<EyeIcon />}
            variant="success"
            onClick={async () => {
              try {
                await Promise.all(
                  checkedRowKeys.value.map((id) =>
                    postsApi.patch(id as string, { isPublished: true }),
                  ),
                )
                toast.success('批量发布成功')
                queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
                checkedRowKeys.value = []
              } catch (_error) {
                toast.error('批量发布失败')
              }
            }}
          />

          <HeaderActionButton
            name="批量设为草稿"
            disabled={checkedRowKeys.value.length === 0}
            icon={<EyeOffIcon />}
            variant="warning"
            onClick={async () => {
              try {
                await Promise.all(
                  checkedRowKeys.value.map((id) =>
                    postsApi.patch(id as string, { isPublished: false }),
                  ),
                )
                toast.success('批量设置草稿成功')
                queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
                checkedRowKeys.value = []
              } catch (_error) {
                toast.error('批量设置草稿失败')
              }
            }}
          />
          <HeaderActionButton to={'/posts/edit'} icon={<AddIcon />} />
        </>,
      )
    })

    return () => (
      <div class="flex flex-col gap-4">
        {/* 搜索框 */}
        <div class="flex items-center gap-2">
          <NInput
            v-model:value={searchKeyword.value}
            placeholder="搜索标题..."
            clearable
            class="max-w-xs"
          >
            {{
              prefix: () => <SearchIcon class="h-4 w-4 text-neutral-400" />,
            }}
          </NInput>
        </div>

        {isMobile.value ? <CardList /> : <DataTable />}
      </div>
    )
  },
})
