import { HeaderActionButton } from 'components/button/rounded-button'
import { PlusIcon } from 'components/icons'
import { useDataTableFetch } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { TopicModel } from 'models/topic'
import { NList, NListItem, NModal, NPagination } from 'naive-ui'
import { RESTManager } from 'utils'

import { PaginateResult } from '@mx-space/api-client'

import { TopicAddIcon } from './components/topic-add'

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

    return {
      pagination,
      topics,
      fetchTopic,
    }
  },
  render() {
    const { pagination, topics, fetchTopic } = this
    return (
      <ContentLayout>
        {{
          actions() {
            return (
              <>
                <TopicAddIcon />
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
              </>
            )
          },
        }}
      </ContentLayout>
    )
  },
})
