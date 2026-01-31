/**
 * AI Summary Page
 * AI 摘要页面 - Master-Detail 布局
 */
import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  ArticleInfo,
  GroupedSummaryData,
  GroupedSummaryResponse,
} from '~/api/ai'

import { useQuery } from '@tanstack/vue-query'

import { aiApi } from '~/api/ai'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { queryKeys } from '~/hooks/queries/keys'
import { RouteName } from '~/router/name'

import {
  SummaryDetailEmptyState,
  SummaryDetailPanel,
} from './components/summary-detail-panel'
import { SummaryList } from './components/summary-list'

export default defineComponent({
  name: 'AISummaryPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { isMobile } = useMasterDetailLayout()

    const pageRef = ref(1)
    const searchRef = ref('')
    const listData = ref<GroupedSummaryData[]>([])
    const pagerRef = ref<GroupedSummaryResponse['pagination'] | null>(null)
    const { data, refetch, isPending } = useQuery({
      queryKey: computed(() =>
        queryKeys.ai.summariesGrouped({
          page: pageRef.value,
          search: searchRef.value,
        }),
      ),
      queryFn: () =>
        aiApi.getSummariesGrouped({
          page: pageRef.value,
          search: searchRef.value || undefined,
        }),
    })

    const selectedId = ref<string | null>((route.query.id as string) || null)
    const showDetailOnMobile = ref(false)

    const handleSelect = (article: ArticleInfo) => {
      selectedId.value = article.id
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleBack = () => {
      showDetailOnMobile.value = false
    }

    const handlePageChange = (page: number) => {
      if (pageRef.value === page) return
      pageRef.value = page
      refetch()
    }

    const handleSearchChange = (search: string) => {
      if (searchRef.value === search) return
      searchRef.value = search
      pageRef.value = 1
      listData.value = []
      refetch()
    }

    const refreshList = () => {
      pageRef.value = 1
      // 不清空列表，等待新数据到达后由 watch 更新
      refetch()
    }

    watch(
      () => data.value,
      (value) => {
        if (!value) return
        pagerRef.value = value.pagination ?? null
        // 只有当 API 返回了数据时才更新列表，避免重新获取期间清空列表
        if (value.data !== undefined) {
          if (pageRef.value === 1) {
            listData.value = value.data
          } else {
            listData.value = [...listData.value, ...value.data]
          }
        }
      },
      { immediate: true },
    )

    watch(
      selectedId,
      (id) => {
        router.replace({
          name: RouteName.AiSummary,
          query: {
            ...(id ? { id } : {}),
          },
        })
      },
      { flush: 'post' },
    )

    return () => (
      <MasterDetailLayout
        showDetailOnMobile={showDetailOnMobile.value}
        defaultSize={0.28}
        min={0.2}
        max={0.4}
      >
        {{
          list: () => (
            <SummaryList
              data={listData.value}
              loading={isPending.value}
              selectedId={selectedId.value}
              pager={pagerRef.value}
              search={searchRef.value}
              onSelect={handleSelect}
              onPageChange={handlePageChange}
              onSearchChange={handleSearchChange}
            />
          ),
          detail: () =>
            selectedId.value ? (
              <SummaryDetailPanel
                articleId={selectedId.value}
                isMobile={isMobile.value}
                onBack={handleBack}
                onRefresh={refreshList}
              />
            ) : null,
          empty: () => <SummaryDetailEmptyState />,
        }}
      </MasterDetailLayout>
    )
  },
})
