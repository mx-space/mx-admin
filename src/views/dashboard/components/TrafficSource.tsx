import { Monitor as MonitorIcon } from 'lucide-vue-next'
import { NGi, NGrid } from 'naive-ui'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2/esm'

import { RESTManager } from '~/utils'

import { ChartCard } from './ChartCard'

interface SourceData {
  name: string
  count: number
}

interface TrafficData {
  os: SourceData[]
  browser: SourceData[]
}

export const TrafficSource = defineComponent({
  setup() {
    const osChartRef = ref<HTMLDivElement>()
    const browserChartRef = ref<HTMLDivElement>()
    const loading = ref(true)
    const data = ref<TrafficData>({ os: [], browser: [] })
    let osChart: Chart | null = null
    let browserChart: Chart | null = null

    const fetchData = async () => {
      try {
        const result =
          await RESTManager.api.aggregate.stat[
            'traffic-source'
          ].get<TrafficData>()
        data.value = {
          os: Array.isArray(result?.os) ? result.os : [],
          browser: Array.isArray(result?.browser) ? result.browser : [],
        }
      } catch {
        data.value = { os: [], browser: [] }
      } finally {
        loading.value = false
      }
    }

    const renderPieChart = (
      container: HTMLElement,
      chartData: SourceData[],
      existingChart: Chart | null,
    ): Chart | null => {
      if (chartData.length === 0) return null

      if (existingChart) {
        existingChart.destroy()
      }

      const total = chartData.reduce((sum, item) => sum + item.count, 0)
      const pieData = chartData.map((item) => ({
        name: item.name || '未知',
        count: item.count,
        percent: item.count / total,
      }))

      const chart = new Chart({
        container,
        autoFit: true,
        height: 180,
      })

      chart.coordinate('theta', {
        radius: 0.75,
      })

      chart.data(pieData)
      chart.tooltip({
        showTitle: false,
        showMarkers: false,
      })
      chart.legend({
        position: 'bottom',
        flipPage: false,
      })
      chart
        .interval()
        .position('count')
        .color('name')
        .label('percent', {
          content: (d) => `${(d.percent * 100).toFixed(0)}%`,
        })
        .adjust('stack')

      chart.render()
      return chart
    }

    const renderCharts = () => {
      if (osChartRef.value) {
        osChart = renderPieChart(osChartRef.value, data.value.os, osChart)
      }
      if (browserChartRef.value) {
        browserChart = renderPieChart(
          browserChartRef.value,
          data.value.browser,
          browserChart,
        )
      }
    }

    onMounted(() => {
      fetchData()
    })

    watch(
      () => data.value,
      () => {
        if (data.value.os.length > 0 || data.value.browser.length > 0) {
          setTimeout(renderCharts, 0)
        }
      },
      { deep: true },
    )

    return () => (
      <ChartCard
        title="访问来源（近7天）"
        icon={<MonitorIcon />}
        loading={loading.value}
        height={220}
      >
        <NGrid xGap={12} cols={2}>
          <NGi>
            <div class="mb-2 text-center text-xs text-neutral-500">
              操作系统
            </div>
            <div ref={osChartRef} style={{ height: '180px' }} />
          </NGi>
          <NGi>
            <div class="mb-2 text-center text-xs text-neutral-500">浏览器</div>
            <div ref={browserChartRef} style={{ height: '180px' }} />
          </NGi>
        </NGrid>
      </ChartCard>
    )
  },
})
