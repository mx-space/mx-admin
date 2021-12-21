import Book from '@vicons/fa/es/Book'
import ThumbsUp from '@vicons/fa/es/ThumbsUp'
import Add12Filled from '@vicons/fluent/es/Add12Filled'
import Delete16Regular from '@vicons/fluent/es/Delete16Regular'
import { Icon } from '@vicons/utils'
import { TableTitleLink } from 'components/link/title-link'
import { Table } from 'components/table'
import { EditColumn } from 'components/table/edit-column'
import { RelativeTime } from 'components/time/relative-time'
import { useInjector } from 'hooks/use-deps-injection'
import { useTable } from 'hooks/use-table'
import {
  CategoryWithChildrenModel,
  PickedPostModelInCategoryChildren,
} from 'models/category'
import { NButton, NPopconfirm, NSpace, useDialog, useMessage } from 'naive-ui'
import {
  FilterOption,
  FilterState,
  TableBaseColumn,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import { CategoryStore } from 'stores/category'
import {
  computed,
  ComputedRef,
  defineComponent,
  onMounted,
  reactive,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { PostModel, PostResponse } from '../../models/post'
import { RESTManager } from '../../utils/rest'
export const ManagePostListView = defineComponent({
  name: 'PostList',
  setup() {
    const { loading, checkedRowKeys, data, pager, sortProps, fetchDataFn } =
      useTable(
        (data, pager) =>
          async (page = route.query.page || 1, size = 20) => {
            const response = await RESTManager.api.posts.get<PostResponse>({
              params: {
                page,
                size,
                select:
                  'title _id id created modified slug categoryId copyright tags count',
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
    const dialog = useDialog()

    const route = useRoute()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    const categoryStore = useInjector(CategoryStore)

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
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 200,
            ellipsis: true,
            render(row) {
              return (
                <>
                  <TableTitleLink
                    id={row.id}
                    title={row.title}
                    inPageTo={'/posts/edit?id=' + row.id}
                    externalLinkTo={
                      '/posts/' + row.category.slug + '/' + row.slug
                    }
                  ></TableTitleLink>
                </>
              )
            },
          },
          {
            title: '分类',
            sortOrder: false,
            sorter: 'default',
            key: 'category',
            width: 80,
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
                ></EditColumn>
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
                <Book />
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
                <ThumbsUp />
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
                        <NButton text type="error" size="tiny">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span style={{ maxWidth: '12rem' }}>
                          确定要删除 {row.title} ?
                        </span>
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
              onUpdateFilters: async (
                filterState: FilterState,
                sourceColumn?: TableBaseColumn,
              ) => {
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

                  let { entries: _data } =
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
                              return i
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
          ></Table>
        )
      },
    })

    return () => {
      return (
        <ContentLayout>
          {{
            actions: () => (
              <>
                <HeaderActionButton
                  variant="error"
                  disabled={checkedRowKeys.value.length == 0}
                  onClick={() => {
                    dialog.warning({
                      title: '警告',
                      content: '你确定要删除？',
                      positiveText: '确定',
                      negativeText: '不确定',
                      onPositiveClick: async () => {
                        for (const id of checkedRowKeys.value) {
                          await RESTManager.api.posts(id as string).delete()
                        }
                        checkedRowKeys.value.length = 0
                        message.success('删除成功')

                        await fetchData()
                      },
                    })
                  }}
                  icon={<Delete16Regular />}
                />
                <HeaderActionButton to={'/posts/edit'} icon={<Add12Filled />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})
