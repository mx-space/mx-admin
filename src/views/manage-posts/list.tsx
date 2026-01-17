import {
  Plus as AddIcon,
  Book as BookIcon,
  ExternalLink,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Pencil,
  Pin as PhPushPin,
  ThumbsUp as ThumbsUpIcon,
  Trash2,
} from 'lucide-vue-next'
import {
  NButton,
  NIcon,
  NPopconfirm,
  NPopover,
  NSpace,
  useMessage,
} from 'naive-ui'
import type {
  FilterOption,
  FilterState,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import { computed, defineComponent, onMounted, reactive, watch } from 'vue'
import type { ComputedRef, PropType } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type {
  CategoryWithChildrenModel,
  PickedPostModelInCategoryChildren,
} from '~/models/category'
import type { PostModel, PostResponse } from '../../models/post'

import { TableTitleLink } from '~/components/link/title-link'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { StatusToggle } from '~/components/status-toggle'
import { Table } from '~/components/table'
import { EditColumn } from '~/components/table/edit-column'
import { RelativeTime } from '~/components/time/relative-time'
import { WEB_URL } from '~/constants/env'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useDataTableFetch } from '~/hooks/use-table'
import { CategoryStore } from '~/stores/category'
import { UIStore } from '~/stores/ui'
import { parseDate } from '~/utils'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { useLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'

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
              class="truncate text-[13px] font-medium text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
            >
              {row.value.title}
            </RouterLink>
          </div>

          {/* Meta row - all in one line with consistent sizing */}
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {props.categoryName && (
              <span class="rounded bg-neutral-100 px-1 py-px text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {props.categoryName}
              </span>
            )}
            {row.value.tags && row.value.tags.length > 0 && (
              <span class="max-w-24 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                {row.value.tags.slice(0, 2).join('、')}
                {row.value.tags.length > 2 && '…'}
              </span>
            )}
            <span class="flex items-center gap-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
              <BookIcon class="h-2.5 w-2.5" />
              {row.value.count?.read || 0}
            </span>
            <span class="flex items-center gap-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
              <ThumbsUpIcon class="h-2.5 w-2.5" />
              {row.value.count?.like || 0}
            </span>
            <span class="text-[11px] text-neutral-400 dark:text-neutral-500">
              ·
            </span>
            <RelativeTime
              time={row.value.created}
              class="text-[11px] text-neutral-400 dark:text-neutral-500"
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
    const { loading, checkedRowKeys, data, pager, sortProps, fetchDataFn } =
      useDataTableFetch(
        (data, pager) =>
          async (page = route.query.page || 1, size = 20) => {
            const response = await RESTManager.api.posts.get<PostResponse>({
              params: {
                page,
                size,
                select:
                  'title _id id created modified slug categoryId copyright tags count pin meta isPublished',
                ...(sortProps.sortBy
                  ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
                  : {}),
              },
            })

            data.value = response.data
            pager.value = response.pagination
          },
      )

    const message = useMessage()
    const route = useRoute()
    const fetchData = fetchDataFn
    const ui = useStoreRef(UIStore)
    const isMobile = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )

    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    const categoryStore = useStoreRef(CategoryStore)

    onMounted(async () => {
      await fetchData()
      await categoryStore.fetch()
    })

    const handleDelete = async (id: string) => {
      await RESTManager.api.posts(id).delete()
      message.success('删除成功')
      await fetchData(pager.value.currentPage)
    }

    const handleTogglePublish = async (id: string, newStatus: boolean) => {
      try {
        await RESTManager.api
          .posts(id)('publish')
          .patch({
            data: { isPublished: newStatus },
          })
        const item = data.value.find((i) => i.id === id)
        if (item) item.isPublished = newStatus
        message.success(newStatus ? '已发布' : '已设为草稿')
      } catch {
        message.error('操作失败')
      }
    }

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
            {pager.value.totalPage > 1 && (
              <div class="flex items-center justify-center gap-4 border-t border-neutral-200 py-4 dark:border-neutral-800">
                <button
                  class="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  disabled={!pager.value.hasPrevPage}
                  onClick={() => {
                    if (pager.value.hasPrevPage) {
                      fetchData(pager.value.currentPage - 1)
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
                    if (pager.value.hasNextPage) {
                      fetchData(pager.value.currentPage + 1)
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
                    await RESTManager.api.posts(row.id).patch({
                      data: {
                        categoryId: v,
                      },
                    })

                    message.success('修改成功')
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
              onUpdateFilters: async (filterState: FilterState) => {
                if (!filterState) {
                  return
                }

                if (
                  filterState.category &&
                  Array.isArray(filterState.category)
                ) {
                  const len = filterState.category.length
                  if (!len) {
                    await fetchData()
                    return
                  }
                  const ids = filterState.category.join(',')

                  const { entries: _data } =
                    await RESTManager.api.categories.get<{
                      entries: Record<string, CategoryWithChildrenModel>
                    }>({
                      params: {
                        ids,
                      },
                    })

                  const concatList: PickedPostModelInCategoryChildren[] =
                    Object.values(_data)
                      .reduce((list, cur) => {
                        const children = cur.children?.map((i) => {
                          Object.defineProperty(i, 'categoryId', {
                            value: cur.id,
                            enumerable: true,
                          })
                          Object.defineProperty(i, 'category', {
                            get() {
                              return cur
                            },

                            enumerable: false,
                          })

                          return i
                        })
                        return [...list, ...children]
                      }, [] as PickedPostModelInCategoryChildren[])
                      .sort(
                        (a, b) => +new Date(a.created) - +new Date(b.created),
                      )

                  data.value = concatList as any
                  pager.value = {
                    currentPage: 1,
                    total: 1,
                    size: 0,
                    hasNextPage: false,
                    hasPrevPage: false,
                    totalPage: 1,
                  }
                }
              },
            }}
            onFetchData={fetchData}
            pager={pager}
            onUpdateCheckedRowKeys={(keys) => {
              checkedRowKeys.value = keys
            }}
            onUpdateSorter={async (props) => {
              sortProps.sortBy = props.sortBy
              sortProps.sortOrder = props.sortOrder
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
                checkedRowKeys.value.map((id) =>
                  RESTManager.api.posts(id as string).delete(),
                ),
              )

              for (const s of status) {
                if (s.status === 'rejected') {
                  message.success(`删除失败，${s.reason.message}`)
                }
              }

              checkedRowKeys.value.length = 0
              fetchData()
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
                    RESTManager.api
                      .posts(id as string)('publish')
                      .patch({
                        data: { isPublished: true },
                      }),
                  ),
                )
                message.success('批量发布成功')
                fetchData() // 重新获取数据
                checkedRowKeys.value = []
              } catch (_error) {
                message.error('批量发布失败')
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
                    RESTManager.api
                      .posts(id as string)('publish')
                      .patch({
                        data: { isPublished: false },
                      }),
                  ),
                )
                message.success('批量设置草稿成功')
                fetchData() // 重新获取数据
                checkedRowKeys.value = []
              } catch (_error) {
                message.error('批量设置草稿失败')
              }
            }}
          />
          <HeaderActionButton to={'/posts/edit'} icon={<AddIcon />} />
        </>,
      )
    })

    return () => (isMobile.value ? <CardList /> : <DataTable />)
  },
})
