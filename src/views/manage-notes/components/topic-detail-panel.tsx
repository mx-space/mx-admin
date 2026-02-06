import {
  ArrowLeft as ArrowLeftIcon,
  ExternalLink,
  Hash,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-vue-next'
import {
  NButton,
  NEmpty,
  NModal,
  NPagination,
  NPopconfirm,
  NScrollbar,
  NSelect,
  NTooltip,
  NUploadDragger,
} from 'naive-ui'
import { defineComponent, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { Pager } from '@mx-space/api-client'
import type { NoteModel } from '~/models/note'
import type { TopicModel } from '~/models/topic'
import type { PropType } from 'vue'

import { useMutation } from '@tanstack/vue-query'

import { notesApi } from '~/api/notes'
import { topicsApi } from '~/api/topics'
import { RelativeTime } from '~/components/time/relative-time'
import { UploadWrapper } from '~/components/upload'
import { buildMarkdownRenderUrl } from '~/utils/endpoint'
import { textToBigCharOrWord } from '~/utils/word'

import { useMemoNoteList } from '../hooks/use-memo-note-list'

export const TopicDetailPanel = defineComponent({
  name: 'TopicDetailPanel',
  props: {
    topicId: {
      type: String as PropType<string | null>,
      required: true,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    onBack: {
      type: Function as PropType<() => void>,
    },
    onEdit: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()

    const topic = ref<TopicModel | null>(null)
    const notes = ref<Pick<NoteModel, 'id' | 'title' | 'nid' | 'created'>[]>([])
    const notePagination = ref<Pager>()
    const loadingTopic = ref(false)
    const loadingNotes = ref(false)

    const fetchTopicDetail = async (id: string) => {
      loadingTopic.value = true
      try {
        const data = await topicsApi.getById(id)
        topic.value = data
        await fetchTopicNotes(id)
      } finally {
        loadingTopic.value = false
      }
    }

    const fetchTopicNotes = async (topicId: string, page = 1, size = 10) => {
      loadingNotes.value = true
      try {
        const { data, pagination } = await notesApi.getByTopic(topicId, {
          page,
          size,
        })
        notes.value = data as any
        notePagination.value = pagination
      } finally {
        loadingNotes.value = false
      }
    }

    const removeNoteMutation = useMutation({
      mutationFn: (noteId: string) => notesApi.patch(noteId, { topicId: null }),
      onSuccess: (_, noteId) => {
        toast.success('已移除文章的专栏引用')
        const index = notes.value.findIndex((note) => note.id === noteId)
        if (index !== -1) {
          notes.value.splice(index, 1)
        }
      },
    })

    const handleRemoveNoteFromTopic = (noteId: string) => {
      removeNoteMutation.mutate(noteId)
    }

    const updateIconMutation = useMutation({
      mutationFn: ({ id, icon }: { id: string; icon: string }) =>
        topicsApi.patch(id, { icon }),
      onSuccess: (_, { icon }) => {
        if (topic.value) {
          topic.value.icon = icon
        }
      },
    })

    const handleUpdateTopicIcon = (iconUrl: string) => {
      if (!topic.value) return
      updateIconMutation.mutate({ id: topic.value.id!, icon: iconUrl })
    }

    watch(
      () => props.topicId,
      (id) => {
        if (id) {
          fetchTopicDetail(id)
        } else {
          topic.value = null
          notes.value = []
        }
      },
      { immediate: true },
    )

    const showAddNoteModal = ref(false)

    const ActionButton = (p: {
      icon: any
      onClick: () => void
      label: string
      class?: string
    }) => (
      <NTooltip>
        {{
          trigger: () => (
            <button
              onClick={p.onClick}
              class={`flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 ${p.class || ''}`}
            >
              <p.icon class="h-4 w-4" />
            </button>
          ),
          default: () => p.label,
        }}
      </NTooltip>
    )

    return () => (
      <div class="flex h-full flex-col">
        <div class="flex h-12 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {props.isMobile && props.onBack && (
              <button
                onClick={props.onBack}
                class="-ml-2 flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeftIcon class="h-5 w-5" />
              </button>
            )}
            <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              专栏详情
            </h2>
          </div>

          {topic.value && (
            <div class="flex items-center gap-1">
              <ActionButton
                icon={Pencil}
                label="编辑"
                onClick={() => props.onEdit(topic.value!.id!)}
              />
              <NPopconfirm
                positiveText="确认删除"
                negativeText="取消"
                onPositiveClick={() => props.onDelete(topic.value!.id!)}
              >
                {{
                  trigger: () => (
                    <div class="inline-block">
                      <ActionButton
                        icon={Trash2}
                        label="删除"
                        onClick={() => {}}
                        class="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500"
                      />
                    </div>
                  ),
                  default: () => `确定要删除「${topic.value?.name}」吗？`,
                }}
              </NPopconfirm>
            </div>
          )}
        </div>

        <NScrollbar class="min-h-0 flex-1">
          {loadingTopic.value ? (
            <TopicDetailSkeleton />
          ) : topic.value ? (
            <div class="mx-auto max-w-3xl space-y-6 p-6">
              <div class="space-y-4">
                <div class="flex items-center gap-4">
                  <div class="shrink-0">
                    <UploadWrapper
                      class="!w-auto"
                      type="icon"
                      onFinish={(e) => {
                        const res = JSON.parse(
                          (e.event?.target as XMLHttpRequest).responseText,
                        )
                        handleUpdateTopicIcon(res.url)
                        return e.file
                      }}
                      onError={(e) => {
                        try {
                          const res = JSON.parse(
                            (e.event?.target as XMLHttpRequest).responseText,
                          )
                          toast.warning(res.message)
                        } catch {
                          // noop
                        }
                        return e.file
                      }}
                    >
                      <NUploadDragger class="!w-auto !border-0 !bg-transparent !p-0">
                        <div class="group relative cursor-pointer">
                          {topic.value.icon ? (
                            <img
                              src={topic.value.icon}
                              alt={`${topic.value.name} 图标`}
                              class="size-14 rounded-xl object-cover transition-opacity group-hover:opacity-70"
                            />
                          ) : (
                            <div class="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 text-xl font-semibold text-neutral-600 transition-opacity group-hover:opacity-70 dark:from-neutral-700 dark:to-neutral-600 dark:text-neutral-300">
                              {textToBigCharOrWord(topic.value.name)}
                            </div>
                          )}
                          <div class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <Pencil class="size-5 text-white" />
                          </div>
                        </div>
                      </NUploadDragger>
                    </UploadWrapper>
                  </div>

                  <div class="min-w-0 flex-1 overflow-hidden">
                    <h3 class="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {topic.value.name}
                    </h3>
                    <div class="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                      <Hash class="size-3 shrink-0" />
                      <span class="truncate font-mono">{topic.value.slug}</span>
                    </div>
                    {topic.value.introduce && (
                      <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {topic.value.introduce}
                      </p>
                    )}
                  </div>
                </div>

                {topic.value.description && (
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    {topic.value.description}
                  </p>
                )}
              </div>

              <div class="h-px bg-neutral-100 dark:bg-neutral-800" />

              <div>
                <div class="mb-3 flex items-center justify-between">
                  <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    包含的文章
                    {notePagination.value && (
                      <span class="ml-1 text-xs text-neutral-400">
                        ({notePagination.value.total})
                      </span>
                    )}
                  </h4>
                  <NButton
                    size="small"
                    type="primary"
                    onClick={() => (showAddNoteModal.value = true)}
                  >
                    {{
                      icon: () => <Plus class="size-4" />,
                      default: () => '添加',
                    }}
                  </NButton>
                </div>

                {loadingNotes.value && notes.value.length === 0 ? (
                  <NoteListSkeleton />
                ) : notes.value.length === 0 ? (
                  <div class="flex flex-col items-center justify-center py-8 text-center">
                    <NEmpty description="暂无文章">
                      {{
                        extra: () => (
                          <NButton
                            size="small"
                            onClick={() => (showAddNoteModal.value = true)}
                          >
                            添加文章
                          </NButton>
                        ),
                      }}
                    </NEmpty>
                  </div>
                ) : (
                  <div>
                    {notes.value.map((note) => (
                      <NoteListItem
                        key={note.id}
                        note={note}
                        onEdit={() => {
                          router.push({
                            path: '/notes/edit',
                            query: { id: note.id },
                          })
                        }}
                        onRemove={() => handleRemoveNoteFromTopic(note.id)}
                        topicName={topic.value?.name}
                      />
                    ))}

                    {notePagination.value &&
                      notePagination.value.totalPage > 1 && (
                        <div class="flex justify-center pt-4">
                          <NPagination
                            page={notePagination.value.currentPage}
                            pageCount={notePagination.value.totalPage}
                            onUpdatePage={(page) =>
                              fetchTopicNotes(props.topicId!, page)
                            }
                          />
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </NScrollbar>

        {topic.value && (
          <AddNoteToTopicModal
            show={showAddNoteModal.value}
            topicId={topic.value.id!}
            onClose={() => (showAddNoteModal.value = false)}
            onSuccess={() => {
              showAddNoteModal.value = false
              if (props.topicId) {
                fetchTopicNotes(props.topicId)
              }
            }}
          />
        )}
      </div>
    )
  },
})

export const TopicDetailEmptyState = defineComponent({
  name: 'TopicDetailEmptyState',
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <Hash class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          选择一个专栏
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择专栏查看详情
        </p>
      </div>
    )
  },
})

const NoteListItem = defineComponent({
  props: {
    note: {
      type: Object as PropType<
        Pick<NoteModel, 'id' | 'title' | 'nid' | 'created'>
      >,
      required: true,
    },
    onEdit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onRemove: {
      type: Function as PropType<() => void>,
      required: true,
    },
    topicName: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    return () => (
      <div class="group flex items-center justify-between border-b border-neutral-100 px-0 py-2.5 transition-colors last:border-b-0 dark:border-neutral-800/50">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="shrink-0 font-mono text-xs text-neutral-400">
              #{props.note.nid}
            </span>
            <span class="truncate text-sm text-neutral-900 dark:text-neutral-100">
              {props.note.title}
            </span>
            <span class="shrink-0 text-xs text-neutral-400">
              <RelativeTime time={props.note.created} />
            </span>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <a
            href={buildMarkdownRenderUrl(props.note.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <NButton size="tiny" quaternary>
              <ExternalLink class="size-3.5" />
            </NButton>
          </a>
          <NButton size="tiny" quaternary type="primary" onClick={props.onEdit}>
            <Pencil class="size-3.5" />
          </NButton>
          <NPopconfirm onPositiveClick={props.onRemove}>
            {{
              trigger: () => (
                <NButton size="tiny" quaternary type="error">
                  <X class="size-3.5" />
                </NButton>
              ),
              default: () => (
                <span>确定要从专栏「{props.topicName}」中移除此文章吗？</span>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

const AddNoteToTopicModal = defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onSuccess: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const {
      refresh,
      fetchNext,
      datalist: noteList,
      loading: fetchingLoading,
    } = useMemoNoteList()

    const selectedNoteIds = ref<string[]>([])
    const submitting = ref(false)

    const handleSubmit = async () => {
      if (selectedNoteIds.value.length === 0) {
        toast.warning('请选择要添加的文章')
        return
      }

      submitting.value = true
      try {
        await Promise.all(
          selectedNoteIds.value.map((noteId) =>
            notesApi.patch(noteId, { topicId: props.topicId }),
          ),
        )
        toast.success('添加成功')
        selectedNoteIds.value = []
        props.onSuccess()
      } finally {
        submitting.value = false
      }
    }

    const handleScroll = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      if (target.scrollTop + target.offsetHeight + 10 >= target.scrollHeight) {
        fetchNext()
      }
    }

    onMounted(() => {
      if (noteList.value.length === 0) {
        fetchNext()
      }
    })

    return () => (
      <NModal
        show={props.show}
        onUpdateShow={(show) => {
          if (!show) props.onClose()
        }}
        preset="card"
        title="添加文章到专栏"
        class="w-full max-w-md"
        closable
      >
        <div class="space-y-4">
          <NSelect
            multiple
            filterable
            clearable
            loading={fetchingLoading.value}
            value={selectedNoteIds.value}
            onUpdateValue={(values) => (selectedNoteIds.value = values)}
            maxTagCount={3}
            options={noteList.value.map((note) => ({
              label: note.title,
              value: note.id,
              key: note.id,
            }))}
            placeholder="选择要添加的文章"
            resetMenuOnOptionsChange={false}
            onClear={refresh}
            onScroll={handleScroll}
          />

          <div class="flex justify-end gap-2">
            <NButton onClick={props.onClose}>取消</NButton>
            <NButton
              type="primary"
              loading={submitting.value}
              disabled={selectedNoteIds.value.length === 0}
              onClick={handleSubmit}
            >
              添加 ({selectedNoteIds.value.length})
            </NButton>
          </div>
        </div>
      </NModal>
    )
  },
})

const TopicDetailSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="animate-pulse p-6">
        <div class="mb-6">
          <div class="flex items-start gap-4">
            <div class="size-14 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
            <div class="flex-1">
              <div class="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div class="mt-2 h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div class="mt-3 h-4 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
        <div class="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              class="h-10 rounded bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
    )
  },
})

const NoteListSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            class="h-10 rounded bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    )
  },
})
