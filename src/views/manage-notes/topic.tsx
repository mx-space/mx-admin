import { HeaderActionButton } from 'components/button/rounded-button'
import { PlusIcon } from 'components/icons'
import { useDataTableFetch } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import type { TopicModel } from 'models/topic'
import { NList, NListItem, NPagination } from 'naive-ui'
import { RESTManager } from 'utils'

import type { PaginateResult } from '@mx-space/api-client'

import { TopicEditModal } from './components/topic-modal'

export default defineComponent({
  setup() {
    const {
      fetchDataFn: fetchTopic,
      data: topics,
      pager: pagination,
    } = useDataTableFetch<TopicModel>(
      (topics, pagination) =>
        async (page = 1, size = 20) => {
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

    onMounted(() => fetchTopic())

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
    return {
      pagination,
      topics,
      fetchTopic,
      handleAddTopic,
      editTopicId,
      showTopicModal,
      handleCloseModal,
      handleSubmit(topic: TopicModel) {
        handleCloseModal()

        const index = topics.value.findIndex((item) => item.id === topic.id)
        if (-~index) {
          topics.value[index] = topic
        } else {
          topics.value.push(topic)
        }
      },
    }
  },
  render() {
    const {
      pagination,
      topics,
      fetchTopic,
      editTopicId,
      showTopicModal,
      handleAddTopic,
      handleCloseModal,
      handleSubmit,
    } = this

    return (
      <ContentLayout>
        {{
          actions() {
            return (
              <>
                <HeaderActionButton
                  icon={<PlusIcon />}
                  onClick={handleAddTopic}
                  variant="success"
                ></HeaderActionButton>
              </>
            )
          },
          default() {
            return (
              <>
                <NList>
                  {topics.map((topic) => (
                    <NListItem key={topic.id}>
                      {{
                        default() {
                          return topic.name
                        },
                      }}
                    </NListItem>
                  ))}
                </NList>
                {pagination && (
                  <div class={'flex justify-end'}>
                    <NPagination
                      page={pagination.currentPage}
                      onUpdatePage={(page) => fetchTopic(page)}
                      pageCount={pagination.totalPage}
                      pageSize={pagination.size}
                      showQuickJumper
                    ></NPagination>
                  </div>
                )}

                <TopicEditModal
                  onClose={handleCloseModal}
                  show={Boolean(showTopicModal || editTopicId)}
                  id={editTopicId}
                  onSubmit={handleSubmit}
                />
              </>
            )
          },
        }}
      </ContentLayout>
    )
  },
})
