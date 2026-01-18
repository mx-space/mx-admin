import { TrendingUp as TrendingUpIcon } from 'lucide-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2/esm'

import { aggregateApi } from '~/api/aggregate'

import { ChartCard } from './ChartCard'

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

      // 转换数据为折线图需要的格式
      const chartData: { date: string; type: string; count: number }[] = []
      for (const item of data.value) {
        chartData.push({ date: item.date, type: '博文', count: item.posts })
        chartData.push({ date: item.date, type: '日记', count: item.notes })
      }

      chart = new Chart({
        container: chartRef.value,
        autoFit: true,
        height: 220,
        padding: [20, 20, 50, 40],
      })

      chart.data(chartData)
      chart.scale({
        date: { range: [0, 1] },
        count: { min: 0, nice: true },
      })
      chart.tooltip({
        showCrosshairs: true,
        shared: true,
      })
      chart.legend({
        position: 'top',
      })
      chart.line().position('date*count').color('type').shape('smooth')
      chart.point().position('date*count').color('type').shape('circle')
      chart.render()
    }

    onMounted(() => {
      fetchData()
    })

    watch(
      () => data.value,
      () => {
        if (data.value.length > 0) {
          setTimeout(renderChart, 0)
        }
      },
    )

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
