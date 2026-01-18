/**
 * Topic Detail Drawer
 * 专栏详情抽屉 - 展示专栏信息和关联文章
 */
import { ExternalLink, Hash, Pencil, Plus, X } from 'lucide-vue-next'
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NPopconfirm,
  NSelect,
  NUploadDragger,
} from 'naive-ui'
import { useRouter } from 'vue-router'
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

/**
 * Topic Detail Drawer Component
 */
export const TopicDetailDrawer = defineComponent({
  name: 'TopicDetailDrawer',
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
    onEdit: {
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

    // 从专栏移除文章
    const removeNoteMutation = useMutation({
      mutationFn: (noteId: string) => notesApi.patch(noteId, { topicId: null }),
      onSuccess: (_, noteId) => {
        message.success('已移除文章的专栏引用')
        const index = notes.value.findIndex((note) => note.id === noteId)
        if (index !== -1) {
          notes.value.splice(index, 1)
        }
      },
    })

    const handleRemoveNoteFromTopic = (noteId: string) => {
      removeNoteMutation.mutate(noteId)
    }

    // 更新专栏图标
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

    // 当 show 或 topicId 变化时获取数据
    watch(
      () => [props.show, props.topicId],
      ([show, id]) => {
        if (show && id) {
          fetchTopicDetail(id as string)
        }
      },
      { immediate: true },
    )

    // 添加文章的状态
    const showAddNoteModal = ref(false)

    return () => (
      <NDrawer
        show={props.show}
        width={480}
        class="max-w-[90vw]"
        placement="right"
        onUpdateShow={(show) => {
          if (!show) props.onClose()
        }}
      >
        <NDrawerContent
          title={topic.value ? `专栏 - ${topic.value.name}` : '专栏详情'}
          closable
          nativeScrollbar={false}
          bodyContentClass="!p-0"
        >
          {{
            header: () =>
              topic.value && (
                <div class="flex items-center gap-2">
                  <span class="text-base font-medium">
                    专栏 - {topic.value.name}
                  </span>
                  <NButton
                    size="tiny"
                    quaternary
                    type="primary"
                    onClick={() => props.onEdit(topic.value!.id!)}
                    aria-label="编辑专栏"
                  >
                    <Pencil class="size-3.5" />
                  </NButton>
                </div>
              ),
            default: () =>
              loadingTopic.value ? (
                <TopicDetailSkeleton />
              ) : topic.value ? (
                <div class="px-5 py-4">
                  {/* 专栏信息卡片 */}
                  <div class="mb-6 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div class="flex items-start gap-4">
                      {/* 可上传图标 */}
                      <UploadWrapper
                        class="shrink-0"
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
                            message.warning(res.message)
                          } catch {
                            // noop
                          }
                          return e.file
                        }}
                      >
                        <NUploadDragger class="!border-0 !bg-transparent !p-0">
                          <div class="group relative cursor-pointer">
                            {topic.value.icon ? (
                              <img
                                src={topic.value.icon}
                                alt={`${topic.value.name} 图标`}
                                class="size-16 rounded-xl object-cover transition-opacity group-hover:opacity-70"
                              />
                            ) : (
                              <div class="flex size-16 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 text-xl font-semibold text-neutral-600 transition-opacity group-hover:opacity-70 dark:from-neutral-700 dark:to-neutral-600 dark:text-neutral-300">
                                {textToBigCharOrWord(topic.value.name)}
                              </div>
                            )}
                            <div class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Pencil class="size-5 text-white" />
                            </div>
                          </div>
                        </NUploadDragger>
                      </UploadWrapper>

                      {/* 信息 */}
                      <div class="min-w-0 flex-1">
                        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {topic.value.name}
                        </h3>
                        <div class="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                          <Hash class="size-3" aria-hidden="true" />
                          <span class="font-mono">{topic.value.slug}</span>
                        </div>
                        {topic.value.introduce && (
                          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {topic.value.introduce}
                          </p>
                        )}
                      </div>
                    </div>

                    {topic.value.description && (
                      <p class="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                        {topic.value.description}
                      </p>
                    )}
                  </div>

                  {/* 文章列表 */}
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
                        secondary
                        onClick={() => (showAddNoteModal.value = true)}
                        aria-label="添加文章到专栏"
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
                      <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-8 dark:border-neutral-800">
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
                      <div class="space-y-2">
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

                        {/* 分页 */}
                        {notePagination.value &&
                          notePagination.value.totalPage > 1 && (
                            <div class="flex justify-center gap-2 pt-4">
                              <NButton
                                size="small"
                                disabled={!notePagination.value.hasPrevPage}
                                onClick={() =>
                                  fetchTopicNotes(
                                    props.topicId,
                                    notePagination.value!.currentPage - 1,
                                  )
                                }
                              >
                                上一页
                              </NButton>
                              <span class="flex items-center text-sm text-neutral-500">
                                {notePagination.value.currentPage} /{' '}
                                {notePagination.value.totalPage}
                              </span>
                              <NButton
                                size="small"
                                disabled={!notePagination.value.hasNextPage}
                                onClick={() =>
                                  fetchTopicNotes(
                                    props.topicId,
                                    notePagination.value!.currentPage + 1,
                                  )
                                }
                              >
                                下一页
                              </NButton>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null,
          }}
        </NDrawerContent>

        {/* 添加文章 Modal */}
        {topic.value && (
          <AddNoteToTopicModal
            show={showAddNoteModal.value}
            topicId={topic.value.id!}
            onClose={() => (showAddNoteModal.value = false)}
            onSuccess={() => {
              showAddNoteModal.value = false
              fetchTopicNotes(props.topicId)
            }}
          />
        )}
      </NDrawer>
    )
  },
})

