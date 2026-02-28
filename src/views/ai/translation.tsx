import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  AITranslation,
  ArticleInfo,
  GroupedTranslationData,
  GroupedTranslationResponse,
} from '~/api/ai'

import { useQuery } from '@tanstack/vue-query'

import { aiApi } from '~/api/ai'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { queryKeys } from '~/hooks/queries/keys'
import { RouteName } from '~/router/name'

import {
  TranslationDetailEmptyState,
  TranslationDetailPanel,
} from './components/translation-detail-panel'
import { TranslationList } from './components/translation-list'

export default defineComponent({
  name: 'AITranslationPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { isMobile } = useMasterDetailLayout()

    const pageRef = ref(1)
    const searchRef = ref('')
    const listData = ref<GroupedTranslationData[]>([])
    const pagerRef = ref<GroupedTranslationResponse['pagination'] | null>(null)
    const { data, refetch, isPending } = useQuery({
      queryKey: computed(() =>
        queryKeys.ai.translationsGrouped({
          page: pageRef.value,
          search: searchRef.value,
        }),
      ),
      queryFn: () =>
        aiApi.getTranslationsGrouped({
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

    type TranslationListOptimisticUpdate =
      | {
          type: 'upsert'
          article: ArticleInfo
          translations: AITranslation[]
        }
      | {
          type: 'remove'
          articleId: string
          translationId: string
          lang: string
        }

    const applyOptimisticUpdate = (update: TranslationListOptimisticUpdate) => {
      if (update.type === 'upsert') {
        const idx = listData.value.findIndex(
          (g) => g.article.id === update.article.id,
        )
        if (idx === -1) {
          if (pageRef.value === 1) {
            if (
              searchRef.value.trim().length === 0 ||
              update.article.title
                .toLowerCase()
                .includes(searchRef.value.trim().toLowerCase())
            ) {
              listData.value = [
                {
                  article: update.article,
                  translations: [...update.translations],
                },
                ...listData.value,
              ]
            }
          }
          return
        }

        const group = listData.value[idx]
        const nextTranslations = [...group.translations]
        for (const t of update.translations) {
          const idxByLang = nextTranslations.findIndex((x) => x.lang === t.lang)
          if (idxByLang !== -1) nextTranslations[idxByLang] = t
          else nextTranslations.push(t)
        }

        listData.value[idx] = {
          ...group,
          translations: nextTranslations,
        }
        return
      }

      const idx = listData.value.findIndex(
        (g) => g.article.id === update.articleId,
      )
      if (idx === -1) return
      const group = listData.value[idx]
      const nextTranslations = group.translations.filter(
        (t) => t.id !== update.translationId && t.lang !== update.lang,
      )
      if (nextTranslations.length === 0) {
        listData.value = listData.value.filter((_, i) => i !== idx)
      } else {
        listData.value[idx] = { ...group, translations: nextTranslations }
      }
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
          name: RouteName.AiTranslation,
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
        defaultSize="350px"
        min="300px"
        max="400px"
      >
        {{
          list: () => (
            <TranslationList
              data={listData.value}
              loading={isPending.value}
              selectedId={selectedId.value}
              pager={pagerRef.value}
              search={searchRef.value}
              onSelect={handleSelect}
              onPageChange={handlePageChange}
              onSearchChange={handleSearchChange}
              onRefresh={refreshList}
            />
          ),
          detail: () =>
            selectedId.value ? (
              <TranslationDetailPanel
                articleId={selectedId.value}
                isMobile={isMobile.value}
                onBack={handleBack}
                onRefresh={refreshList}
                onOptimisticUpdate={applyOptimisticUpdate}
              />
            ) : null,
          empty: () => <TranslationDetailEmptyState />,
        }}
      </MasterDetailLayout>
    )
  },
})
