import { useStoreRef } from 'hooks/use-store-ref'
import type { Pager } from 'models/base'
import { NDataTable } from 'naive-ui'
import type { dataTableProps } from 'naive-ui/lib/data-table/src/DataTable'
import type {
  RowKey,
  SortState,
  TableColumns,
} from 'naive-ui/lib/data-table/src/interface'
import { UIStore } from 'stores/ui'
import type { PropType, Ref } from 'vue'
import { defineComponent, reactive, ref, watch } from 'vue'
import type { LocationQueryValue } from 'vue-router'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

import styles from './index.module.css'

export const tableRowStyle = styles['table-row']

export const Table = defineComponent({
  props: {
    data: {
      type: Object as PropType<Ref<any[]>>,
      required: true,
    },
    noPagination: {
      type: Boolean,
      default: false,
    },
    pager: {
      type: Object as PropType<Ref<Pager>>,
      required: false,
    },
    onUpdateCheckedRowKeys: {
      type: Function as PropType<(keys: string[]) => void>,
      default: new Function(),
    },
    onUpdateSorter: {
      type: Function as PropType<
        (
          sortProps: { sortBy: string; sortOrder: number },
          status: SortState,
        ) => void
      >,
      default: new Function(),
    },
    onFetchData: {
      type: Function as PropType<
        | ((page?: string | number | LocationQueryValue[]) => any)
        | ((page?: any) => any)
      >,
      required: false,
    },
    columns: {
      type: Array as PropType<TableColumns<any>>,
      required: true,
    },
    nTableProps: {
      type: Object as PropType<
        Partial<Record<keyof typeof dataTableProps, any>>
      >,
      default: () => ({}),
    },
    maxWidth: {
      type: Number,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    checkedRowKey: {
      type: String,
      default: 'id',
    },
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const checkedRowKeys = ref<RowKey[]>([])
    const sortProps = reactive({
      sortBy: '',
      sortOrder: 0,
    })
    const loading = ref(true)

    // HACK
    const clean = watch(
      () => props.data.value,
      (n) => {
        loading.value = false
        clean()
      },
    )

    onBeforeRouteUpdate((to, from, next) => {
      loading.value = true
      next()
      loading.value = false
    })

    const ui = useStoreRef(UIStore)

    return () => {
      const {
        data,
        noPagination = false,
        pager,
        onUpdateCheckedRowKeys,
        onUpdateSorter,
        nTableProps,
        columns,
        onFetchData: fetchData,
        checkedRowKey = 'id',
        maxWidth = 1200,
      } = props
      return (
        <NDataTable
          // @ts-ignore
          loading={props.loading ?? loading.value}
          remote
          scrollX={Math.max(ui.contentInsetWidth.value, maxWidth)}
          pagination={
            noPagination
              ? undefined
              : pager && {
                  page: pager.value.currentPage,
                  pageSize: pager.value.size,
                  pageCount: pager.value.totalPage,
                  // showQuickJumper: ui.viewport.value.mobile ? false : true,
                  showQuickJumper: true,
                  pageSlot: ui.viewport.value.mobile
                    ? ui.contentInsetWidth.value < 400
                      ? 2
                      : 3
                    : undefined,
                  onChange: async (page) => {
                    router.push({
                      query: { ...route.query, page },
                      path: route.path,
                    })
                  },
                }
          }
          bordered={false}
          data={data.value}
          rowClassName={() => tableRowStyle}
          checkedRowKeys={checkedRowKeys.value}
          rowKey={(r) => r[checkedRowKey]}
          onUpdateCheckedRowKeys={(keys) => {
            checkedRowKeys.value = keys
            onUpdateCheckedRowKeys?.(keys as any)
          }}
          onUpdateSorter={async (status: SortState) => {
            if (!status) {
              return
            }

            columns.forEach((column) => {
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

            // 如果改列状态变为未排序状态了,  order 变成了 false
            sortProps.sortBy = order === false ? '' : columnKey.toString() || ''

            sortProps.sortOrder = order ? { descend: -1, ascend: 1 }[order] : 1
            onUpdateSorter?.(sortProps, status)
            if (fetchData) {
              await fetchData()
            }
          }}
          columns={columns}
          {...nTableProps}
        ></NDataTable>
      )
    }
  },
})
