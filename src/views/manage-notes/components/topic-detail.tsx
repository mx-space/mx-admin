import { PlusIcon, SearchIcon } from 'components/icons'
import type { TopicModel } from 'models/topic'
import {
  NAvatar,
  NButton,
  NCard,
  NEmpty,
  NModal,
  NSelect,
  NSkeleton,
  NThing,
} from 'naive-ui'
import { RESTManager } from 'utils'
import { textToBigCharOrWord } from 'utils/word'
import type { PropType } from 'vue'

import type { NoteModel, Pager, PaginateResult } from '@mx-space/api-client'
import { Icon as NIcon } from '@vicons/utils'
import { createGlobalState } from '@vueuse/core'

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
          <NIcon class={'mr-1'}>
            <SearchIcon />
          </NIcon>
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
                <div class={'mt-4'}>
                  <p class="flex justify-between items-center">
                    <strong>包含的文章：</strong>
                    <AddNoteToThisTopicButton
                      topicId={topic.value.id!}
                      onSuccess={() => {
                        nextTick(() => handleFetchDetail())
                      }}
                    />
                  </p>
                  {notes.value.length === 0 && (
                    <div class={'h-[300px] flex items-center justify-center'}>
                      <NEmpty description="这里还没有任何内容"></NEmpty>
                    </div>
                  )}
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

const useMemoNoteList = createGlobalState(() => {
  const notes = ref([] as { id: string; title: string; nid: number }[])
  let currentPage = 0
  let isEnd = false

  const loading = ref(true)
  const fetchNotes = async (page = 1) => {
    loading.value = true
    const { data, pagination } = await RESTManager.api.notes.get<
      PaginateResult<NoteModel>
    >({
      params: {
        page,
        size: 20,
        select: 'nid title _id id',
      },
    })

    notes.value.push(...data)
    loading.value = false

    currentPage = pagination.currentPage
    if (!pagination.hasNextPage) {
      isEnd = true
    }
  }

  return {
    loading,
    notes,
    fetchNext: () => {
      if (isEnd) {
        return
      }
      fetchNotes(currentPage + 1)
    },
    refresh: () => {
      currentPage = 1
      isEnd = false
      notes.value = []
      fetchNotes(currentPage)
    },
  }
})

const AddNoteToThisTopicButton = defineComponent({
  props: {
    topicId: {
      type: String,
      required: true,
    },
    onSuccess: {
      type: Function as PropType<(noteIds: string[]) => void>,
      required: false,
    },
  },
  setup(props) {
    const modalShow = ref(false)
    const handleAddNoteToThisTopic = async () => {
      const notesId = unref(selectNoteIds)

      await Promise.all(
        notesId.map((noteId) => {
          return RESTManager.api.notes(noteId).patch({
            data: {
              topicId: props.topicId,
            },
          })
        }),
      )
      message.success('添加成功')
      modalShow.value = false
      props.onSuccess?.(notesId)
    }
    const {
      refresh,
      fetchNext,
      notes,
      loading: fetchingLoading,
    } = useMemoNoteList()

    const selectNoteIds = ref<string[]>([])

    const handleFetchNext = (e: Event) => {
      const currentTarget = e.currentTarget as HTMLElement
      if (
        currentTarget.scrollTop + currentTarget.offsetHeight >=
        currentTarget.scrollHeight
      ) {
        fetchNext()
      }
    }

    onMounted(() => {
      if (notes.value.length === 0) {
        fetchNext()
      }
    })
    return () => (
      <>
        <NButton
          secondary
          type="success"
          circle
          onClick={() => {
            modalShow.value = true
          }}
        >
          <NIcon>
            <PlusIcon />
          </NIcon>
        </NButton>

        <NModal
          closable
          closeOnEsc
          show={modalShow.value}
          onUpdateShow={(s) => {
            modalShow.value = s
          }}
        >
          <NCard title="哪些文章需要添加到专栏？" class={'modal-card sm'}>
            {{
              footer() {
                return (
                  <div class={'text-right'}>
                    <NButton
                      round
                      type="success"
                      onClick={() => handleAddNoteToThisTopic()}
                    >
                      添加！
                    </NButton>
                  </div>
                )
              },
              default() {
                return (
                  <NSelect
                    maxTagCount={3}
                    remote
                    filterable
                    clearable
                    loading={fetchingLoading.value}
                    multiple
                    onClear={() => {
                      refresh()
                    }}
                    value={selectNoteIds.value}
                    onUpdateValue={(values) => {
                      selectNoteIds.value = values
                    }}
                    resetMenuOnOptionsChange={false}
                    options={notes.value.map((note) => ({
                      label: note.title,
                      value: note.id,
                      key: note.id,
                    }))}
                    onScroll={handleFetchNext}
                  ></NSelect>
                )
              },
            }}
          </NCard>
        </NModal>
      </>
    )
  },
})
