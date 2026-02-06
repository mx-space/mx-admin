import { isEmpty } from 'es-toolkit/compat'
import {
  Eye as EyeIcon,
  Globe as GlobeIcon,
  Route as RouteIcon,
  Users as UsersIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NDataTable,
  NSkeleton,
  NTabPane,
  NTabs,
  useDialog,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  watch,
} from 'vue'
import type { ReadingRankItem } from '~/api/activity'
import type {
  DeviceDistributionResponse,
  TrafficSourceResponse,
} from '~/api/analyze'
import type { IPAggregate, Month, Path, Today, Total, Week } from './types'

import { Chart } from '@antv/g2'

import { activityApi } from '~/api/activity'
import { analyzeApi } from '~/api/analyze'
import { IpInfoPopover } from '~/components/ip-info'

import { AnalyzeDataTable } from './components/analyze-data-table'
import { GuestActivity } from './components/guest-activity'
import { ReadingRank } from './components/reading-rank'
import styles from './index.module.css'

export default defineComponent({
  setup() {
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
    const loading = ref(true)

    onBeforeMount(async () => {
      const data = (await analyzeApi.getAggregate()) as IPAggregate
      count.value = data.total
      todayIp.value = data.todayIps
      graphData.value = {
        day: data.today,
        week: data.weeks,
        month: data.months,
      }
      topPaths.value = [...data.paths]
      loading.value = false
    })

    return () => (
      <div class={styles.container}>
        {/* Stats Overview */}
        <StatsOverview
          count={count.value}
          todayIpCount={todayIp.value?.length || 0}
          loading={loading.value}
        />

        {/* Charts Section */}
        <ChartsSection
          graphData={graphData.value}
          topPaths={topPaths.value}
          loading={loading.value}
        />

        {/* Tabs Section */}
        <div class={styles.tabsContainer}>
          <NTabs type="line" animated>
            <NTabPane name="ip" tab="IP 记录">
              <IpRecordSection
                todayIp={todayIp.value}
                loading={loading.value}
              />
            </NTabPane>

            <NTabPane name="path" tab="访问路径">
              <AnalyzeDataTable />
            </NTabPane>

            <NTabPane name="activity" tab="访客活动">
              <GuestActivity />
            </NTabPane>

            <NTabPane name="rank" tab="阅读排名">
              <ReadingRank />
            </NTabPane>
          </NTabs>
        </div>
      </div>
    )
  },
})

const StatsOverview = defineComponent({
  props: {
    count: {
      type: Object as () => Total,
      required: true,
    },
    todayIpCount: {
      type: Number,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const stats = computed(() => [
      {
        label: '总访问量 (PV)',
        value: props.count.callTime || 0,
        icon: EyeIcon,
      },
      {
        label: '独立访客 (UV)',
        value: props.count.uv || 0,
        icon: UsersIcon,
      },
      {
        label: '今日访问 IP',
        value: props.todayIpCount,
        icon: GlobeIcon,
      },
      {
        label: '平均访问深度',
        value: props.count.uv
          ? (props.count.callTime / props.count.uv).toFixed(1)
          : '0',
        icon: RouteIcon,
      },
    ])

    return () => (
      <div class={styles.statsGrid} role="region" aria-label="访问统计概览">
        {props.loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                class={[styles.statCard, 'flex items-center justify-between']}
              >
                <NSkeleton text style={{ width: '120px' }} />
                <NSkeleton text style={{ width: '60px', height: '28px' }} />
              </div>
            ))
          : stats.value.map((stat) => (
              <div key={stat.label} class={styles.statCard}>
                <stat.icon class={styles.statIcon} aria-hidden="true" />
                <div class={styles.statLabel}>{stat.label}</div>
                <div class={styles.statValue}>
                  {stat.value.toLocaleString()}
                </div>
              </div>
            ))}
      </div>
    )
  },
})

