import { Monitor as MonitorIcon } from 'lucide-vue-next'
import { NGi, NGrid } from 'naive-ui'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2'

import { aggregateApi } from '~/api/aggregate'

import { ChartCard } from './ChartCard'
import { useChartTheme } from './use-chart-theme'

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

    const { isDark, chartTheme } = useChartTheme()

    const fetchData = async () => {
      try {
        const result = await aggregateApi.getTrafficSource()
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

    const processChartData = (chartData: SourceData[], topN = 5) => {
      if (chartData.length === 0) return []

      const sorted = [...chartData].sort((a, b) => b.count - a.count)
      const total = sorted.reduce((sum, item) => sum + item.count, 0)

      if (sorted.length <= topN) {
        return sorted.map((item) => ({
          name: item.name || '未知',
          count: item.count,
          percent: item.count / total,
        }))
      }

      const topItems = sorted.slice(0, topN)
      const otherItems = sorted.slice(topN)
      const otherCount = otherItems.reduce((sum, item) => sum + item.count, 0)

      const result = topItems.map((item) => ({
        name: item.name || '未知',
        count: item.count,
        percent: item.count / total,
      }))

      if (otherCount > 0) {
        result.push({
          name: '其他',
          count: otherCount,
          percent: otherCount / total,
        })
      }

      return result
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

      const pieData = processChartData(chartData, 5)

      const theme = chartTheme.value

      const chart = new Chart({
        container,
        autoFit: true,
        height: 160,
      })

      chart.options({
        type: 'interval',
        data: pieData,
        transform: [{ type: 'stackY' }],
        coordinate: { type: 'theta', outerRadius: 0.85 },
        encode: { y: 'count', color: 'name' },
        legend: {
          color: {
            position: 'bottom',
            flipPage: false,
            maxRows: 2,
            itemLabelFill: theme.legend.itemLabelFill,
          },
        },
        tooltip: {
          items: [
            (d: { name: string; count: number; percent: number }) => ({
              name: d.name,
              value: `${d.count} 次 (${(d.percent * 100).toFixed(1)}%)`,
            }),
          ],
        },
        labels: [
          {
            text: (d: { percent: number }) =>
              d.percent >= 0.05 ? `${(d.percent * 100).toFixed(0)}%` : '',
            fill: theme.label.fill,
          },
        ],
      })

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

    // 数据变化或主题变化时重新渲染
    watch(
      [() => data.value, isDark],
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
        height={250}
      >
        <NGrid xGap={12} cols={2} class="px-4">
          <NGi>
            <div class="mb-1 text-center text-xs text-neutral-500">
              操作系统
            </div>
            <div ref={osChartRef} style={{ height: '200px' }} />
          </NGi>
          <NGi>
            <div class="mb-1 text-center text-xs text-neutral-500">浏览器</div>
            <div ref={browserChartRef} style={{ height: '200px' }} />
          </NGi>
        </NGrid>
      </ChartCard>
    )
  },
})
