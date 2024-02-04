import { NButton } from 'naive-ui'
import { useRoute } from 'vue-router'
import type { PaginateResult } from '@mx-space/api-client'

import { IpInfoPopover } from '~/components/ip-info'
import { Table } from '~/components/table'
import { RelativeTime } from '~/components/time/relative-time'
import { useDataTableFetch } from '~/hooks/use-table'
import { RESTManager } from '~/utils'

interface ActivityItem {
  id: string
  created: string
  payload: any
  type: number
}

enum ActivityType {
  Like,
}

const ActivityType2Copy = ['点赞']

export const GuestActivity = defineComponent({
  setup() {
    const { data, pager, fetchDataFn } = useDataTableFetch(
      (list, pager) => async (page, size) => {
        RESTManager.api.activity
          .get<PaginateResult<ActivityItem>>({ params: { page, size } })
          .then((res) => {
            list.value = res.data
            pager.value = res.pagination
          })
      },
    )

    onBeforeMount(() => {
      fetchDataFn()
    })
    const route = useRoute()
    watch(
      () => route.query.page,
      async (n) => {
        await fetchDataFn(n ? +n : 1)
      },
    )

    return () => {
      return (
        <Table
          data={data}
          pager={pager}
          onFetchData={fetchDataFn}
          columns={[
            {
              title: '类型',
              key: 'type',
              render: (row) => <span>{ActivityType2Copy[row.type]}</span>,
              width: 120,
            },

            {
              title: '引用',
              key: 'payload.ref',
              render: (row) => {
                switch (row.type) {
                  case ActivityType.Like:
                    return (
                      <NButton
                        text
                        type="primary"
                        size="tiny"
                        onClick={() => {
                          RESTManager.api
                            .helper('url-builder')(row.payload.id)
                            .get<{ data: string }>()
                            .then(({ data: url }) => {
                              window.open(url)
                            })
                        }}
                      >
                        {row.ref.title}
                      </NButton>
                    )
                }
                return null
              },
              width: 350,
              ellipsis: {
                tooltip: true,
              },
            },
            {
              title: '时间',
              key: 'created',
              render: (row) => <RelativeTime time={row.created} />,
            },
            {
              title: 'IP',
              key: 'payload.ip',
              render: (row) => (
                <IpInfoPopover
                  ip={row.payload.ip}
                  trigger="hover"
                  triggerEl={<span>{row.payload.ip}</span>}
                />
              ),
            },
          ]}
        />
      )
    }
  },
})