const ChartsSection = defineComponent({
  props: {
    graphData: {
      type: Object as () => { day: Today[]; week: Week[]; month: Month[] },
      required: true,
    },
    topPaths: {
      type: Array as () => Path[],
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const trendChart = ref<HTMLDivElement>()
    const articlesChart = ref<HTMLDivElement>()
    const trafficChart = ref<HTMLDivElement>()
    const deviceChart = ref<HTMLDivElement>()
    const charts: Record<string, Chart | null> = {
      trend: null,
      articles: null,
      traffic: null,
      device: null,
    }

    const topArticles = ref<ReadingRankItem[]>([])
    const trafficSource = ref<TrafficSourceResponse | null>(null)
    const deviceDistribution = ref<DeviceDistributionResponse | null>(null)
    const chartsLoading = ref(true)

    const isDark = () => document.documentElement.classList.contains('dark')
    const getTextColor = () => (isDark() ? '#a3a3a3' : '#525252')

    const fetchChartsData = async () => {
      chartsLoading.value = true
      try {
        const [articlesRes, trafficRes, deviceRes] = await Promise.all([
          activityApi.getTopReadings(),
          analyzeApi.getTrafficSource(),
          analyzeApi.getDeviceDistribution(),
        ])
        topArticles.value = articlesRes.slice(0, 5)
        trafficSource.value = trafficRes
        deviceDistribution.value = deviceRes
      } catch (e) {
        console.error('Failed to fetch charts data:', e)
      } finally {
        chartsLoading.value = false
      }
    }

    function renderTrendChart(
      element: HTMLElement | undefined,
      weekData: Week[],
    ) {
      if (!element || !weekData?.length) return

      if (charts.trend) {
        charts.trend?.destroy()
      }

      const textColor = getTextColor()
      const chart = new Chart({
        container: element,
        autoFit: true,
        height: 250,
        paddingTop: 30,
        paddingRight: 20,
        paddingBottom: 50,
        paddingLeft: 40,
      })
      charts.trend = chart

      chart.options({
        type: 'view',
        data: weekData,
        scale: {
          day: { range: [0, 1] },
          value: { domainMin: 0, nice: true },
        },
        axis: {
          x: { title: false, labelFill: textColor },
          y: { title: false, labelFill: textColor },
        },
        legend: { color: { itemLabelFill: textColor } },
        interaction: {
          tooltip: { crosshairs: true, shared: true },
        },
        children: [
          {
            type: 'line',
            encode: { x: 'day', y: 'value', color: 'key' },
            style: { shape: 'smooth' },
          },
          {
            type: 'point',
            encode: { x: 'day', y: 'value', color: 'key' },
          },
        ],
      })

      chart.render()
    }

    function renderArticlesChart(
      element: HTMLElement | undefined,
      articles: ReadingRankItem[],
    ) {
      if (!element || !articles?.length) return

      if (charts.articles) {
        charts.articles?.destroy()
      }

      const textColor = getTextColor()
      const chart = new Chart({
        container: element,
        autoFit: true,
        height: 250,
        paddingLeft: 120,
        paddingRight: 30,
      })
      charts.articles = chart

      const data = articles.map((item, index) => ({
        title: item.ref?.title || '未知标题',
        count: item.count,
        rank: index + 1,
      }))

      chart.options({
        type: 'interval',
        data,
        encode: { x: 'title', y: 'count', color: 'rank' },
        coordinate: { transform: [{ type: 'transpose' }] },
        scale: {
          x: { domain: data.map((d) => d.title).reverse() },
          color: {
            range: ['#f59e0b', '#fbbf24', '#fcd34d', '#a3a3a3', '#d4d4d4'],
          },
        },
        axis: {
          y: { title: false, labelFill: textColor },
          x: {
            title: false,
            labelFill: textColor,
            labelFormatter: (text: string) =>
              text.length > 12 ? `${text.slice(0, 12)}...` : text,
          },
        },
        legend: false,
        tooltip: {
          items: [
            {
              channel: 'y',
              name: '阅读量',
              valueFormatter: (d: number) => `${d.toLocaleString()} 次`,
            },
          ],
        },
      })

      chart.render()
    }

    function renderTrafficChart(
      element: HTMLElement | undefined,
      data: TrafficSourceResponse | null,
    ) {
      if (!element || !data?.categories?.length) return

      if (charts.traffic) {
        charts.traffic?.destroy()
      }

      const textColor = getTextColor()
      const chart = new Chart({
        container: element,
        autoFit: true,
        height: 280,
        paddingBottom: 40,
      })
      charts.traffic = chart

      chart.options({
        type: 'interval',
        data: data.categories,
        encode: { x: 'name', y: 'value', color: 'name' },
        transform: [{ type: 'stackY' }],
        coordinate: { type: 'theta', innerRadius: 0.4 },
        legend: {
          color: {
            position: 'bottom',
            layout: { justifyContent: 'center' },
            itemLabelFill: textColor,
          },
        },
        labels: [
          {
            text: 'value',
            position: 'outside',
            style: { fill: textColor },
          },
        ],
        tooltip: {
          items: [{ channel: 'y', valueFormatter: (d: number) => `${d} 次` }],
        },
      })

      chart.render()
    }

    function renderDeviceChart(
      element: HTMLElement | undefined,
      data: DeviceDistributionResponse | null,
    ) {
      if (!element || !data?.devices?.length) return

      if (charts.device) {
        charts.device?.destroy()
      }

      const textColor = getTextColor()
      const chart = new Chart({
        container: element,
        autoFit: true,
        height: 280,
        paddingBottom: 40,
      })
      charts.device = chart

      chart.options({
        type: 'interval',
        data: data.devices,
        encode: { x: 'name', y: 'value', color: 'name' },
        transform: [{ type: 'stackY' }],
        coordinate: {
          type: 'theta',
          innerRadius: 0.4,
        },
        legend: {
          color: {
            position: 'bottom',
            layout: { justifyContent: 'center' },
            itemLabelFill: textColor,
          },
        },
        labels: [
          {
            text: 'value',
            position: 'outside',
            style: { fill: textColor },
          },
        ],
        tooltip: {
          items: [{ channel: 'y', valueFormatter: (d: number) => `${d} 次` }],
        },
      })

      chart.render()
    }

    onMounted(() => {
      fetchChartsData()
    })

    onUnmounted(() => {
      Object.values(charts).forEach((chart) => chart?.destroy())
    })

    watch(
      () => props.loading,
      async (loading) => {
        if (!loading && !isEmpty(toRaw(props.graphData))) {
          await nextTick()
          renderTrendChart(trendChart.value, props.graphData.week)
        }
      },
    )

    watch(chartsLoading, async (loading) => {
      if (!loading) {
        await nextTick()
        if (topArticles.value?.length) {
          renderArticlesChart(articlesChart.value, topArticles.value)
        }
        if (trafficSource.value) {
          renderTrafficChart(trafficChart.value, trafficSource.value)
        }
        if (deviceDistribution.value) {
          renderDeviceChart(deviceChart.value, deviceDistribution.value)
        }
      }
    })

    return () => (
      <div class={styles.chartsGrid}>
        {/* Trend Chart */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>本周访问趋势</h3>
            <span class={styles.chartSubtitle}>PV / UV 对比</span>
          </div>
          <div class={styles.chartContainer}>
            {props.loading ? (
              <NSkeleton animated height={250} />
            ) : (
              <div ref={trendChart} />
            )}
          </div>
        </div>

        {/* Top Articles Bar Chart */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>热门文章（近 14 天）</h3>
            <span class={styles.chartSubtitle}>阅读量 Top 5</span>
          </div>
          <div class={styles.chartContainer}>
            {chartsLoading.value ? (
              <NSkeleton animated height={250} />
            ) : topArticles.value.length === 0 ? (
              <div class={styles.empty}>
                <p class={styles.emptyDescription}>暂无阅读数据</p>
              </div>
            ) : (
              <div ref={articlesChart} />
            )}
          </div>
        </div>

        {/* Traffic Source Pie Chart */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>流量来源</h3>
            <span class={styles.chartSubtitle}>最近 7 天</span>
          </div>
          <div class={styles.chartContainer}>
            {chartsLoading.value ? (
              <NSkeleton animated height={250} />
            ) : !trafficSource.value?.categories?.length ? (
              <div class={styles.empty}>
                <p class={styles.emptyDescription}>暂无流量来源数据</p>
              </div>
            ) : (
              <div ref={trafficChart} />
            )}
          </div>
        </div>

        {/* Device Distribution Chart */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>设备分布</h3>
            <span class={styles.chartSubtitle}>最近 7 天</span>
          </div>
          <div class={styles.chartContainer}>
            {chartsLoading.value ? (
              <NSkeleton animated height={250} />
            ) : !deviceDistribution.value?.devices?.length ? (
              <div class={styles.empty}>
                <p class={styles.emptyDescription}>暂无设备数据</p>
              </div>
            ) : (
              <div ref={deviceChart} />
            )}
          </div>
        </div>
      </div>
    )
  },
})

const IpRecordSection = defineComponent({
  props: {
    todayIp: {
      type: Array as () => string[],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const modal = useDialog()

    return () => (
      <div class={styles.ipSection}>
        {props.loading ? (
          <div class={styles.ipGrid}>
            {Array.from({ length: 10 }).map((_, i) => (
              <NSkeleton
                key={i}
                text
                style={{ height: '40px', borderRadius: '8px' }}
              />
            ))}
          </div>
        ) : !props.todayIp?.length ? (
          <div class={styles.empty} role="status">
            <div class={styles.emptyIcon}>
              <GlobeIcon />
            </div>
            <h3 class={styles.emptyTitle}>暂无 IP 记录</h3>
            <p class={styles.emptyDescription}>今天还没有访问记录</p>
          </div>
        ) : (
          <>
            <div class={styles.ipSectionHeader}>
              <h3 class={styles.ipSectionTitle}>今日访问 IP</h3>
              <span class={styles.ipCount}>{props.todayIp.length} 个</span>
            </div>

            <div class={styles.ipGrid}>
              {props.todayIp.slice(0, 20).map((ip) => (
                <IpInfoPopover
                  key={ip}
                  ip={ip}
                  triggerEl={
                    <button
                      type="button"
                      class={styles.ipCard}
                      aria-label={`查看 IP ${ip} 的详情`}
                    >
                      <GlobeIcon class={styles.ipIcon} />
                      <span class={styles.ipAddress}>{ip}</span>
                    </button>
                  }
                />
              ))}
            </div>

            {props.todayIp.length > 20 && (
              <div class={styles.viewMoreButton}>
                <NButton
                  round
                  onClick={() => {
                    modal.create({
                      title: `今天所有请求的 IP (${props.todayIp?.length} 个)`,
                      content: () => (
                        <NDataTable
                          virtualScroll
                          maxHeight={400}
                          data={props.todayIp?.map((i) => ({ ip: i }))}
                          columns={[
                            {
                              title: 'IP 地址',
                              key: 'ip',
                              render(rowData) {
                                const ip = rowData.ip
                                return (
                                  <IpInfoPopover
                                    ip={ip}
                                    triggerEl={
                                      <NButton
                                        size="tiny"
                                        quaternary
                                        type="primary"
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
                  查看全部 {props.todayIp.length} 个 IP
                </NButton>
              </div>
            )}
          </>
        )}
      </div>
    )
  },
})
