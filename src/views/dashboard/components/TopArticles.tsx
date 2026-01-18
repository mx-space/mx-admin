import { BarChart3 as BarChartIcon } from 'lucide-vue-next'
import { NDataTable, NText } from 'naive-ui'
import { defineComponent, h, onMounted, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'

import { aggregateApi } from '~/api/aggregate'

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
        const result =
          await aggregateApi.getTopArticles()
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

    const columns: DataTableColumns<ArticleData> = [
      {
        title: '#',
        key: 'index',
        width: 40,
        render: (_, index) =>
          h(NText, { depth: 3 }, { default: () => (index + 1).toString() }),
      },
      {
        title: '标题',
        key: 'title',
        ellipsis: {
          tooltip: true,
        },
        render: (row) =>
          h(
            'a',
            {
              class: 'hover:underline cursor-pointer text-inherit',
              href: row.category
                ? `/posts/${row.category.slug}/${row.slug}`
                : '#',
              target: '_blank',
            },
            row.title,
          ),
      },
      {
        title: '阅读',
        key: 'reads',
        width: 70,
        render: (row) => Intl.NumberFormat('en-us').format(row.reads),
      },
      {
        title: '点赞',
        key: 'likes',
        width: 60,
        render: (row) => row.likes.toString(),
      },
    ]

    return () => (
      <ChartCard
        title="热门文章 Top 10"
        icon={<BarChartIcon />}
        loading={loading.value}
        height={300}
      >
        <NDataTable
          columns={columns}
          data={data.value}
          size="small"
          bordered={false}
          singleLine={false}
          maxHeight={280}
        />
      </ChartCard>
    )
  },
})
