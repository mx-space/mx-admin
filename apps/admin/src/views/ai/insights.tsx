import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  ArticleInfo,
  GroupedInsightsData,
  GroupedInsightsResponse,
} from '~/api/ai'

import { useQuery } from '@tanstack/vue-query'

import { aiApi } from '~/api/ai'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { queryKeys } from '~/hooks/queries/keys'
import { RouteName } from '~/router/name'

import {
  InsightsDetailEmptyState,
  InsightsDetailPanel,
} from './components/insights-detail-panel'
import { InsightsList } from './components/insights-list'

export default defineComponent({
  name: 'AIInsightsPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { isMobile } = useMasterDetailLayout()

    const pageRef = ref(1)
    const searchRef = ref('')
    const listData = ref<GroupedInsightsData[]>([])
    const pagerRef = ref<GroupedInsightsResponse['pagination'] | null>(null)
    const { data, refetch, isPending } = useQuery({
      queryKey: computed(() =>
        queryKeys.ai.insightsGrouped({
          page: pageRef.value,
          search: searchRef.value,
        }),
      ),
      queryFn: () =>
        aiApi.getInsightsGrouped({
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
      refetch()
    }

    watch(
      () => data.value,
      (value) => {
        if (!value) return
        pagerRef.value = value.pagination ?? null
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
          name: RouteName.AiInsights,
          query: (id ? { id } : {}),
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
            <InsightsList
              data={listData.value}
              loading={isPending.value}
              selectedId={selectedId.value}
              pager={pagerRef.value}
              search={searchRef.value}
              onSelect={handleSelect}
              onPageChange={handlePageChange}
              onRefresh={refreshList}
              onSearchChange={handleSearchChange}
            />
          ),
          detail: () =>
            selectedId.value ? (
              <InsightsDetailPanel
                articleId={selectedId.value}
                isMobile={isMobile.value}
                onBack={handleBack}
                onRefresh={refreshList}
              />
            ) : null,
          empty: () => <InsightsDetailEmptyState />,
        }}
      </MasterDetailLayout>
    )
  },
})
