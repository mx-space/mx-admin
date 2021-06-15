import { Pager } from 'models/post'
import { NDataTable } from 'naive-ui'
import {
  RowKey,
  SortState,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import { defineComponent, reactive, ref, Ref } from 'vue'
import { LocationQueryValue, useRoute, useRouter } from 'vue-router'
import styles from './index.module.css'

const TableProps = [
  'data',
  'pager',
  'onUpdateCheckedRowKeys',
  'onUpdateSorter',
  'columns',
  'onFetchData',
  'nTableProps',
  'noPagination',
] as const
export const Table = defineComponent<{
  data: Ref<any[]>
  pager: Ref<Pager>
  onUpdateCheckedRowKeys?: (keys: string[]) => void
  onUpdateSorter?: (
    sortProps: { sortBy: string; sortOrder: number },
    status: SortState,
  ) => void
  onFetchData: (
    page?: string | number | LocationQueryValue[],
    size?: number,
  ) => any
  columns: TableColumns<any>
  nTableProps: Partial<typeof NDataTable>
  noPagination?: boolean
}>((props, ctx) => {
  const {
    data,
    noPagination = false,
    pager,
    onUpdateCheckedRowKeys,
    onUpdateSorter,
    nTableProps,
    columns,
    onFetchData: fetchData,
  } = props
  const router = useRouter()
  const route = useRoute()
  const checkedRowKeys = ref<RowKey[]>([])
  const sortProps = reactive({
    sortBy: '',
    sortOrder: 0,
  })
  return () => (
    <NDataTable
      {...nTableProps}
      remote
      // @ts-expect-error
      pagination={
        noPagination
          ? undefined
          : {
              page: pager.value.currentPage,
              pageSize: pager.value.size,
              pageCount: pager.value.totalPage,

              onChange: async page => {
                router.push({ query: { page }, path: route.path })
              },
            }
      }
      bordered={false}
      data={data.value}
      checkedRowKeys={checkedRowKeys.value}
      rowKey={r => r.id}
      onUpdateCheckedRowKeys={keys => {
        checkedRowKeys.value = keys
        onUpdateCheckedRowKeys?.(keys as any)
      }}
      rowClassName={() => styles['table-row']}
      onUpdateSorter={async status => {
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
          if (column.key === status.columnKey) column.sortOrder = status.order
          else column.sortOrder = false
        })

        const { columnKey, order } = status

        sortProps.sortBy =
          sortProps.sortBy && sortProps.sortBy == columnKey
            ? ''
            : (columnKey as string)
        sortProps.sortOrder = order ? { descend: -1, ascend: 1 }[order] : 1
        onUpdateSorter?.(sortProps, status)
        await fetchData()
      }}
      columns={columns}
    ></NDataTable>
  )
})
Table.props = TableProps
