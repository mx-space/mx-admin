import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useDataTableFetch } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import type { SubscribeResponse } from 'models/subscribe'
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui'
import { RESTManager } from 'utils'
import { useRoute } from 'vue-router'

export const SubscribePostCreateBit = 1 << 0
export const SubscribeNoteCreateBit = 1 << 1
export const SubscribeSayCreateBit = 1 << 2
export const SubscribeRecentCreateBit = 1 << 3

export default defineComponent({
  setup() {
    const route = useRoute()
    const { loading, checkedRowKeys, data, pager, fetchDataFn } =
      useDataTableFetch((data, pager) => {
        return async (page = route.query.page || 1, size = 10) => {
          const response =
            await RESTManager.api.subscribe.get<SubscribeResponse>({
              params: {
                page,
                size,
                sortBy: 'created',
                sortOrder: '-1',
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
              title: '订阅内容',
              key: 'subscribe',
              width: 250,
              render(row) {
                return <SubscribeBit bit={row.subscribe} />
              },
            },
            {
              title: '创建于',
              width: 250,
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
                      positiveText="取消"
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
                          <span class="max-w-48">确定要删除 {row.title}？</span>
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

const bit2TextMap = new Map([
  [SubscribePostCreateBit, '博文'],
  [SubscribeNoteCreateBit, '点滴'],
  [SubscribeRecentCreateBit, '速记'],
  [SubscribeSayCreateBit, '说说'],
])
export const SubscribeBit = defineComponent({
  props: {
    bit: {
      type: Number,
      required: true,
    },
  },
  render() {
    const tagElements = [] as JSX.Element[]

    for (const [bit, text] of bit2TextMap.entries()) {
      bit & this.bit && tagElements.push(<NTag round>{text}</NTag>)
    }

    return <NSpace>{tagElements}</NSpace>
  },
})
