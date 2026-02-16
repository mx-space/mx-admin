import { Eye, Heart } from 'lucide-vue-next'
import { NScrollbar } from 'naive-ui'
import { defineComponent, onMounted, ref } from 'vue'

import { aggregateApi } from '~/api/aggregate'
import { WEB_URL } from '~/constants/env'

import { ChartCard } from './ChartCard'

interface ArticleData {
  id: string
  title: string
  slug: string
  reads: number
  likes: number
  category: {
    name: string
    slug: string
  } | null
}

export const TopArticles = defineComponent({
  setup() {
    const loading = ref(true)
    const data = ref<ArticleData[]>([])

    const fetchData = async () => {
      try {
        const result = await aggregateApi.getTopArticles()
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

    const formatNumber = (num: number) => {
      if (num >= 10000) {
        return `${(num / 10000).toFixed(1)}w`
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`
      }
      return num.toString()
    }

    return () => (
      <ChartCard title="热门文章 Top 10" loading={loading.value} height={250}>
        <NScrollbar style={{ maxHeight: '250px' }}>
          <div class="space-y-1 px-4 pb-3">
            {data.value.map((item, index) => (
              <a
                key={item.id}
                href={
                  item.category
                    ? `${WEB_URL}/posts/${item.category.slug}/${item.slug}`
                    : '#'
                }
                target="_blank"
                class="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                rel="noreferrer"
              >
                <span
                  class={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-medium',
                    index < 3
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-neutral-400',
                  ]}
                >
                  {index + 1}
                </span>
                <span class="min-w-0 flex-1 truncate text-sm text-neutral-700 group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-neutral-100">
                  {item.title}
                </span>
                <div class="flex shrink-0 items-center gap-3 text-xs text-neutral-400">
                  <span class="flex items-center gap-1">
                    <Eye class="h-3 w-3" />
                    {formatNumber(item.reads)}
                  </span>
                  <span class="flex items-center gap-1">
                    <Heart class="h-3 w-3" />
                    {formatNumber(item.likes)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </NScrollbar>
      </ChartCard>
    )
  },
})
