import { Add12Filled } from '@vicons/fluent'
import { defineComponent, onMounted, ref } from '@vue/runtime-core'
import { NButton, NDataTable, NPopconfirm, NSpace } from 'naive-ui'
import {
  ColumnKey,
  RowKey,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import { CategoryStore } from 'stores/category'
import { useInjector } from 'utils/deps-injection'
import { parseDate, relativeTimeFromNow } from 'utils/time'
import { reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { Pager, PostModel, PostResponse } from '../../models/post'
import { RESTManager } from '../../utils/rest'
import styles from './index.module.css'
export const ManagePostListView = defineComponent({
  name: 'post-list',
  setup({}, ctx) {
    const data = ref<PostModel[]>([])
    const pager = ref<Pager>({} as any)
    const sortProps = reactive({
      sortBy: '',
      sortOrder: 0,
    })
    const checkedRowKeys = ref<RowKey[]>([])
    const route = useRoute()
    const router = useRouter()
    const fetchData = async (page = route.query.page || 1, size = 20) => {
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
    }

    const categoryStore = useInjector(CategoryStore)

    onMounted(async () => {
      await fetchData()
      await categoryStore.fetch()
    })

    const DataTable = defineComponent({
      setup() {
        const columns = reactive<TableColumns<any>>([
          {
            type: 'selection',
            options: ['all', 'none'],
          },
          {
            title: '标题',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 300,
            render(row) {
              return (
                <RouterLink to={'/posts/edit/' + row.id}>
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
            filterOptions: [],
            filter: true,
            render(row) {
              const map = categoryStore.map.value
              if (!map) {
                return ''
              }
              return (
                <span>
                  {categoryStore.map.value.get(row.category_id)?.name}
                </span>
              )
            },
          },
          {
            title: '创建时间',
            key: 'created',
            sortOrder: 'descend',
            sorter: 'default',
            render(row) {
              return relativeTimeFromNow(row.created)
            },
          },
          {
            title: '修改于',
            key: 'modified',
            sorter: 'default',
            sortOrder: false,
            render(row) {
              return parseDate(row.modified, 'YYYY年M月D日')
            },
          },
          {
            title: '操作',
            key: 'id',
            render(row) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={async () => {
                      await RESTManager.api.posts(row.id).delete()
                      await fetchData(pager.value.currentPage)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error">
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
          <NDataTable
            remote
            pagination={{
              page: pager.value.currentPage,
              pageSize: pager.value.size,
              pageCount: pager.value.totalPage,

              onChange: async page => {
                await fetchData(page)
                router.push({ query: { page }, path: route.path })
              },
            }}
            bordered={false}
            data={data.value}
            checkedRowKeys={checkedRowKeys.value}
            rowKey={r => r.id}
            onCheckedRowKeysChange={keys => {
              checkedRowKeys.value = keys
            }}
            rowClassName={() => styles['table-row']}
            // onUpdate:sorter={async status => {
            onSorterChange={async status => {
              if (!status) {
                return
              }

              columns.forEach(column => {
                /** column.sortOrder !== undefined means it is uncontrolled */
                if (!('sortOrder' in column)) {
                  return
                }
                if (column.sortOrder === undefined) return
                if (!status) {
                  column.sortOrder = false
                  return
                }
                if (column.key === status.columnKey)
                  column.sortOrder = status.order
                else column.sortOrder = false
              })

              const { columnKey, order } = status

              sortProps.sortBy =
                sortProps.sortBy && sortProps.sortBy == columnKey
                  ? ''
                  : (columnKey as string)
              sortProps.sortOrder = order
                ? { descend: -1, ascend: 1 }[order]
                : 1

              await fetchData()
            }}
            columns={columns}
          ></NDataTable>
        )
      },
    })

    return () => {
      return (
        <ContentLayout
          actionsElement={
            <HeaderActionButton to={'/posts/edit'} icon={<Add12Filled />} />
          }
        >
          <DataTable />
        </ContentLayout>
      )
    }
  },
})
