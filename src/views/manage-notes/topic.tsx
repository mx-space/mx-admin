import { HeaderActionButton } from 'components/button/rounded-button'
import { PlusIcon, TrashIcon } from 'components/icons'
import { useDataTableFetch } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import type { TopicModel } from 'models/topic'
import {
  NAvatar,
  NButton,
  NButtonGroup,
  NList,
  NListItem,
  NPagination,
  NPopconfirm,
  NThing,
} from 'naive-ui'
import { RESTManager } from 'utils'
import { useRoute, useRouter } from 'vue-router'

import type { PaginateResult } from '@mx-space/api-client'
import { Icon } from '@vicons/utils'

import { TopicEditModal } from './components/topic-modal'

export default defineComponent({
  setup() {
    const router = useRouter()
    const route = useRoute()

    watch(
      () => route.query.page,
      (page) => {
        if (!page) {
          fetchTopic(0)
        } else {
          fetchTopic(+page)
        }
      },
    )

    const {
      fetchDataFn: fetchTopic,
      data: topics,
      pager: pagination,
    } = useDataTableFetch<TopicModel>(
      (topics, pagination) =>
        async (page = parseInt(route.query.page as any) || 1, size = 20) => {
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

    const handleDelete = async (id: string) => {
      await RESTManager.api.topics(id).delete()
      fetchTopic()
    }
    const handleEdit = (id: string) => {
      editTopicId.value = id
      showTopicModal.value = true
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
      handleDelete,
      handleEdit,
      route,
      router,
    }
  },
  render() {
    const {
      pagination,
      topics,
      router,
      route,
      editTopicId,
      showTopicModal,
      handleAddTopic,
      handleCloseModal,
      handleSubmit,
      handleEdit,
      handleDelete,
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
                <NList bordered class={'mb-4'}>
                  {topics.map((topic) => (
                    <NListItem key={topic.id}>
                      {{
                        prefix() {
                          return (
                            <NAvatar class={'mt-2'} circle>
                              {topic.icon || topic.name}
                            </NAvatar>
                          )
                        },
                        suffix() {
                          return (
                            <NButtonGroup>
                              <NButton
                                round
                                onClick={() => handleEdit(topic.id!)}
                              >
                                编辑
                              </NButton>
                              <NPopconfirm
                                onPositiveClick={() => handleDelete(topic.id!)}
                              >
                                {{
                                  default() {
                                    return `确定删除「${topic.name}」？`
                                  },
                                  trigger() {
                                    return (
                                      <NButton round type="error">
                                        <Icon>
                                          <TrashIcon />
                                        </Icon>
                                      </NButton>
                                    )
                                  },
                                }}
                              </NPopconfirm>
                            </NButtonGroup>
                          )
                        },
                        default() {
                          return (
                            <NThing
                              title={topic.name}
                              description={topic.introduce}
                            >
                              {{
                                default() {
                                  return topic.description
                                },
                              }}
                            </NThing>
                          )
                        },
                      }}
                    </NListItem>
                  ))}
                </NList>
                {pagination && (
                  <div class={'flex justify-end'}>
                    <NPagination
                      page={pagination.currentPage}
                      onUpdatePage={(page) => {
                        router.replace({
                          query: { ...route.query, page },
                          params: { ...route.params },
                        })
                      }}
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
