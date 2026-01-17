import { isEmpty } from 'es-toolkit/compat'
import {
  NButton,
  NDataTable,
  NP,
  NSkeleton,
  NSpace,
  NTabPane,
  NTabs,
  useDialog,
} from 'naive-ui'
import {
  defineComponent,
  onBeforeMount,
  onMounted,
  ref,
  toRaw,
  watch,
} from 'vue'
import type { IPAggregate, Month, Path, Today, Total, Week } from './types'

import { Chart } from '@antv/g2/esm'

import { IpInfoPopover } from '~/components/ip-info'
import { RESTManager } from '~/utils'

import { AnalyzeDataTable } from './components/analyze-data-table'
import { GuestActivity } from './components/guest-activity'
import { ReadingRank } from './components/reading-rank'

const SectionTitle = defineComponent((_, { slots }) => () => (
  <div class="my-[12px] font-semibold text-gray-400">{slots.default?.()}</div>
))
export default defineComponent({
  setup() {
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
        (_n, _old) => {
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
            <div ref={dayChart} />
            {isEmpty(graphData.value) && <NSkeleton animated height={250} />}
          </div>
          <div>
            <SectionTitle>本周请求走势</SectionTitle>
            <div ref={weekChart} />
            {isEmpty(graphData.value) && <NSkeleton animated height={250} />}
          </div>
          <div>
            <SectionTitle>本月请求走势</SectionTitle>
            <div ref={monthChart} />
            {isEmpty(graphData.value) && <NSkeleton animated height={250} />}
          </div>
          <div>
            <SectionTitle>最近 7 天请求路径 Top 10</SectionTitle>
            <div ref={pieChart} />
            {isEmpty(graphData.value) && <NSkeleton animated height={250} />}
          </div>
        </div>
      )
    })

    const modal = useDialog()

    return () => (
      <>
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
              <NSkeleton animated class="my-2 h-[200px]" />
            ) : (
              <NP>
                <SectionTitle>
                  <span>今天 - 所有请求的 IP {todayIp.value.length} 个</span>
                </SectionTitle>

                <div>
                  <NSpace>
                    {todayIp.value.slice(0, 100).map((ip) => (
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
                      />
                    ))}
                  </NSpace>
                  {todayIp.value.length > 100 && (
                    <div class={'mt-6 flex justify-center'}>
                      <NButton
                        round
                        onClick={() => {
                          modal.create({
                            title: '今天所有请求的 IP',
                            content: () => (
                              <NDataTable
                                virtualScroll
                                maxHeight={300}
                                data={todayIp.value?.map((i) => ({ ip: i }))}
                                columns={[
                                  {
                                    title: 'IP',
                                    key: 'ip',
                                    render(rowData) {
                                      const ip = rowData.ip
                                      return (
                                        <IpInfoPopover
                                          ip={ip}
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
                                        />
                                      )
                                    },
                                  },
                                ]}
                              />
                            ),
                          })
                        }}
                      >
                        查看更多
                      </NButton>
                    </div>
                  )}
                </div>
              </NP>
            )}
          </NTabPane>

          <NTabPane name={'访问路径'}>
            <AnalyzeDataTable />
          </NTabPane>

          <NTabPane name="访客活动">
            <GuestActivity />
          </NTabPane>

          <NTabPane name="阅读排名">
            <ReadingRank />
          </NTabPane>
        </NTabs>
      </>
    )
  },
})
