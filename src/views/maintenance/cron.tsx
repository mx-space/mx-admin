import { format } from 'date-fns'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import { defineComponent, onMounted } from 'vue'
import { toast } from 'vue-sonner'

import { healthApi } from '~/api/health'
import { Table } from '~/components/table'
import { useDataTableFetch } from '~/hooks/use-table'
import { toPascalCase } from '~/utils'

export default defineComponent({
  setup() {
    const { data, fetchDataFn, loading } = useDataTableFetch((dataRef) => {
      return async () => {
        const response = await healthApi.getCronList()
        dataRef.value = Array.from(
          Object.values(response).map((item: any) => ({
            ...item,
            _name: item.name,
            name: toPascalCase(item.name),
          })),
        )
      }
    })
    onMounted(async () => {
      await fetchDataFn()
    })
    const executeCron = async (name: string, niceName: string) => {
      await healthApi.runCron(name)
      toast.success(`${niceName} 已开始执行`)
      // TODO: Implement task status polling if needed
    }
    return () => (
      <>
        <Table
          noPagination
          data={data}
          loading={loading.value}
          nTableProps={{
            maxHeight: 'calc(100vh - 17rem)',
          }}
          maxWidth={500}
          columns={[
            {
              title: '任务',
              key: 'name',
              ellipsis: { tooltip: true },
              width: 150,
            },
            {
              title: '描述',
              key: 'description',
              width: 250,
              ellipsis: { tooltip: true },
            },
            { title: '状态', key: 'status' },
            {
              title: '下次执行',
              key: '',
              render(row) {
                const nextDate: any = row.nextDate
                if (!nextDate) {
                  return 'N/A'
                }
                return format(new Date(nextDate), 'MM/dd/yyyy hh:mm:ss')
              },
            },
            {
              title: '操作',
              key: '',
              render(row) {
                return (
                  <NSpace>
                    <NPopconfirm
                      onPositiveClick={() =>
                        void executeCron(row._name, row.name)
                      }
                    >
                      {{
                        trigger() {
                          return (
                            <NButton size="tiny" quaternary type="primary">
                              执行
                            </NButton>
                          )
                        },
                        default: () => (
                          <span class="max-w-48">确定要执行？</span>
                        ),
                      }}
                    </NPopconfirm>
                  </NSpace>
                )
              },
            },
          ]}
        />
      </>
    )
  },
})
