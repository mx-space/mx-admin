/**
 * Topic List Page
 * 专栏列表页面 - 列表布局
 */
import { Plus as PlusIcon } from 'lucide-vue-next'
import { NPagination } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TopicModel } from '~/models/topic'

import { useQueryClient } from '@tanstack/vue-query'

import { topicsApi } from '~/api/topics'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { queryKeys } from '~/hooks/queries/keys'
import { useDeleteTopicMutation } from '~/hooks/queries/use-topics'
import { useDataTable } from '~/hooks/use-data-table'
import { useLayout } from '~/layouts/content'

import {
  TopicEmptyState,
  TopicListItem,
  TopicListSkeleton,
} from './components/topic-card'
import { TopicDetailDrawer } from './components/topic-detail'
import { TopicEditModal } from './components/topic-modal'

export default defineComponent({
  name: 'TopicListPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const queryClient = useQueryClient()

    const {
      data: topics,
      pager: pagination,
      isLoading: loading,
      refresh,
    } = useDataTable<TopicModel>({
      queryKey: (_params) => queryKeys.topics.list(),
      queryFn: (params) =>
        topicsApi.getList({ page: params.page, size: params.size }),
      pageSize: 20,
    })

    // 编辑状态
    const editTopicId = ref('')
    const showTopicModal = ref(false)

    // 详情状态
    const detailTopicId = ref('')
    const showDetailDrawer = ref(false)

    const handleAddTopic = () => {
      showTopicModal.value = true
      editTopicId.value = ''
    }

    const handleCloseModal = () => {
      showTopicModal.value = false
      editTopicId.value = ''
    }

    // 删除专栏
    const deleteMutation = useDeleteTopicMutation()
    const handleDelete = (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refresh()
        },
      })
    }

    const handleEdit = (id: string) => {
      editTopicId.value = id
      showTopicModal.value = true
    }

    const handleViewDetail = (id: string) => {
      detailTopicId.value = id
      showDetailDrawer.value = true
    }

    const handleSubmit = (_topic: TopicModel) => {
      handleCloseModal()
      queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    }

    const { setActions } = useLayout()

    setActions(
      <HeaderActionButton
        icon={<PlusIcon />}
        onClick={handleAddTopic}
        variant="success"
        name="新建专栏"
      />,
    )

    return () => (
      <div class="space-y-4">
        {/* 内容区域 */}
        {loading.value && topics.value.length === 0 ? (
          // 加载骨架屏
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <TopicListSkeleton />
          </div>
        ) : topics.value.length === 0 ? (
          // 空状态
          <TopicEmptyState onAdd={handleAddTopic} />
        ) : (
          // 列表
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {topics.value.map((topic) => (
              <TopicListItem
                key={topic.id}
                topic={topic}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {pagination.value && pagination.value.totalPage > 1 && (
          <div class="flex justify-center">
            <NPagination
              page={pagination.value.currentPage}
              onUpdatePage={(page) => {
                router.replace({
                  query: { ...route.query, page },
                  params: { ...route.params },
                })
              }}
              pageCount={pagination.value.totalPage}
              pageSize={pagination.value.size}
              showQuickJumper
            />
          </div>
        )}

        {/* 详情 Drawer */}
        <TopicDetailDrawer
          show={showDetailDrawer.value}
          topicId={detailTopicId.value}
          onClose={() => {
            showDetailDrawer.value = false
            detailTopicId.value = ''
          }}
          onEdit={(id: string) => {
            showDetailDrawer.value = false
            handleEdit(id)
          }}
        />

        {/* 编辑 Modal */}
        <TopicEditModal
          onClose={handleCloseModal}
          show={Boolean(showTopicModal.value || editTopicId.value)}
          id={editTopicId.value}
          onSubmit={handleSubmit}
        />
      </div>
    )
  },
})
