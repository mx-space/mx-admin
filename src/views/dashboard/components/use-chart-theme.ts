import { computed } from 'vue'

import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'

/**
 * 图表暗色模式主题配置 hook
 */
export function useChartTheme() {
  const uiStore = useStoreRef(UIStore)
  const isDark = computed(() => uiStore.isDark.value)

  // 暗色模式下的文字颜色
  const textColor = computed(() => (isDark.value ? '#a3a3a3' : '#525252'))
  // 暗色模式下的次要文字颜色
  const textColorSecondary = computed(() =>
    isDark.value ? '#737373' : '#737373',
  )

  // G2 图表主题配置
  const chartTheme = computed(() => ({
    // 坐标轴样式
    axis: {
      x: {
        labelFill: textColor.value,
        labelFillOpacity: 1,
        tickStroke: textColorSecondary.value,
        lineStroke: textColorSecondary.value,
      },
      y: {
        labelFill: textColor.value,
        labelFillOpacity: 1,
        tickStroke: textColorSecondary.value,
        lineStroke: textColorSecondary.value,
        gridStroke: isDark.value ? '#404040' : '#e5e5e5',
      },
    },
    // 图例样式
    legend: {
      itemLabelFill: textColor.value,
      itemLabelFillOpacity: 1,
    },
    // 标签样式
    label: {
      fill: textColor.value,
      fillOpacity: 1,
    },
  }))

  return {
    isDark,
    textColor,
    chartTheme,
  }
}
