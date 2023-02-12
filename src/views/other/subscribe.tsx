import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useDataTableFetch } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import type { SubscribeResponse } from 'models/subscribe';
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import { RESTManager } from 'utils'
import { useRoute } from 'vue-router'

export default defineComponent({
  setup() {
    const route = useRoute()
    const { loading, checkedRowKeys, data, pager, sortProps, fetchDataFn } =
      useDataTableFetch((data, pager) => {
        return async (page = route.query.page || 1, size = 10) => {
          const response =
            await RESTManager.api.subscribe.get<SubscribeResponse>({
              params: {
                page,
                size,
                ...(sortProps.sortBy
                  ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
                  : {}),
              },
            })
          data.value = response.data
          pager.value = response.pagination
        }
      })
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onMounted(async () => {
      await fetchDataFn()
    })


    return () => (
      <ContentLayout>
        <Table
          data={data}
          loading={loading.value}
          columns={[
            {
              title: '邮箱',
              key: 'email',
              ellipsis: { tooltip: true },
              width: 250,
            },
            {
              title: '内容',
              key: 'subscribe',
              width: 250,
              ellipsis: { tooltip: true },
            },
            {
              title: '创建于',
              width: 150,
              key: 'created',
              sortOrder: 'descend',
              render(row) {
                return <RelativeTime time={row.created} />
              },
            },
            {
              title: '操作',
              fixed: 'right',
              width: 160,
              key: 'id',
              render(row) {
                return (
                  <NSpace>
                    <NPopconfirm
                      positiveText={'取消'}
                      negativeText="删除"
                      onNegativeClick={async () => {
                        await RESTManager.api.subscribe.unsubscribe.get({
                          params: {
                            email: row.email,
                            cancelToken: row.cancelToken,
                          },
                        })
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
                          <span class="max-w-48">确定要删除 {row.title} ?</span>
                        ),
                      }}
                    </NPopconfirm>
                  </NSpace>
                )
              },
            },
          ]}
          onFetchData={fetchData}
          pager={pager}
          onUpdateCheckedRowKeys={(keys) => {
            checkedRowKeys.value = keys
          }}
        ></Table>
      </ContentLayout>
    )
  },
})