/**
 * Note List Item
 */
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
      <div class="group flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="shrink-0 font-mono text-xs text-neutral-400">
              #{props.note.nid}
            </span>
            <span class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {props.note.title}
            </span>
          </div>
          <div class="mt-0.5 text-xs text-neutral-400">
            <RelativeTime time={props.note.created} />
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <a
            href={buildMarkdownRenderUrl(props.note.id)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`预览 ${props.note.title}`}
          >
            <NButton size="tiny" quaternary>
              <ExternalLink class="size-3.5" />
            </NButton>
          </a>
          <NButton
            size="tiny"
            quaternary
            type="primary"
            onClick={props.onEdit}
            aria-label={`编辑 ${props.note.title}`}
          >
            <Pencil class="size-3.5" />
          </NButton>
          <NPopconfirm onPositiveClick={props.onRemove}>
            {{
              trigger: () => (
                <NButton
                  size="tiny"
                  quaternary
                  type="error"
                  aria-label={`从专栏移除 ${props.note.title}`}
                >
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

/**
 * Add Note to Topic Modal
 */
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
        message.warning('请选择要添加的文章')
        return
      }

      submitting.value = true
      try {
        await Promise.all(
          selectedNoteIds.value.map((noteId) =>
            notesApi.patch(noteId, { topicId: props.topicId }),
          ),
        )
        message.success('添加成功')
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
      <div
        v-show={props.show}
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onClose()
        }}
      >
        <div
          class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-note-dialog-title"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3
              id="add-note-dialog-title"
              class="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
            >
              添加文章到专栏
            </h3>
            <button
              type="button"
              class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              onClick={props.onClose}
              aria-label="关闭"
            >
              <X class="size-5" />
            </button>
          </div>

          <div class="mb-4">
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
          </div>

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
      </div>
    )
  },
})

/**
 * Skeleton Components
 */
const TopicDetailSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="animate-pulse px-5 py-4">
        <div class="mb-6 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div class="flex items-start gap-4">
            <div class="size-16 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
            <div class="flex-1">
              <div class="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div class="mt-2 h-4 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div class="mt-3 h-4 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
        <div class="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              class="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800"
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
      <div class="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            class="h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    )
  },
})
