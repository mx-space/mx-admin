import { PieChart as PieChartIcon } from 'lucide-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2'

import { aggregateApi } from '~/api/aggregate'

import { ChartCard } from './ChartCard'
import { useChartTheme } from './use-chart-theme'

interface CategoryData {
  id: string
  name: string
  slug: string
  count: number
}

export const CategoryPie = defineComponent({
  setup() {
    const chartRef = ref<HTMLDivElement>()
    const loading = ref(true)
    const data = ref<CategoryData[]>([])
    let chart: Chart | null = null

    const { isDark, chartTheme } = useChartTheme()

    const fetchData = async () => {
      try {
        const result = await aggregateApi.getCategoryDistribution()
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

      const total = data.value.reduce((sum, item) => sum + item.count, 0)
      const chartData = data.value.map((item) => ({
        name: item.name,
        count: item.count,
        percent: item.count / total,
      }))

      const theme = chartTheme.value

      chart = new Chart({
        container: chartRef.value,
        autoFit: true,
        height: 250,
      })

      chart.options({
        type: 'interval',
        data: chartData,
        transform: [{ type: 'stackY' }],
        coordinate: { type: 'theta', outerRadius: 0.85, innerRadius: 0.55 },
        encode: { y: 'count', color: 'name' },
        legend: {
          color: {
            position: 'right',
            itemLabelFill: theme.legend.itemLabelFill,
          },
        },
        tooltip: {
          items: [
            (d: { name: string; count: number; percent: number }) => ({
              name: d.name,
              value: `${d.count} 篇 (${(d.percent * 100).toFixed(0)}%)`,
            }),
          ],
        },
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
        title="分类分布"
        icon={<PieChartIcon />}
        loading={loading.value}
      >
        <div ref={chartRef} class="h-full w-full" />
      </ChartCard>
    )
  },
})
