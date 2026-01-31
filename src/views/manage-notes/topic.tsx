/**
 * Topic List Page
 * 专栏列表页面 - Master-Detail 布局
 */
import { Plus as PlusIcon } from 'lucide-vue-next'
import { defineComponent, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TopicModel } from '~/models/topic'

import { useQueryClient } from '@tanstack/vue-query'

import { topicsApi } from '~/api/topics'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { queryKeys } from '~/hooks/queries/keys'
import { useDeleteTopicMutation } from '~/hooks/queries/use-topics'
import { useDataTable } from '~/hooks/use-data-table'
import { useLayout } from '~/layouts/content'
import { RouteName } from '~/router/name'

import {
  TopicDetailEmptyState,
  TopicDetailPanel,
} from './components/topic-detail-panel'
import { TopicList } from './components/topic-list'
import { TopicEditModal } from './components/topic-modal'

export default defineComponent({
  name: 'TopicListPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const queryClient = useQueryClient()
    const { setActions } = useLayout()
    const { isMobile } = useMasterDetailLayout()

    const {
      data: topics,
      pager: pagination,
      isLoading: loading,
      refresh,
      setPage,
    } = useDataTable<TopicModel>({
      queryKey: (_params) => queryKeys.topics.list(),
      queryFn: (params) =>
        topicsApi.getList({ page: params.page, size: params.size }),
      pageSize: 20,
    })

    const selectedId = ref<string | null>((route.query.id as string) || null)
    const showDetailOnMobile = ref(false)

    const editTopicId = ref('')
    const showTopicModal = ref(false)

    const handleAddTopic = () => {
      showTopicModal.value = true
      editTopicId.value = ''
    }

    const handleCloseModal = () => {
      showTopicModal.value = false
      editTopicId.value = ''
    }

    const deleteMutation = useDeleteTopicMutation()
    const handleDelete = (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          if (selectedId.value === id) {
            selectedId.value = null
            showDetailOnMobile.value = false
          }
          refresh()
        },
      })
    }

    const handleEdit = (id: string) => {
      editTopicId.value = id
      showTopicModal.value = true
    }

    const handleSelect = (topic: TopicModel) => {
      selectedId.value = topic.id!
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleBack = () => {
      showDetailOnMobile.value = false
    }

    const handleSubmit = (_topic: TopicModel) => {
      handleCloseModal()
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    }

    watch(
      selectedId,
      (id) => {
        router.replace({
          name: RouteName.Topic,
          query: {
            ...(id ? { id } : {}),
          },
        })
      },
      { flush: 'post' },
    )

    watchEffect(() => {
      setActions(
        <HeaderActionButton
          icon={<PlusIcon />}
          onClick={handleAddTopic}
          variant="success"
          name="新建专栏"
        />,
      )
    })

    return () => (
      <>
        <MasterDetailLayout
          showDetailOnMobile={showDetailOnMobile.value}
          defaultSize={0.3}
          min={0.2}
          max={0.4}
        >
          {{
            list: () => (
              <TopicList
                data={topics.value}
                loading={loading.value}
                selectedId={selectedId.value}
                pager={pagination.value}
                onSelect={handleSelect}
                onPageChange={setPage}
              />
            ),
            detail: () =>
              selectedId.value ? (
                <TopicDetailPanel
                  topicId={selectedId.value}
                  isMobile={isMobile.value}
                  onBack={handleBack}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ) : null,
            empty: () => <TopicDetailEmptyState />,
          }}
        </MasterDetailLayout>

        <TopicEditModal
          onClose={handleCloseModal}
          show={Boolean(showTopicModal.value || editTopicId.value)}
          id={editTopicId.value}
          onSubmit={handleSubmit}
        />
      </>
    )
  },
})
