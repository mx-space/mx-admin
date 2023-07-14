import { HeaderActionButton } from 'components/button/rounded-button'
import { RefreshOutlineIcon, TrashIcon } from 'components/icons'
import { IpInfoPopover } from 'components/ip-info'
import { DeleteConfirmButton } from 'components/special-button/delete-confirm'
import { Table } from 'components/table'
import { useDataTableFetch } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { isEmpty } from 'lodash-es'
import {
  NButton,
  NEllipsis,
  NP,
  NSkeleton,
  NSpace,
  NTabPane,
  NTabs,
} from 'naive-ui'
import { parseDate, RESTManager } from 'utils'
import {
  defineComponent,
  onBeforeMount,
  onMounted,
  ref,
  toRaw,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { UA } from 'models/analyze'
import type { Pager } from 'models/base'
import type { TableColumns } from 'naive-ui/lib/data-table/src/interface'

import { Chart } from '@antv/g2/esm'

const SectionTitle = defineComponent((_, { slots }) => () => (
  <div class="my-[12px] font-semibold text-gray-400 ">{slots.default?.()}</div>
))
export default defineComponent({
  setup() {
    const { data, pager, fetchDataFn } = useDataTableFetch(
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

    const route = useRoute()
    const router = useRouter()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onBeforeMount(() => {
      fetchData()
    })

    const DataTable = () => {
      return (
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
    }

    // graph
    const count = ref({} as Total)
    const todayIp = ref<string[]>()
    const graphData = ref(
      {} as {
        day: Today[]
        week: Week[]
        month: Month[]
      },
    )
    const topPaths = ref([] as Path[])
    onBeforeMount(async () => {
      const data =
        (await RESTManager.api.analyze.aggregate.get()) as IPAggregate
      count.value = data.total
      todayIp.value = data.todayIps
      graphData.value = {
        day: data.today,
        week: data.weeks,
        month: data.months,
      }
      topPaths.value = [...data.paths]
    })

    const Graph = defineComponent(() => {
      const dayChart = ref<HTMLDivElement>()
      const weekChart = ref<HTMLDivElement>()
      const monthChart = ref<HTMLDivElement>()
      const pieChart = ref<HTMLDivElement>()
      const charts: Record<string, Chart | null> = {
        day: null,
        week: null,
        month: null,
      }
      function renderChart(
        element: HTMLElement | undefined,
        field: 'day' | 'week' | 'month',
        data: any,
        label: [string, string, string],
      ) {
        if (!element) {
          return
        }
        const chart = new Chart({
          container: element,
          autoFit: true,
          height: 250,
          padding: [30, 20, 70, 40],
        })
        charts[field] = chart

        chart.data(data)
        chart.tooltip({
          showCrosshairs: true,
          shared: true,
        })
        chart.scale({
          [label[0]]: {
            range: [0, 1],
          },
          [label[2]]: {
            min: 0,
            nice: true,
          },
        })
        chart
          .line()
          .position(`${label[0]}*${label[2]}`)
          .label(label[2])
          .color(label[1])
          .shape('smooth')
        chart
          .point()
          .position(`${label[0]}*${label[2]}`)
          .label(label[2])
          .color(label[1])
          .shape('circle')

        chart.render()
      }

      const renderAllChart = () => {
        renderChart(dayChart.value, 'day', graphData.value.day, [
          'hour',
          'key',
          'value',
        ])

        renderChart(weekChart.value, 'week', graphData.value.week, [
          'day',
          'key',
          'value',
        ])

        renderChart(monthChart.value, 'month', graphData.value.month, [
          'date',
          'key',
          'value',
        ])
        if (pieChart.value) {
          renderPie(pieChart.value)
        }
      }
      onMounted(() => {
        if (!isEmpty(toRaw(graphData.value))) {
          renderAllChart()
        }
      })

      const watcher = watch(
        () => graphData,
        (n, old) => {
          if (!isEmpty(toRaw(graphData.value))) {
            renderAllChart()

            watcher()
          }
        },
        { deep: true },
      )

      function renderPie(el: HTMLElement) {
        const pieData = topPaths.value.slice(0, 10)
        const total = pieData.reduce((prev, { count }) => count + prev, 0)

        const data = pieData.map((paths) => {
          return {
            item: decodeURI(paths.path),
            count: paths.count,
            percent: paths.count / total,
          }
        })

        const chart = new Chart({
          container: el,
          autoFit: true,
          height: 250,
        })

        chart.coordinate('theta', {
          radius: 0.75,
        })

        chart.data(data)

        chart.tooltip({
          showTitle: false,
          showMarkers: false,
        })
        chart.legend(false)
        chart
          .interval()
          .position('count')
          .color('item')
          .label('percent', {
            content: (data) => {
              return `${data.item}: ${(data.percent * 100).toFixed(2)}%`
            },
          })
          .adjust('stack')

        chart.render()
      }

      return () => (
        <div class="phone:grid-cols-1 grid grid-cols-2 gap-4">
          <div>
            <SectionTitle>今日请求走势</SectionTitle>
            <div ref={dayChart}></div>
            {isEmpty(graphData.value) && (
              <NSkeleton animated height={250}></NSkeleton>
            )}
          </div>
          <div>
            <SectionTitle>本周请求走势</SectionTitle>
            <div ref={weekChart}></div>
            {isEmpty(graphData.value) && (
              <NSkeleton animated height={250}></NSkeleton>
            )}
          </div>
          <div>
            <SectionTitle>本月请求走势</SectionTitle>
            <div ref={monthChart}></div>
            {isEmpty(graphData.value) && (
              <NSkeleton animated height={250}></NSkeleton>
            )}
          </div>
          <div>
            <SectionTitle>最近 7 天请求路径 Top 10</SectionTitle>
            <div ref={pieChart}></div>
            {isEmpty(graphData.value) && (
              <NSkeleton animated height={250}></NSkeleton>
            )}
          </div>
        </div>
      )
    })
    // end

    return () => (
      <ContentLayout
        actionsElement={
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
          </>
        }
      >
        <Graph />
        <NP>
          <SectionTitle>
            <span>
              总请求量中：PV {count.value.callTime} UV {count.value.uv}
            </span>
          </SectionTitle>
        </NP>

        <NTabs>
          <NTabPane name={'IP 记录'}>
            {!todayIp.value ? (
              <NSkeleton animated class="my-2 h-[200px]"></NSkeleton>
            ) : (
              <NP>
                <SectionTitle>
                  <span>今天 - 所有请求的 IP {todayIp.value.length} 个</span>
                </SectionTitle>

                <NSpace>
                  {todayIp.value.map((ip) => (
                    <IpInfoPopover
                      ip={ip}
                      key={ip}
                      triggerEl={
                        <NButton
                          size="tiny"
                          class="!flex !py-[15px]"
                          round
                          type="primary"
                          ghost
                        >
                          {ip}
                        </NButton>
                      }
                    ></IpInfoPopover>
                  ))}
                </NSpace>
              </NP>
            )}
          </NTabPane>

          <NTabPane name={'访问路径'}>
            <DataTable />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})
interface IPAggregate {
  today: Today[]
  weeks: Week[]
  months: Month[]
  paths: Path[]
  total: Total
  todayIps: string[]
}

interface Month {
  date: string
  key: Key
  value: number
}

enum Key {
  IP = 'ip',
  PV = 'pv',
}

interface Path {
  count: number
  path: string
}

interface Today {
  hour: string
  key: Key
  value: number
}

interface Total {
  callTime: number
  uv: number
}

interface Week {
  day: string
  key: Key
  value: number
}
