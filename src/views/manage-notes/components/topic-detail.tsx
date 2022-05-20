import { SearchIcon } from 'components/icons'
import type { TopicModel } from 'models/topic'
import { NAvatar, NButton, NCard, NModal, NSkeleton, NThing } from 'naive-ui'
import { RESTManager } from 'utils'
import { textToBigCharOrWord } from 'utils/word'

import type { NoteModel, Pager, PaginateResult } from '@mx-space/api-client'
import { Icon } from '@vicons/utils'

export const TopicDetail = defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const show = ref(false)

    const topic = ref<null | TopicModel>(null)
    const notes = ref<Pick<NoteModel, 'id' | 'title' | 'nid' | 'created'>[]>([])
    const notePagination = ref<Pager>()

    const loadingNotes = ref(true)

    const handleFetchDetail = async () => {
      show.value = true
      const topicData = await RESTManager.api.topics(props.id).get<TopicModel>()
      topic.value = topicData

      const { data: notesData, pagination } =
        await fetchTopicNotesWithPagination(topicData.id!)

      console.log(notesData)

      notes.value = notesData as any
      notePagination.value = pagination
    }

    const fetchTopicNotesWithPagination = async (
      topicId: string,
      page = 1,
      size = 10,
    ) => {
      loadingNotes.value = true
      const { data, pagination } = await RESTManager.api.notes
        .topics(topicId)
        .get<PaginateResult<Partial<NoteModel>>>({
          params: { page, size },
        })
      loadingNotes.value = false
      return { data, pagination }
    }

    return () => (
      <>
        <NButton ghost size="small" onClick={handleFetchDetail}>
          <Icon class={'mr-1'}>
            <SearchIcon />
          </Icon>
          详情
        </NButton>

        <NModal
          show={show.value}
          closable
          closeOnEsc
          onUpdateShow={(s) => {
            show.value = s
          }}
        >
          {topic.value ? (
            <NCard
              closable
              role="dialog"
              class={'modal-card md'}
              title={`专栏 - ${topic.value.name}`}
            >
              <NThing>
                {{
                  avatar() {
                    return (
                      <NAvatar size={60} round>
                        {topic.value?.icon ||
                          textToBigCharOrWord(topic.value?.name)}
                      </NAvatar>
                    )
                  },

                  header() {
                    return <b>{topic.value?.name}</b>
                  },

                  'header-extra': function () {
                    return <span class={'opacity-80'}>{topic.value?.slug}</span>
                  },
                  description() {
                    return (
                      <p class={'opacity-90 clamp-2 break-all'}>
                        {topic.value?.introduce}
                      </p>
                    )
                  },
                  default() {
                    return <p>{topic.value?.description}</p>
                  },
                }}
              </NThing>
              {loadingNotes.value ? (
                <NSkeleton animated class="mt-2 h-[350px]"></NSkeleton>
              ) : (
                <div>
                  {notes.value.map((note) => (
                    <p>{note.title}</p>
                  ))}
                </div>
              )}
            </NCard>
          ) : (
            <NCard class={'modal-card md'} role="dialog" title="专栏信息获取中">
              <div class={'flex relative gap-2 '}>
                <NSkeleton animated circle width={60}></NSkeleton>
                <div class={'flex-grow'}>
                  <NSkeleton
                    animated
                    text
                    repeat={3}
                    class="flex-grow"
                  ></NSkeleton>
                </div>
              </div>

              <NSkeleton animated repeat={2} class="mt-2" text></NSkeleton>
            </NCard>
          )}
        </NModal>
      </>
    )
  },
})
