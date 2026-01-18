import { MessageSquare as CommentIcon } from 'lucide-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2'

import { aggregateApi } from '~/api/aggregate'

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

      chart = new Chart({
        container: chartRef.value,
        autoFit: true,
        height: 220,
        paddingTop: 20,
        paddingRight: 20,
        paddingBottom: 50,
        paddingLeft: 40,
      })

      chart.options({
        type: 'view',
        data: data.value,
        scale: {
          date: { range: [0, 1] },
          count: { domainMin: 0, nice: true },
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
