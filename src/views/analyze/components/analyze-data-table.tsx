import { IpInfoPopover } from 'components/ip-info'
import { Table } from 'components/table'
import { useDataTableFetch } from 'hooks/use-table'
import { useLayout } from 'layouts/content'
import { NButton, NEllipsis } from 'naive-ui'
import { parseDate, RESTManager } from 'utils'
import { defineComponent, onBeforeMount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { UA } from 'models/analyze'
import type { Pager } from 'models/base'
import type { TableColumns } from 'naive-ui/lib/data-table/src/interface'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { RefreshOutlineIcon, TrashIcon } from '~/components/icons'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { router } from '~/router'

export const AnalyzeDataTable = defineComponent({
  setup() {
    const route = useRoute()
    const { setHeaderButtons } = useLayout()
    onMounted(() => {
      setHeaderButtons(
        <>
          <HeaderActionButton
            icon={<RefreshOutlineIcon />}
            variant="success"
            name="刷新数据"
            onClick={() => {
              if (+route.query.page! === 1) {
                fetchData()
              } else {
                router.replace({
                  path: route.path,
                  query: { ...route.query, page: 1 },
                })
              }
            }}
          ></HeaderActionButton>
          <DeleteConfirmButton
            onDelete={async () => {
              await RESTManager.api.analyze.delete()

              if (parseInt(route.query.page as string) === 1) {
                fetchData()
              } else {
                router.replace({
                  path: route.path,
                  query: {
                    page: 1,
                  },
                })
              }
            }}
            customSuccessMessage="已清空"
            message="你确定要清空数据表？"
            customButtonTip="清空表"
            customIcon={<TrashIcon />}
          />
        </>,
      )

      onBeforeUnmount(() => {
        setHeaderButtons(null)
      })
    })
    watch(
      () => route.query.page,
      async (n) => {
        await fetchData(n ? +n : 1)
      },
    )

    const {
      data,
      pager,
      fetchDataFn: fetchData,
    } = useDataTableFetch(
      (data, pager) =>
        async (page = route.query.page || 1, size = 30) => {
          const response = (await RESTManager.api.analyze.get({
            params: {
              page,
              size,
            },
          })) as {
            data: UA.Root[]
            pagination: Pager
          }

          data.value = response.data
          pager.value = response.pagination
        },
    )

    onBeforeMount(() => {
      fetchData()
    })

    return () => (
      <Table
        data={data}
        onFetchData={fetchData}
        pager={pager}
        columns={
          [
            {
              title: '时间',
              key: 'timestamp',
              width: 150,
              render({ timestamp }) {
                return parseDate(timestamp, 'M-d HH:mm:ss')
              },
            },
            {
              title: 'IP',
              key: 'ip',
              width: 100,
              render({ ip }) {
                if (!ip) {
                  return null
                }
                return (
                  <IpInfoPopover
                    ip={ip}
                    triggerEl={
                      <NButton text size="tiny" type="primary">
                        {ip}
                      </NButton>
                    }
                  ></IpInfoPopover>
                )
              },
            },

            {
              title: '请求路径',
              key: 'path',
              render({ path }) {
                return (
                  <NEllipsis class="max-w-[150px] truncate">
                    {path ?? ''}
                  </NEllipsis>
                )
              },
            },

            {
              key: 'ua',
              title: '浏览器',
              render({ ua }) {
                return (
                  <NEllipsis class="max-w-[200px] truncate">
                    {ua.browser
                      ? Object.values(ua.browser).filter(Boolean).join(' ')
                      : 'N/A'}
                  </NEllipsis>
                )
              },
            },

            {
              key: 'ua',
              title: 'OS',
              render({ ua }) {
                return (
                  <NEllipsis class="max-w-[150px] truncate">
                    {ua.os
                      ? Object.values(ua.os).filter(Boolean).join(' ')
                      : 'N/A'}
                  </NEllipsis>
                )
              },
            },

            {
              key: 'ua',
              title: 'User Agent',
              render({ ua }) {
                return (
                  <NEllipsis lineClamp={2}>
                    {{
                      default() {
                        return ua.ua ?? ''
                      },
                      tooltip() {
                        return <div class="max-w-[500px]">{ua.ua ?? ''}</div>
                      },
                    }}
                  </NEllipsis>
                )
              },
            },
          ] as TableColumns<UA.Root>
        }
      ></Table>
    )
  },
})
