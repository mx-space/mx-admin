import { TrendingUp as TrendingUpIcon } from 'lucide-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2'

import { aggregateApi } from '~/api/aggregate'

import { ChartCard } from './ChartCard'
import { useChartTheme } from './use-chart-theme'

interface TrendData {
  date: string
  posts: number
  notes: number
}

export const PublicationTrend = defineComponent({
  setup() {
    const chartRef = ref<HTMLDivElement>()
    const loading = ref(true)
    const data = ref<TrendData[]>([])
    let chart: Chart | null = null

    const { isDark, chartTheme } = useChartTheme()

    const fetchData = async () => {
      try {
        const result = await aggregateApi.getPublicationTrend()
        data.value = Array.isArray(result) ? result : []
      } catch {
        data.value = []
      } finally {
        loading.value = false
      }
    }

    const renderChart = () => {
      if (!chartRef.value || data.value.length === 0) return

      if (chart) {
        chart.destroy()
      }

      const chartData: { date: string; type: string; count: number }[] = []
      for (const item of data.value) {
        chartData.push({ date: item.date, type: '博文', count: item.posts })
        chartData.push({ date: item.date, type: '日记', count: item.notes })
      }

      const theme = chartTheme.value

      chart = new Chart({
        container: chartRef.value,
        autoFit: true,
        height: 250,
      })

      chart.options({
        type: 'view',
        data: chartData,
        paddingTop: 36,
        paddingRight: 24,
        paddingBottom: 36,
        paddingLeft: 36,
        scale: {
          date: { range: [0, 1] },
          count: { domainMin: 0, nice: true },
        },
        axis: {
          x: {
            labelFill: theme.axis.x.labelFill,
            lineStroke: theme.axis.x.lineStroke,
            tickStroke: theme.axis.x.tickStroke,
            labelAutoRotate: false,
            tickFilter: (_: unknown, index: number) => index % 3 === 0,
            labelFilter: (_: unknown, index: number) => index % 3 === 0,
          },
          y: {
            labelFill: theme.axis.y.labelFill,
            lineStroke: theme.axis.y.lineStroke,
            gridStroke: theme.axis.y.gridStroke,
          },
        },
        interaction: {
          tooltip: { crosshairs: true, shared: true },
        },
        legend: {
          color: {
            position: 'top',
            itemLabelFill: theme.legend.itemLabelFill,
          },
        },
        children: [
          {
            type: 'line',
            encode: { x: 'date', y: 'count', color: 'type' },
            style: { shape: 'smooth' },
          },
          {
            type: 'point',
            encode: { x: 'date', y: 'count', color: 'type' },
          },
        ],
      })

      chart.render()
    }

    onMounted(() => {
      fetchData()
    })

    watch([() => data.value, isDark], () => {
      if (data.value.length > 0) {
        setTimeout(renderChart, 0)
      }
    })

    return () => (
      <ChartCard
        title="发布趋势"
        icon={<TrendingUpIcon />}
        loading={loading.value}
      >
        <div ref={chartRef} class="h-full w-full" />
      </ChartCard>
    )
  },
})
