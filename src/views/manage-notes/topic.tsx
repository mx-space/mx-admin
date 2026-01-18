/**
 * Topic List Page
 * 专栏列表页面 - 列表布局
 */
import { Plus as PlusIcon } from 'lucide-vue-next'
import { NPagination } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import type { PaginateResult } from '@mx-space/api-client'
import type { TopicModel } from '~/models/topic'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { useDataTableFetch } from '~/hooks/use-table'
import { useLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'

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

    const {
      fetchDataFn: fetchTopic,
      data: topics,
      pager: pagination,
      loading,
    } = useDataTableFetch<TopicModel>(
      (topics, pagination) =>
        async (
          page = Number.parseInt(route.query.page as any) || 1,
          size = 20,
        ) => {
          const res = await RESTManager.api.topics.get<
            PaginateResult<TopicModel>
          >({
            page,
            size,
          })

          pagination.value = res.pagination
          topics.value = res.data

          return res
        },
    )

    // 监听路由变化
    watch(
      () => route.query.page,
      (page) => {
        if (!page) {
          fetchTopic(1)
        } else {
          fetchTopic(+page)
        }
      },
    )

    onMounted(() => fetchTopic())

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

    const handleDelete = async (id: string) => {
      await RESTManager.api.topics(id).delete()
      message.success('删除成功')
      fetchTopic()
    }

    const handleEdit = (id: string) => {
      editTopicId.value = id
      showTopicModal.value = true
    }

    const handleViewDetail = (id: string) => {
      detailTopicId.value = id
      showDetailDrawer.value = true
    }

    const handleSubmit = (topic: TopicModel) => {
      handleCloseModal()

      const index = topics.value.findIndex((item) => item.id === topic.id)
      if (index !== -1) {
        topics.value[index] = topic
      } else {
        topics.value.unshift(topic)
      }
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
