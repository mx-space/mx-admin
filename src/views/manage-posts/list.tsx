import { Add12Filled, Delete16Regular } from '@vicons/fluent'
import { defineComponent, onMounted } from '@vue/runtime-core'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useTable } from 'hooks/use-table'
import { omit } from 'lodash-es'
import { NButton, NPopconfirm, NSpace, useDialog, useMessage } from 'naive-ui'
import {
  FilterOption,
  FilterState,
  TableBaseColumn,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import { CategoryStore } from 'stores/category'
import { useInjector } from 'utils/deps-injection'
import { parseDate, relativeTimeFromNow } from 'utils/time'
import { computed, ComputedRef, reactive, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { PostModel, PostResponse } from '../../models/post'
import { RESTManager } from '../../utils/rest'
export const ManagePostListView = defineComponent({
  name: 'PostList',
  setup(props, ctx) {
    const { checkedRowKeys, data, pager, sortProps, fetchDataFn } = useTable(
      (data, pager) => async (page = route.query.page || 1, size = 20) => {
        const response = await RESTManager.api.posts.get<PostResponse>({
          params: {
            page,
            size,
            select: 'title _id id created modified categoryId copyright tags',
            ...(sortProps.sortBy
              ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
              : {}),
          },
        })

        data.value = response.data
        pager.value = response.page
      },
    )

    const message = useMessage()
    const dialog = useDialog()

    const route = useRoute()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async n => {
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
            categoryStore.data.value?.map(i => ({
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
            width: 300,
            render(row) {
              return (
                <RouterLink to={'/posts/edit?id=' + row.id}>
                  {row.title}
                </RouterLink>
              )
            },
          },
          {
            title: '分类',
            sortOrder: false,
            sorter: 'default',
            key: 'category',
            // @ts-expect-error cao
            filterOptions: categoryFilterOptions,
            filter: true,
            render(row) {
              const map = categoryStore.map.value

              if (!map) {
                return ''
              }

              return (
                <span>{categoryStore.map.value.get(row.categoryId)?.name}</span>
              )
            },
          },
          {
            title: '创建时间',
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
            render(row) {
              return parseDate(row.modified, 'yyyy年M月d日')
            },
          },
          {
            title: '操作',
            fixed: 'right',
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

                  let { data: _data } = (await RESTManager.api.categories.get({
                    params: {
                      ids,
                    },
                  })) as any
                  _data = _data
                    .map(c => {
                      return c.category.children.map(ch => ({
                        ...omit(c.category, ['children', 'id', 'id']),
                        ...ch,
                        categoryId: c.category.id,
                      }))
                    })
                    .sort(
                      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
                    )
                    .flat()

                  data.value = _data
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
            onUpdateCheckedRowKeys={keys => {
              checkedRowKeys.value = keys
            }}
            onUpdateSorter={async props => {
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
