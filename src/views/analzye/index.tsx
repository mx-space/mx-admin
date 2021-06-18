import { Chart } from '@antv/g2'
import { RefreshOutline, Trash } from '@vicons/ionicons5'
import camelcaseKeys from 'camelcase-keys'
import { HeaderActionButton } from 'components/button/rounded-button'
import { Table } from 'components/table'
import { useTable } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { isEmpty } from 'lodash-es'
import { UA } from 'models/analyze'
import { Pager } from 'models/base'
import {
  NButton,
  NEllipsis,
  NP,
  NPopover,
  NSpace,
  NTag,
  useDialog,
  useMessage,
} from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { UIStore } from 'stores/ui'
import { parseDate, RESTManager, useInjector } from 'utils'
import {
  defineComponent,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'

const SectionTitle = defineComponent((_, { slots }) => () => (
  <div class="font-semibold text-gray-400 my-[12px] ">{slots}</div>
))
export default defineComponent({
  setup() {
    const { data, pager, sortProps, fetchDataFn } = useTable(
      (data, pager) => async (page = route.query.page || 1, size = 30) => {
        const response = (await RESTManager.api.analyze.get({
          params: {
            page,
            size,
            select: 'title text _id id created modified author source',
          },
        })) as {
          data: UA.Root[]
          page: Pager
        }

        data.value = response.data
        pager.value = response.page
      },
    )

    const message = useMessage()
    const dialog = useDialog()

    const route = useRoute()
    const router = useRouter()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async n => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onBeforeMount(() => {
      fetchData()
    })

    const ipLocationCacheMap = reactive(new Map<string, IP>())
    const ipInfoText = ref('获取中..')
    const setIpInfoText = (info: IP) => {
      ipInfoText.value = `IP: ${info.ip}<br />
      城市: ${[info.countryName, info.regionName, info.cityName]
        .filter(Boolean)
        .join(' - ') || 'N/A'}<br />
      ISP: ${info.ispDomain || 'N/A'}<br />
      组织: ${info.ownerDomain || 'N/A'}<br />
      范围: ${info.range ? Object.values(info.range).join(' - ') : 'N/A'}
      `
    }
    const resetIpInfoText = () => (ipInfoText.value = '获取中..')

    const onIpInfoShow = async (show: boolean, ip: string) => {
      if (!ip) {
        return
      }
      if (show) {
        if (ipLocationCacheMap.has(ip)) {
          const ipInfo = ipLocationCacheMap.get(ip)!
          setIpInfoText(ipInfo)
          return
        }
        const isIPv6 = ip.split(':').length == 8
        const apiUrl = isIPv6
          ? 'http://ip-api.com/json/'
          : 'https://api.i-meto.com/ip/v1/qqwry/'

        const response = await fetch(apiUrl + ip)
        const data = await response.json()
        let camelData = camelcaseKeys(data, { deep: true }) as IP
        if (isIPv6) {
          const _data = (camelData as any) as IPv6
          camelData = {
            cityName: _data.city,
            countryName: _data.country,
            ip: _data.query,
            ispDomain: _data.as,
            ownerDomain: _data.org,
            regionName: _data.regionName,
          }
        }
        setIpInfoText(camelData)
        ipLocationCacheMap.set(ip, data)
      } else {
        resetIpInfoText()
      }
    }

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
                width: 100,
                render({ timestamp }) {
                  return parseDate(timestamp, 'M-d HH:mm:ss')
                },
              },
              {
                title: 'IP',
                key: 'ip',
                width: 100,
                render({ ip }) {
                  return (
                    <NPopover
                      trigger="click"
                      placement="top"
                      onUpdateShow={async show => {
                        if (!ip) {
                          return
                        }
                        await onIpInfoShow(show, ip)
                      }}
                    >
                      {{
                        trigger() {
                          return (
                            <NButton text size="tiny" type="primary">
                              {ip}
                            </NButton>
                          )
                        },
                        default() {
                          return <div innerHTML={ipInfoText.value}></div>
                        },
                      }}
                    </NPopover>
                  )
                },
              },

              {
                title: '请求路径',
                key: 'path',
                render({ path }) {
                  return (
                    <NEllipsis class="truncate max-w-[150px]">
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
                    <NEllipsis class="truncate max-w-[200px]">
                      {ua.browser
                        ? Object.values(ua.browser)
                            .filter(Boolean)
                            .join(' ')
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
                    <NEllipsis class="truncate max-w-[150px]">
                      {ua.os
                        ? Object.values(ua.os)
                            .filter(Boolean)
                            .join(' ')
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
    const todayIp = ref([] as string[])
    const graphData = ref(
      {} as {
        day: any[]
        week: any[]
        month: any[]
      },
    )
    const topPaths = ref([] as Path[])
    onBeforeMount(async () => {
      const data = (await RESTManager.api.analyze.aggregate.get()) as IPAggregate
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
          padding: [30, 20, 70, 30],
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
          .position(label[0] + '*' + label[2])
          .label(label[2])
          .color(label[1])
          .shape('smooth')
        chart
          .point()
          .position(label[0] + '*' + label[2])
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

        const data = pieData.map(paths => {
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
            content: data => {
              return `${data.item}: ${(data.percent * 100).toFixed(2)}%`
            },
          })
          .adjust('stack')

        chart.render()
      }

      const uiStore = useInjector(UIStore)

      return () => (
        <div style={{ columns: uiStore.viewport.value.mobile ? 1 : 2 }}>
          <div>
            <SectionTitle>今日请求走势</SectionTitle>
            <div ref={dayChart}></div>
          </div>
          <div>
            <SectionTitle>本周请求走势</SectionTitle>
            <div ref={weekChart}></div>
          </div>
          <div>
            <SectionTitle>本月请求走势</SectionTitle>
            <div ref={monthChart}></div>
          </div>
          <div>
            <SectionTitle>最近 7 天请求路径 Top 10</SectionTitle>
            <div ref={pieChart}></div>
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
              icon={<RefreshOutline />}
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
            <HeaderActionButton
              icon={<Trash />}
              onClick={() => {
                dialog.warning({
                  title: '警告',
                  content: '你确定要清空数据表？',
                  positiveText: '确定',
                  negativeText: '达咩',
                  onPositiveClick: async () => {
                    await RESTManager.api.analyze.delete()
                    message.success('已清空')

                    await fetchData()
                  },
                })
              }}
              name="清空表"
              variant="error"
            ></HeaderActionButton>
          </>
        }
      >
        <Graph />
        <NP>
          <SectionTitle>
            <span>
              总请求量中: PV {count.value.callTime} UV {count.value.uv}
            </span>
          </SectionTitle>
        </NP>

        <NP>
          <SectionTitle>
            <span>今天 - 所有请求的 IP {todayIp.value.length} 个</span>
          </SectionTitle>

          <NSpace>
            {todayIp.value.map(ip => (
              <NPopover
                key={ip}
                trigger="click"
                placement="top"
                onUpdateShow={async show => {
                  await onIpInfoShow(show, ip)
                }}
              >
                {{
                  trigger() {
                    return (
                      <NButton
                        size="tiny"
                        class="!flex !py-[15px]"
                        round
                        type="primary"
                        ghost
                      >
                        {ip}
                      </NButton>
                    )
                  },
                  default() {
                    return <div innerHTML={ipInfoText.value}></div>
                  },
                }}
              </NPopover>
            ))}
          </NSpace>
        </NP>

        <DataTable />
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

interface IP {
  ip: string
  countryName: string
  regionName: string
  cityName: string
  ownerDomain: string
  ispDomain: string
  range?: {
    from: string
    to: string
  }
}

interface IPv6 {
  status: string
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
  query: string
}
