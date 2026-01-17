import { MessageSquare as CommentIcon } from 'lucide-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2/esm'

import { RESTManager } from '~/utils'

import { ChartCard } from './ChartCard'

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

    const fetchData = async () => {
      try {
        const result =
          await RESTManager.api.aggregate.stat['comment-activity'].get<
            ActivityData[]
          >()
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

      chart = new Chart({
        container: chartRef.value,
        autoFit: true,
        height: 220,
        padding: [20, 20, 50, 40],
      })

      chart.data(data.value)
      chart.scale({
        date: { range: [0, 1] },
        count: { min: 0, nice: true },
      })
      chart.tooltip({
        showCrosshairs: true,
      })
      chart.area().position('date*count').shape('smooth').color('#8884d8')
      chart.line().position('date*count').shape('smooth').color('#8884d8')
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
        title="评论活跃度（近30天）"
        icon={<CommentIcon />}
        loading={loading.value}
      >
        <div ref={chartRef} class="h-full w-full" />
      </ChartCard>
    )
  },
})
