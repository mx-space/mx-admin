import { Table } from 'components/table'
import { format } from 'date-fns'
import { useTable } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import { RESTManager, toPascalCase } from 'utils'

export default defineComponent({
  setup() {
    const { data, checkedRowKeys, fetchDataFn, loading } = useTable(
      (dataRef) => {
        return async () => {
          const data = (await RESTManager.api.health.cron.get()) as any
          dataRef.value = Array.from(
            Object.values(data.data).map((item: any) => ({
              ...item,
              _name: item.name,
              name: toPascalCase(item.name),
            })),
          )
        }
      },
    )
    onMounted(async () => {
      await fetchDataFn()
    })
    return () => (
      <ContentLayout>
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
                return format(new Date(nextDate), 'yyyy-mm-dd hh:mm:ss')
              },
            },
            {
              title: '操作',
              key: '',
              render(row) {
                return (
                  <NSpace>
                    <NPopconfirm
                      onPositiveClick={() => {
                        RESTManager.api.health.cron.run(row._name).post()
                      }}
                    >
                      {{
                        trigger() {
                          return (
                            <NButton size="tiny" text type="success">
                              执行
                            </NButton>
                          )
                        },
                        default: () => (
                          <span style={{ maxWidth: '12rem' }}>确定要执行?</span>
                        ),
                      }}
                    </NPopconfirm>
                  </NSpace>
                )
              },
            },
          ]}
        ></Table>
      </ContentLayout>
    )
  },
})
