import { Plus as PlusIcon, Trash as TrashIcon } from 'lucide-vue-next'
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
import { useRoute, useRouter } from 'vue-router'
import type { PaginateResult } from '@mx-space/api-client'
import type { TopicModel } from '~/models/topic'

import { Icon } from '@vicons/utils'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { useDataTableFetch } from '~/hooks/use-table'
import { useLayout } from '~/layouts/content'
import { RESTManager } from '~/utils'
import { textToBigCharOrWord } from '~/utils/word'

import { TopicDetail } from './components/topic-detail'
import { TopicEditModal } from './components/topic-modal'

export default defineComponent({
  setup() {
    const router = useRouter()
    const route = useRoute()

    const {
      fetchDataFn: fetchTopic,
      data: topics,
      pager: pagination,
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

    const handleSubmit = (topic: TopicModel) => {
      handleCloseModal()

      const index = topics.value.findIndex((item) => item.id === topic.id)
      if (-~index) {
        topics.value[index] = topic
      } else {
        topics.value.push(topic)
      }
    }

    const { setActions } = useLayout()

    setActions(
      <HeaderActionButton
        icon={<PlusIcon />}
        onClick={handleAddTopic}
        variant="success"
      />,
    )

    return () => (
      <>
        <NList bordered class="mb-4">
          {topics.value.map((topic) => (
            <NListItem key={topic.id}>
              {{
                prefix: () => (
                  <NAvatar
                    data-src={topic.icon}
                    class={`mt-2 ${topic.icon && '!bg-transparent'}`}
                    circle
                    size={50}
                    src={topic.icon || undefined}
                  >
                    {topic.icon ? undefined : textToBigCharOrWord(topic.name)}
                  </NAvatar>
                ),
                suffix: () => (
                  <NButtonGroup>
                    <NButton round onClick={() => handleEdit(topic.id!)}>
                      编辑
                    </NButton>
                    <NPopconfirm
                      onPositiveClick={() => handleDelete(topic.id!)}
                    >
                      {{
                        default: () => `确定删除「${topic.name}」？`,
                        trigger: () => (
                          <NButton circle tertiary type="error">
                            <Icon>
                              <TrashIcon />
                            </Icon>
                          </NButton>
                        ),
                      }}
                    </NPopconfirm>
                  </NButtonGroup>
                ),
                default: () => (
                  <NThing
                    title={topic.name}
                    description={topic.introduce}
                    titleExtra={topic.slug}
                  >
                    {{
                      default: () => topic.description,
                      footer: () => <TopicDetail id={topic.id!} />,
                    }}
                  </NThing>
                ),
              }}
            </NListItem>
          ))}
        </NList>

        {pagination.value && (
          <div class="flex justify-end">
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
