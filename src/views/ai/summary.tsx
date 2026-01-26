/**
 * AI Summary Page
 * AI 摘要页面 - Master-Detail 布局
 */
import { defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ArticleInfo } from '~/api/ai'

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
    const { data, refetch, isPending } = useQuery({
      queryKey: queryKeys.ai.summariesGrouped({ page: pageRef.value }),
      queryFn: () => aiApi.getSummariesGrouped({ page: pageRef.value }),
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
      pageRef.value = page
      refetch()
    }

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
              data={data.value?.data ?? []}
              loading={isPending.value}
              selectedId={selectedId.value}
              pager={data.value?.pagination ?? null}
              onSelect={handleSelect}
              onPageChange={handlePageChange}
            />
          ),
          detail: () =>
            selectedId.value ? (
              <SummaryDetailPanel
                articleId={selectedId.value}
                isMobile={isMobile.value}
                onBack={handleBack}
                onRefresh={refetch}
              />
            ) : null,
          empty: () => <SummaryDetailEmptyState />,
        }}
      </MasterDetailLayout>
    )
  },
})
