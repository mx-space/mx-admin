import { Tags as TagsIcon } from 'lucide-vue-next'
import { NSpace, NTag } from 'naive-ui'
import { defineComponent, onMounted, ref } from 'vue'

import { RESTManager } from '~/utils'

import { ChartCard } from './ChartCard'

interface TagData {
  tag: string
  count: number
}

export const TagCloud = defineComponent({
  setup() {
    const loading = ref(true)
    const data = ref<TagData[]>([])

    const fetchData = async () => {
      try {
        const result =
          await RESTManager.api.aggregate.stat['tag-cloud'].get<TagData[]>()
        data.value = Array.isArray(result) ? result : []
      } catch {
        data.value = []
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchData()
    })

    // 根据 count 计算标签大小
    const getTagSize = (count: number): 'small' | 'medium' | 'large' => {
      if (data.value.length === 0) return 'small'
      const max = Math.max(...data.value.map((t) => t.count))
      const ratio = max > 0 ? count / max : 0
      if (ratio > 0.6) return 'large'
      if (ratio > 0.3) return 'medium'
      return 'small'
    }

    // 根据 count 计算字体大小
    const getFontSize = (count: number): string => {
      if (data.value.length === 0) return '12px'
      const max = Math.max(...data.value.map((t) => t.count))
      const min = Math.min(...data.value.map((t) => t.count))
      const range = max - min || 1
      const ratio = (count - min) / range
      const fontSize = 12 + ratio * 10 // 12px to 22px
      return `${fontSize}px`
    }

    // 计算透明度
    const getOpacity = (count: number): number => {
      if (data.value.length === 0) return 0.7
      const max = Math.max(...data.value.map((t) => t.count))
      return max > 0 ? 0.7 + (count / max) * 0.3 : 0.7
    }

    return () => (
      <ChartCard
        title="标签热词 Top 20"
        icon={<TagsIcon />}
        loading={loading.value}
        height={300}
      >
        <NSpace wrap size={[8, 8]} class="p-2">
          {data.value.map((item) => (
            <NTag
              key={item.tag}
              size={getTagSize(item.count)}
              round
              bordered={false}
              style={{
                fontSize: getFontSize(item.count),
                opacity: getOpacity(item.count),
              }}
            >
              {item.tag}
              <span class="ml-1 text-xs opacity-60">({item.count})</span>
            </NTag>
          ))}
        </NSpace>
      </ChartCard>
    )
  },
})
