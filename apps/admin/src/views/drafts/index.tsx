import { Plus as PlusIcon } from 'lucide-vue-next'
import { NDropdown } from 'naive-ui'
import { computed, defineComponent, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { DraftModel, DraftRefType } from '~/models/draft'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'

import { DraftDetail } from './components/draft-detail'
import { DraftEmptyState } from './components/draft-empty-state'
import { DraftList } from './components/draft-list'

export default defineComponent({
  name: 'DraftsView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { setActions } = useLayout()
    const { isMobile } = useMasterDetailLayout()

    const filterType = ref<DraftRefType | 'all'>(
      (route.query.type as DraftRefType) || 'all',
    )
    const selectedId = ref<string | null>((route.query.id as string) || null)
    const showDetailOnMobile = ref(false)
    const selectedDraftSnapshot = ref<DraftModel | null>(null)

    const { data, isLoading } = useQuery({
      queryKey: ['drafts', 'list', filterType],
      queryFn: () =>
        draftsApi.getList({
          page: 1,
          size: 50,
          refType: filterType.value === 'all' ? undefined : filterType.value,
        }),
    })

    const allDrafts = computed(() => data.value?.data || [])

    const selectedDraft = computed(() => {
      if (!selectedId.value) return null
      const fromList = allDrafts.value.find((d) => d.id === selectedId.value)
      if (fromList) return fromList
      if (
        selectedDraftSnapshot.value &&
        selectedDraftSnapshot.value.id === selectedId.value
      ) {
        return selectedDraftSnapshot.value
      }
      return null
    })

    const deleteMutation = useMutation({
      mutationFn: draftsApi.delete,
      onSuccess: () => {
        toast.success('删除成功')
        selectedId.value = null
        showDetailOnMobile.value = false
        queryClient.invalidateQueries({ queryKey: ['drafts'] })
      },
      onError: () => {
        toast.error('删除失败')
      },
    })

    const handleDelete = (id: string) => {
      deleteMutation.mutate(id)
    }

    const handleSelect = (draft: DraftModel) => {
      selectedId.value = draft.id
      selectedDraftSnapshot.value = { ...draft }
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleBack = () => {
      showDetailOnMobile.value = false
    }

    const handleFilterChange = (value: DraftRefType | 'all') => {
      selectedId.value = null
      selectedDraftSnapshot.value = null
      showDetailOnMobile.value = false
      filterType.value = value
    }

    const newOptions = [
      { label: '新建文章', key: 'post' },
      { label: '新建手记', key: 'note' },
      { label: '新建页面', key: 'page' },
    ]

    const handleNewSelect = (key: string) => {
      const routeMap: Record<string, string> = {
        post: RouteName.EditPost,
        note: RouteName.EditNote,
        page: RouteName.EditPage,
      }
      router.push({ name: routeMap[key] })
    }

    watch(
      [selectedId, filterType],
      ([id, type]) => {
        router.replace({
          name: RouteName.Draft,
          query: {
            ...(type !== 'all' ? { type } : {}),
            ...(id ? { id } : {}),
          },
        })
      },
      { flush: 'post' },
    )

    watchEffect(() => {
      setActions(
        <NDropdown
          options={newOptions}
          onSelect={handleNewSelect}
          trigger="click"
        >
          <HeaderActionButton icon={<PlusIcon />} name="新建" />
        </NDropdown>,
      )
    })

    return () => (
      <MasterDetailLayout
        showDetailOnMobile={showDetailOnMobile.value}
        defaultSize={'300px'}
        min={'200px'}
        max={'400px'}
      >
        {{
          list: () => (
            <DraftList
              data={allDrafts.value}
              loading={isLoading.value}
              selectedId={selectedId.value}
              filterValue={filterType.value}
              onSelect={handleSelect}
              onFilterChange={handleFilterChange}
            />
          ),
          detail: () =>
            selectedDraft.value ? (
              <DraftDetail
                draft={selectedDraft.value}
                isMobile={isMobile.value}
                onBack={handleBack}
                onDelete={handleDelete}
              />
            ) : null,
          empty: () => <DraftEmptyState />,
        }}
      </MasterDetailLayout>
    )
  },
})
