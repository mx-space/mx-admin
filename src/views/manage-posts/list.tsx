import { AddIcon, BookIcon, PhPushPin, ThumbsUpIcon, EyeIcon, EyeOffIcon } from '~/components/icons'
import { TableTitleLink } from '~/components/link/title-link'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { Table } from '~/components/table'
import { EditColumn } from '~/components/table/edit-column'
import { RelativeTime } from '~/components/time/relative-time'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useDataTableFetch } from '~/hooks/use-table'
import {
  NButton,
  NIcon,
  NPopconfirm,
  NPopover,
  NSpace,
  useMessage,
} from 'naive-ui'
import { CategoryStore } from '~/stores/category'
import { parseDate } from '~/utils'
import { computed, defineComponent, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@vicons/utils'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
import type {
  CategoryWithChildrenModel,
  PickedPostModelInCategoryChildren,
} from '~/models/category'
import type {
  FilterOption,
  FilterState,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import type { ComputedRef } from 'vue'
import type { PostModel, PostResponse } from '../../models/post'

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
            options: ['none', 'all'],
          },
          {
            title: '标题',
            key: 'title',
            width: 280,
            render(row) {
              return (
                <div class={'flex flex-grow items-center space-x-2'}>
                  {row.pin && (
                    <NPopover>
                      {{
                        trigger() {
                          return (
                            <NIcon class={'flex-shrink-0 text-orange-400'}>
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
                      xLog={row.meta?.xLog}
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

                    message.success('修改成功~!')
                    data.value.find((i) => i.id === row.id).categoryId = v
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
            title: () => (
              <Icon>
                <BookIcon />
              </Icon>
            ),
            key: 'count.read',
            width: 50,
            render(row) {
              return row.count?.read || 0
            },
          },
          {
            title: () => (
              <Icon>
                <ThumbsUpIcon />
              </Icon>
            ),
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
                <NSpace size={4} align="center">
                  <div class={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    row.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <Icon size={12}>
                      {row.isPublished ? <EyeIcon /> : <EyeOffIcon />}
                    </Icon>
                    {row.isPublished ? '已发布' : '草稿'}
                  </div>
                  <NButton
                    size="tiny"
                    quaternary
                    type={row.isPublished ? "warning" : "primary"}
                    onClick={async () => {
                      const newStatus = !row.isPublished
                      try {
                        await RESTManager.api.posts(row.id)('publish').patch({
                          data: { isPublished: newStatus }
                        })
                        row.isPublished = newStatus
                        message.success(newStatus ? '已发布' : '已设为草稿')
                      } catch (_error) {
                        message.error('操作失败')
                      }
                    }}
                  >
                    {row.isPublished ? '取消发布' : '发布'}
                  </NButton>
                </NSpace>
              )
            }
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
                    onNegativeClick={async () => {
                      await RESTManager.api.posts(row.id).delete()
                      message.success('删除成功')
                      await fetchData(pager.value.currentPage)
                    }}
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

                  data.value = concatList
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

    return () => {
      return (
        <ContentLayout>
          {{
            actions: () => (
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
                        checkedRowKeys.value.map(id => 
                          RESTManager.api.posts(id as string)('publish').patch({
                            data: { isPublished: true }
                          })
                        )
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
                        checkedRowKeys.value.map(id => 
                          RESTManager.api.posts(id as string)('publish').patch({
                            data: { isPublished: false }
                          })
                        )
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
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})
