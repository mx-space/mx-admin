import { Tags as TagsIcon } from 'lucide-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'

import { Chart } from '@antv/g2'

import { aggregateApi } from '~/api/aggregate'

import { ChartCard } from './ChartCard'
import { useChartTheme } from './use-chart-theme'

interface TagData {
  tag: string
  count: number
}

export const TagCloud = defineComponent({
  setup() {
    const chartRef = ref<HTMLDivElement>()
    const loading = ref(true)
    const data = ref<TagData[]>([])
    let chart: Chart | null = null

    const { isDark, chartTheme } = useChartTheme()

    const fetchData = async () => {
      try {
        const result = await aggregateApi.getTagCloud()
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
        type: 'wordCloud',
        data: data.value,
        encode: {
          color: 'tag',
        },
        layout: {
          fontSize: [14, 32],
          spiral: 'rectangular',
          padding: 2,
        },
        style: {
          fontFamily: 'system-ui, sans-serif',
          text: (d: TagData) => d.tag,
          fontSize: (d: TagData) => {
            const max = Math.max(...data.value.map((t) => t.count))
            const min = Math.min(...data.value.map((t) => t.count))
            const range = max - min || 1
            const ratio = (d.count - min) / range
            return 14 + ratio * 18
          },
          fill: theme.label.fill,
        },
        tooltip: {
          items: [
            (d: TagData) => ({
              name: d.tag,
              value: `${d.count} 篇文章`,
            }),
          ],
        },
        legend: false,
      })

      chart.render()
    }

    onMounted(() => {
      fetchData()
    })

    watch(
      [() => data.value, isDark],
      () => {
        if (data.value.length > 0) {
          setTimeout(renderChart, 0)
        }
      },
      { deep: true },
    )

    return () => (
      <ChartCard
        title="标签热词 Top 20"
        icon={<TagsIcon />}
        loading={loading.value}
        height={250}
      >
        <div ref={chartRef} class="h-full w-full" />
      </ChartCard>
    )
  },
})
