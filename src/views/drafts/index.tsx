import { Plus as PlusIcon } from 'lucide-vue-next'
import { NDropdown, NSplit } from 'naive-ui'
import { computed, defineComponent, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { DraftModel, DraftRefType } from '~/models/draft'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { draftsApi } from '~/api/drafts'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'
import { LayoutStore } from '~/stores/layout'
import { UIStore } from '~/stores/ui'

import { DraftDetail } from './components/draft-detail'
import { DraftEmptyState } from './components/draft-empty-state'
import { DraftList } from './components/draft-list'

export default defineComponent({
  name: 'DraftsView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { setActions, setHeaderClass } = useLayout()

    const filterType = ref<DraftRefType | 'all'>(
      (route.query.type as DraftRefType) || 'all',
    )
    const selectedId = ref<string | null>((route.query.id as string) || null)
    const showDetailOnMobile = ref(false)
    const selectedDraftSnapshot = ref<DraftModel | null>(null)

    // 查询草稿列表
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

    // 删除草稿
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

    // 新建下拉菜单
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

    // 同步 URL
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

    // 设置 Header 操作按钮
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

    const ui = useStoreRef(UIStore)
    const layout = useStoreRef(LayoutStore)

    const isMobile = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )

    watchEffect(() => {
      layout.contentPadding.value = false
      layout.contentMinFullHeight.value = true
      setHeaderClass(
        'md:px-4 border-b border-neutral-100 dark:border-neutral-900',
      )
    })

    const DesktopLayout = () => (
      <div class="absolute inset-0 overflow-hidden">
        <NSplit
          direction="horizontal"
          defaultSize={0.3}
          min={0.2}
          max={0.4}
          class="h-full"
        >
          {{
            1: () => (
              <div class="h-full overflow-hidden border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <DraftList
                  data={allDrafts.value}
                  loading={isLoading.value}
                  selectedId={selectedId.value}
                  filterValue={filterType.value}
                  onSelect={handleSelect}
                  onFilterChange={handleFilterChange}
                />
              </div>
            ),
            2: () => (
              <div class="h-full min-w-0 flex-1 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                {selectedDraft.value ? (
                  <DraftDetail
                    draft={selectedDraft.value}
                    onDelete={handleDelete}
                  />
                ) : (
                  <DraftEmptyState />
                )}
              </div>
            ),
            'resize-trigger': () => (
              <div class="group relative h-full w-0 cursor-col-resize">
                <div class="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300 transition-colors group-hover:bg-neutral-400 dark:bg-neutral-700 dark:group-hover:bg-neutral-600" />
              </div>
            ),
          }}
        </NSplit>
      </div>
    )

    const MobileLayout = () => (
      <div class="absolute inset-0 w-full overflow-x-hidden">
        <div
          class={[
            'absolute inset-0 w-full',
            showDetailOnMobile.value && '-translate-x-full',
          ]}
        >
          <div class="h-full bg-white dark:bg-neutral-900">
            <DraftList
              data={allDrafts.value}
              loading={isLoading.value}
              selectedId={selectedId.value}
              filterValue={filterType.value}
              onSelect={handleSelect}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        <div
          class={[
            'absolute inset-0 w-full',
            !showDetailOnMobile.value && 'hidden',
          ]}
        >
          <div class="h-full bg-white dark:bg-neutral-900">
            {selectedDraft.value && (
              <DraftDetail
                draft={selectedDraft.value}
                isMobile={true}
                onBack={handleBack}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </div>
    )

    return () => (isMobile.value ? <MobileLayout /> : <DesktopLayout />)
  },
})
