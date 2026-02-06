import { MessageSquare as CommentIcon } from 'lucide-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2'

import { aggregateApi } from '~/api/aggregate'

import { ChartCard } from './ChartCard'
import { useChartTheme } from './use-chart-theme'

interface ActivityData {
  date: string
  count: number
}

export const CommentActivity = defineComponent({
  setup() {
    const chartRef = ref<HTMLDivElement>()
    const loading = ref(true)
    const data = ref<ActivityData[]>([])
    let chart: Chart | null = null

    const { isDark, chartTheme } = useChartTheme()

    const fetchData = async () => {
      try {
        const result = await aggregateApi.getCommentActivity()
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

      const theme = chartTheme.value

      chart = new Chart({
        container: chartRef.value,
        autoFit: true,
        height: 250,
      })

      chart.options({
        type: 'view',
        data: data.value,
        paddingTop: 24,
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
          },
          y: {
            labelFill: theme.axis.y.labelFill,
            lineStroke: theme.axis.y.lineStroke,
            gridStroke: theme.axis.y.gridStroke,
          },
        },
        interaction: {
          tooltip: { crosshairs: true },
        },
        children: [
          {
            type: 'area',
            encode: { x: 'date', y: 'count' },
            style: { shape: 'smooth', fill: '#8884d8', fillOpacity: 0.4 },
          },
          {
            type: 'line',
            encode: { x: 'date', y: 'count' },
            style: { shape: 'smooth', stroke: '#8884d8' },
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
        title="评论活跃度（近30天）"
        icon={<CommentIcon />}
        loading={loading.value}
      >
        <div ref={chartRef} class="h-full w-full" />
      </ChartCard>
    )
  },
})
