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
import { analyzeApi } from '~/api/analyze'

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
              <div key={i} class={styles.statCard}>
                <NSkeleton
                  text
                  style={{ width: '80px', marginBottom: '8px' }}
                />
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
    const dayChart = ref<HTMLDivElement>()
    const weekChart = ref<HTMLDivElement>()
    const monthChart = ref<HTMLDivElement>()
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
      if (!element || !data?.length) return

      if (charts[field]) {
        charts[field]?.destroy()
      }

      const chart = new Chart({
        container: element,
        autoFit: true,
        height: 250,
        padding: [30, 20, 50, 40],
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
      renderChart(dayChart.value, 'day', props.graphData.day, [
        'hour',
        'key',
        'value',
      ])
      renderChart(weekChart.value, 'week', props.graphData.week, [
        'day',
        'key',
        'value',
      ])
      renderChart(monthChart.value, 'month', props.graphData.month, [
        'date',
        'key',
        'value',
      ])
    }

    onMounted(() => {
      if (!isEmpty(toRaw(props.graphData))) {
        renderAllChart()
      }
    })

    const watcher = watch(
      () => props.graphData,
      () => {
        if (!isEmpty(toRaw(props.graphData))) {
          renderAllChart()
          watcher()
        }
      },
      { deep: true },
    )

    return () => (
      <div class={styles.chartsGrid}>
        {/* Day Chart */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>今日请求走势</h3>
            <span class={styles.chartSubtitle}>按小时统计</span>
          </div>
          <div class={styles.chartContainer}>
            {props.loading ? (
              <NSkeleton animated height={250} />
            ) : (
              <div ref={dayChart} />
            )}
          </div>
        </div>

        {/* Week Chart */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>本周请求走势</h3>
            <span class={styles.chartSubtitle}>按天统计</span>
          </div>
          <div class={styles.chartContainer}>
            {props.loading ? (
              <NSkeleton animated height={250} />
            ) : (
              <div ref={weekChart} />
            )}
          </div>
        </div>

        {/* Month Chart */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>本月请求走势</h3>
            <span class={styles.chartSubtitle}>按日期统计</span>
          </div>
          <div class={styles.chartContainer}>
            {props.loading ? (
              <NSkeleton animated height={250} />
            ) : (
              <div ref={monthChart} />
            )}
          </div>
        </div>

        {/* Top Paths */}
        <div class={styles.chartCard}>
          <div class={styles.chartHeader}>
            <h3 class={styles.chartTitle}>热门请求路径</h3>
            <span class={styles.chartSubtitle}>最近 7 天 Top 10</span>
          </div>
          <div class={styles.chartContainer}>
            {props.loading ? (
              <NSkeleton animated height={250} />
            ) : (
              <TopPathsList paths={props.topPaths.slice(0, 10)} />
            )}
          </div>
        </div>
      </div>
    )
  },
})

const TopPathsList = defineComponent({
  props: {
    paths: {
      type: Array as () => Path[],
      required: true,
    },
  },
  setup(props) {
    const maxCount = computed(() =>
      Math.max(...props.paths.map((p) => p.count), 1),
    )

    return () => (
      <div class={styles.pathList} role="list" aria-label="热门路径列表">
        {props.paths.map((path, index) => (
          <div key={path.path} class={styles.pathItem} role="listitem">
            <span class={styles.pathRank}>{index + 1}</span>
            <span class={styles.pathName} title={decodeURI(path.path)}>
              {decodeURI(path.path)}
            </span>
            <span class={styles.pathCount}>{path.count.toLocaleString()}</span>
            <div class={styles.pathBar}>
              <div
                class={styles.pathBarFill}
                style={{ width: `${(path.count / maxCount.value) * 100}%` }}
              />
            </div>
          </div>
        ))}
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
