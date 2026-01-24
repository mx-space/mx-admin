import {
  CheckCheck as CheckAllIcon,
  Check as CheckIcon,
  SmilePlus as EmojiAddIcon,
  Globe as GlobeIcon,
  Inbox as InboxIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  MessageSquare as MessageSquareIcon,
  Monitor as MonitorIcon,
  Smartphone as PhoneIcon,
  ShieldAlert as SpamIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import markdownEscape from 'markdown-escape'
import {
  NAvatar,
  NButton,
  NCard,
  NCheckbox,
  NInput,
  NModal,
  NPopconfirm,
  NPopover,
  NTabPane,
  NTabs,
  NTooltip,
  useDialog,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  Fragment,
  nextTick,
  ref,
  unref,
  watch,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import type { CommentModel } from '~/models/comment'
import type { PropType } from 'vue'

import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { commentsApi } from '~/api/comments'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { WEB_URL } from '~/constants/env'
import { KAOMOJI_LIST } from '~/constants/kaomoji'
import { queryKeys } from '~/hooks/queries/keys'
import { useDataTable } from '~/hooks/use-data-table'
import { useStoreRef } from '~/hooks/use-store-ref'
import { useLayout } from '~/layouts/content'
import { CommentState } from '~/models/comment'
import { RouteName } from '~/router/name'
import { LayoutStore } from '~/stores/layout'
import { UIStore } from '~/stores/ui'

import { CommentMarkdownRender } from './markdown-render'

enum CommentType {
  Pending,
  Marked,
  Trash,
}

// --- Helpers ---

const getReferenceLink = (row: CommentModel) => {
  const ref = (row as any).ref
  switch (row.refType) {
    case 'posts': {
      return `${WEB_URL}/posts/${ref.category.slug}/${ref.slug}`
    }
    case 'notes': {
      return `${WEB_URL}/notes/${ref.nid}`
    }
    case 'pages': {
      return `${WEB_URL}/${ref.slug}`
    }
    case 'recentlies': {
      return `${WEB_URL}/thinking/${ref.id}`
    }
    default:
      return ''
  }
}

// --- Components ---

/**
 * Single Comment Feed Item
 */
const CommentFeedItem = defineComponent({
  name: 'CommentFeedItem',
  props: {
    data: {
      type: Object as PropType<CommentModel>,
      required: true,
    },
    checked: {
      type: Boolean,
      default: false,
    },
    currentTab: {
      type: Number as PropType<CommentType>,
      required: true,
    },
    onCheck: {
      type: Function as PropType<(checked: boolean) => void>,
      required: true,
    },
    onReply: {
      type: Function as PropType<(comment: CommentModel) => void>,
      required: true,
    },
    onChangeState: {
      type: Function as PropType<
        (id: string, state: CommentState) => Promise<void> | void
      >,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => Promise<void> | void>,
      required: true,
    },
  },
  setup(props) {
    const row = computed(() => props.data)
    const link = computed(() => getReferenceLink(row.value))

    // Parse User Agent roughly
    const deviceIcon = computed(() => {
      const ua = row.value.agent?.toLowerCase() || ''
      if (
        ua.includes('mobile') ||
        ua.includes('android') ||
        ua.includes('iphone')
      ) {
        return <PhoneIcon class="h-3.5 w-3.5" />
      }
      return <MonitorIcon class="h-3.5 w-3.5" />
    })

    const ActionButtons = () => (
      <div class="flex items-center gap-1">
        {props.currentTab !== CommentType.Trash && (
          <NTooltip>
            {{
              trigger: () => (
                <button
                  onClick={() => props.onReply(row.value)}
                  class="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                >
                  <MessageSquareIcon class="h-4 w-4" />
                </button>
              ),
              default: () => '回复',
            }}
          </NTooltip>
        )}

        {props.currentTab !== CommentType.Marked && (
          <NTooltip>
            {{
              trigger: () => (
                <button
                  onClick={() => props.onChangeState(row.value.id, 1)}
                  class="rounded-md p-1.5 text-neutral-500 hover:bg-green-50 hover:text-green-600 dark:text-neutral-400 dark:hover:bg-green-900/20 dark:hover:text-green-500"
                >
                  <CheckIcon class="h-4 w-4" />
                </button>
              ),
              default: () => '标为已读',
            }}
          </NTooltip>
        )}

        {props.currentTab !== CommentType.Trash && (
          <NTooltip>
            {{
              trigger: () => (
                <button
                  onClick={() => props.onChangeState(row.value.id, 2)}
                  class="rounded-md p-1.5 text-neutral-500 hover:bg-yellow-50 hover:text-yellow-600 dark:text-neutral-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-500"
                >
                  <SpamIcon class="h-4 w-4" />
                </button>
              ),
              default: () => '标为垃圾',
            }}
          </NTooltip>
        )}

        <NPopconfirm
          positiveText="删除"
          negativeText="取消"
          onPositiveClick={() => props.onDelete(row.value.id)}
        >
          {{
            trigger: () => (
              <button class="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-900/20 dark:hover:text-red-500">
                <TrashIcon class="h-4 w-4" />
              </button>
            ),
            default: () => '确定要删除这条评论吗？',
          }}
        </NPopconfirm>
      </div>
    )

    const handleItemClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.n-checkbox')
      ) {
        return
      }
      props.onCheck(!props.checked)
    }

    return () => (
      <div
        class={[
          'group flex items-start gap-3 border-b border-neutral-200 px-4 py-5 transition-all last:border-b-0',
          'hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800/50',
          props.checked ? 'bg-neutral-100 dark:bg-neutral-800/50' : '',
        ]}
        onClick={handleItemClick}
      >
        {/* Selection Checkbox - Always Visible */}
        <div class="mt-1 shrink-0">
          <NCheckbox
            checked={props.checked}
            onUpdateChecked={props.onCheck}
            size="small"
          />
        </div>

        {/* Avatar */}
        <div class="mt-0.5 shrink-0">
          <NAvatar
            circle
            src={row.value.avatar}
            size={40}
            class="bg-neutral-100 dark:bg-neutral-800"
          />
        </div>

        {/* Main Body */}
        <div class="min-w-0 flex-1 space-y-2">
          {/* Header Line: Author + Context + Time + Actions (Desktop) */}
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex flex-wrap items-baseline gap-x-1.5 text-sm leading-6">
              <span class="font-semibold text-neutral-900 dark:text-neutral-100">
                {row.value.author}
              </span>

              <span class="text-neutral-500">
                {(row.value as any).parent ? '回复了' : '评论了'}
              </span>

              {/* @ts-expect-error */}
              {row.value.ref?.title ? (
                <a
                  href={link.value}
                  target="_blank"
                  class="font-medium text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
                  rel="noreferrer"
                >
                  {/* @ts-expect-error */}
                  {row.value.ref.title}
                </a>
              ) : (
                <span class="italic text-neutral-400">内容已删除</span>
              )}

              <span class="text-neutral-400">·</span>
              <RelativeTime
                time={row.value.created}
                class="text-sm text-neutral-400"
              />
            </div>

            {/* Desktop Actions - Integrated into header to save space */}
            <div class="hidden sm:block">
              <ActionButtons />
            </div>
          </div>

          {/* Context / Parent (if reply) */}
          {(row.value as any).parent && (
            <div class="flex items-start gap-1.5 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <span class="shrink-0 font-medium">
                @{(row.value as any).parent.author}:
              </span>
              <span class="line-clamp-5">
                <CommentMarkdownRender text={(row.value as any).parent.text} />
              </span>
            </div>
          )}

          {/* Comment Content */}
          <div class="text-base leading-relaxed text-neutral-800 dark:text-neutral-200">
            <CommentMarkdownRender text={row.value.text} />
          </div>

          {/* Footer / Meta */}
          <div class="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
            {/* IP Info */}
            <IpInfoPopover
              ip={row.value.ip}
              trigger="click"
              triggerEl={
                <button class="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-300">
                  <MapPinIcon class="h-3.5 w-3.5" />
                  {row.value.ip}
                </button>
              }
            />

            {/* Device/OS */}
            <NTooltip trigger="hover">
              {{
                trigger: () => (
                  <div class="flex items-center gap-1.5">
                    {deviceIcon.value}
                  </div>
                ),
                default: () => row.value.agent,
              }}
            </NTooltip>

            {/* Contact Links */}
            <div class="flex gap-3">
              {row.value.mail && (
                <a
                  href={`mailto:${row.value.mail}`}
                  class="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <MailIcon class="h-3.5 w-3.5" />
                </a>
              )}
              {row.value.url && (
                <a
                  href={row.value.url}
                  target="_blank"
                  class="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-300"
                  rel="noreferrer"
                >
                  <GlobeIcon class="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* Whisper Badge */}
            {row.value.isWhispers && (
              <span class="ml-auto inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                悄悄话
              </span>
            )}
          </div>

          {/* Mobile Actions - Row at bottom */}
          <div class="flex justify-end pt-2 sm:hidden">
            <ActionButtons />
          </div>
        </div>
      </div>
    )
  },
})

// --- Main View ---

const ManageComment = defineComponent(() => {
  const route = useRoute()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setActions } = useLayout()

  const tabValue = ref(
    (+(route.query.state as string) as CommentType) || CommentType.Pending,
  )

  const {
    data,
    checkedRowKeys,
    pager,
    isLoading: loading,
    setPage,
  } = useDataTable<CommentModel>({
    queryKey: (params) =>
      queryKeys.comments.list(params.filters?.state ?? 0, params),
    queryFn: async (params) => {
      const response = await commentsApi.getList({
        page: params.page,
        size: params.size,
        state: params.filters?.state ?? 0,
      })
      return {
        data: response.data.map((data) => {
          Reflect.deleteProperty(data, 'children')
          return data
        }),
        pagination: response.pagination,
      }
    },
    pageSize: 15,
    filters: () => ({ state: tabValue.value }),
  })

  // --- Mutations ---
  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      commentsApi.masterReply(id, text),
    onSuccess: () => {
      toast.success('回复成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })

  const updateStateMutation = useMutation({
    mutationFn: async ({
      ids,
      state,
    }: {
      ids: string | string[]
      state: CommentState
    }) => {
      if (Array.isArray(ids)) {
        await Promise.all(ids.map((id) => commentsApi.updateState(id, state)))
      } else {
        await commentsApi.updateState(ids, state)
      }
    },
    onSuccess: () => {
      toast.success('操作成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (ids: string | string[]) => {
      if (Array.isArray(ids)) {
        await Promise.allSettled(ids.map((id) => commentsApi.delete(id)))
      } else {
        await commentsApi.delete(ids)
      }
    },
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    },
  })

  // --- Actions ---
  const changeState = (id: string | string[], state: CommentState) => {
    updateStateMutation.mutate({ ids: id, state })
  }

  const handleDelete = (id: string | string[]) => {
    deleteMutation.mutate(id)
  }

  // --- Reply Dialog ---
  const replyDialogShow = ref(false)
  const replyComment = ref<CommentModel | null>(null)
  const replyText = ref('')
  const replyInputRef = ref<typeof NInput>()

  const onReplySubmit = () => {
    if (!replyComment.value) return
    replyMutation.mutate(
      { id: replyComment.value.id, text: replyText.value },
      {
        onSuccess: () => {
          replyDialogShow.value = false
          replyComment.value = null
          replyText.value = ''
        },
      },
    )
  }

  const ui = useStoreRef(UIStore)
  const dialog = useDialog()

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      onReplySubmit()
      e.preventDefault()
    }
  }

  // --- Selection Logic ---
  const selectAllMode = ref(false)

  const handleCheck = (id: string, checked: boolean) => {
    selectAllMode.value = false
    if (checked) {
      checkedRowKeys.value.push(id)
    } else {
      checkedRowKeys.value = checkedRowKeys.value.filter((k) => k !== id)
    }
  }

  const handleCheckAll = (checked: boolean) => {
    selectAllMode.value = false
    if (checked) {
      checkedRowKeys.value = data.value.map((d) => d.id)
    } else {
      checkedRowKeys.value = []
    }
  }

  const handleSelectAll = () => {
    selectAllMode.value = true
    checkedRowKeys.value = data.value.map((d) => d.id)
  }

  const isAllChecked = computed(() => {
    return (
      data.value.length > 0 && checkedRowKeys.value.length === data.value.length
    )
  })

  const isIndeterminate = computed(() => {
    return (
      checkedRowKeys.value.length > 0 &&
      checkedRowKeys.value.length < data.value.length
    )
  })

  const totalCount = computed(() => pager.value?.total ?? 0)
  const hasMultiplePages = computed(
    () => pager.value && pager.value.totalPage > 1,
  )
  const showSelectAllHint = computed(
    () => isAllChecked.value && hasMultiplePages.value && !selectAllMode.value,
  )

  // --- Header Actions ---
  const batchOperationLoading = ref(false)

  const handleBatchChangeState = async (state: CommentState) => {
    batchOperationLoading.value = true
    try {
      if (selectAllMode.value) {
        await commentsApi.batchUpdateState({
          all: true,
          state,
          currentState: tabValue.value,
        })
      } else {
        await commentsApi.batchUpdateState({
          ids: checkedRowKeys.value.concat(),
          state,
        })
      }
      toast.success('操作成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    } finally {
      batchOperationLoading.value = false
      selectAllMode.value = false
      checkedRowKeys.value = []
    }
  }

  const handleBatchDelete = async () => {
    batchOperationLoading.value = true
    try {
      if (selectAllMode.value) {
        await commentsApi.batchDelete({
          all: true,
          state: tabValue.value,
        })
      } else {
        await commentsApi.batchDelete({
          ids: checkedRowKeys.value.concat(),
        })
      }
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.all })
    } finally {
      batchOperationLoading.value = false
      selectAllMode.value = false
      checkedRowKeys.value = []
    }
  }

  const selectedCountDisplay = computed(() =>
    selectAllMode.value ? totalCount.value : checkedRowKeys.value.length,
  )

  watchEffect(() => {
    setActions(
      <Fragment>
        {tabValue.value !== CommentType.Marked && (
          <HeaderActionButton
            name="全部已读"
            disabled={
              checkedRowKeys.value.length === 0 || batchOperationLoading.value
            }
            icon={<CheckAllIcon />}
            variant="success"
            onClick={() => handleBatchChangeState(CommentState.Read)}
          />
        )}

        {tabValue.value !== CommentType.Trash && (
          <HeaderActionButton
            name="标记垃圾"
            disabled={
              checkedRowKeys.value.length === 0 || batchOperationLoading.value
            }
            icon={<SpamIcon />}
            variant="warning"
            onClick={() => handleBatchChangeState(CommentState.Junk)}
          />
        )}

        <HeaderActionButton
          name="删除选中"
          icon={<TrashIcon />}
          variant="error"
          disabled={
            checkedRowKeys.value.length === 0 || batchOperationLoading.value
          }
          onClick={() => {
            dialog.warning({
              title: '删除确认',
              content: `确定要删除选中的 ${selectedCountDisplay.value} 条评论吗？`,
              positiveText: '删除',
              negativeText: '取消',
              onPositiveClick: handleBatchDelete,
            })
          }}
        />
      </Fragment>,
    )
  })

  watch(
    () => route.query.state,
    () => {
      checkedRowKeys.value = []
      selectAllMode.value = false
    },
  )

  const layout = useStoreRef(LayoutStore)

  const isMobile = computed(
    () => ui.viewport.value.mobile || ui.viewport.value.pad,
  )
  watchEffect(() => {
    if (isMobile.value) layout.contentPadding.value = false
    else layout.contentPadding.value = true
  })

  return () => (
    <div class="mx-auto max-w-5xl space-y-4 pb-12 sm:space-y-6 sm:px-6 lg:px-8">
      {/* Header & Tabs */}
      <div class="px-4 sm:px-0">
        <NTabs
          value={tabValue.value}
          onUpdateValue={(e) => {
            router
              .replace({
                name: RouteName.Comment,
                query: { state: e },
              })
              .then(() => (tabValue.value = e))
          }}
          type="line"
          animated
        >
          <NTabPane name={CommentType.Pending} tab="待审核" />
          <NTabPane name={CommentType.Marked} tab="已读" />
          <NTabPane name={CommentType.Trash} tab="垃圾桶" />
        </NTabs>
      </div>

      {/* Main List Card - No border/radius on mobile */}
      <div class="overflow-hidden bg-white sm:rounded-xl sm:border sm:border-neutral-200 sm:shadow-sm dark:bg-neutral-900 sm:dark:border-neutral-800">
        {/* Bulk Actions Bar */}
        {data.value.length > 0 && (
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-neutral-200 bg-neutral-50/50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
            <NCheckbox
              checked={isAllChecked.value}
              indeterminate={isIndeterminate.value}
              onUpdateChecked={handleCheckAll}
              size="small"
            />
            <span class="text-sm font-medium text-neutral-500">
              {selectAllMode.value
                ? `已选择全部 ${totalCount.value} 条评论`
                : checkedRowKeys.value.length > 0
                  ? `已选 ${checkedRowKeys.value.length} 项`
                  : '全选'}
            </span>
            {showSelectAllHint.value && (
              <button
                onClick={handleSelectAll}
                class="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                选择全部 {totalCount.value} 条评论
              </button>
            )}
          </div>
        )}

        {/* The Feed */}
        {loading.value ? (
          <div class="flex items-center justify-center py-24">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
          </div>
        ) : data.value.length === 0 ? (
          <div class="flex flex-col items-center justify-center py-24 text-center">
            <InboxIcon class="mb-4 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
            <p class="text-base text-neutral-500">暂无评论</p>
          </div>
        ) : (
          <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
            {data.value.map((item) => (
              <CommentFeedItem
                key={item.id}
                data={item}
                checked={checkedRowKeys.value.includes(item.id)}
                onCheck={(c) => handleCheck(item.id, c)}
                currentTab={tabValue.value}
                onReply={(c) => {
                  replyComment.value = c
                  replyDialogShow.value = true
                }}
                onChangeState={changeState}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pager.value && pager.value.totalPage > 1 && (
          <div class="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
            <span class="text-sm text-neutral-500">
              第 {pager.value.currentPage} / {pager.value.totalPage} 页
            </span>
            <div class="flex gap-2">
              <button
                disabled={!pager.value.hasPrevPage}
                onClick={() => setPage(pager.value!.currentPage - 1)}
                class="rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                上一页
              </button>
              <button
                disabled={!pager.value.hasNextPage}
                onClick={() => setPage(pager.value!.currentPage + 1)}
                class="rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <NModal
        show={!!replyDialogShow.value}
        onUpdateShow={(v) => (replyDialogShow.value = v)}
        transformOrigin="center"
      >
        <NCard
          style={{ width: '600px', maxWidth: '95vw' }}
          title={undefined}
          bordered={false}
          size="small"
          role="dialog"
          aria-modal="true"
        >
          {replyComment.value && (
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <span class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  回复 {replyComment.value.author}
                </span>
              </div>

              {/* Context Preview */}
              <div class="relative max-h-32 overflow-y-auto rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                <div class="absolute left-0 top-0 h-full w-1 bg-neutral-200 dark:bg-neutral-700" />
                <div class="pl-2">
                  <CommentMarkdownRender text={replyComment.value.text} />
                </div>
              </div>

              {/* Input Area */}
              <div class="relative">
                <NInput
                  ref={replyInputRef}
                  value={replyText.value}
                  type="textarea"
                  placeholder="写下你的回复..."
                  onInput={(v) => (replyText.value = v)}
                  autosize={{ minRows: 4, maxRows: 12 }}
                  onKeydown={handleKeyDown}
                  class="!bg-white dark:!bg-neutral-950"
                />
                <div class="absolute bottom-2 right-2 flex gap-1">
                  <NPopover trigger="click" placement="top-end">
                    {{
                      trigger: () => (
                        <button class="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                          <EmojiAddIcon class="h-5 w-5" />
                        </button>
                      ),
                      default: () => (
                        <div class="grid w-64 grid-cols-4 gap-1 p-1">
                          {KAOMOJI_LIST.map((k) => (
                            <button
                              key={k}
                              onClick={() => {
                                if (!replyInputRef.value) return
                                const el = unref(replyInputRef.value)
                                  .textareaElRef as HTMLTextAreaElement
                                const start = el.selectionStart
                                const text = replyText.value
                                const insert = markdownEscape(k)
                                replyText.value = `${text.slice(0, start)} ${insert} ${text.slice(el.selectionEnd)}`
                                nextTick(() => {
                                  el.focus()
                                  el.setSelectionRange(
                                    start + insert.length + 2,
                                    start + insert.length + 2,
                                  )
                                })
                              }}
                              class="rounded p-1 text-center text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      ),
                    }}
                  </NPopover>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <NButton
                  onClick={() => (replyDialogShow.value = false)}
                  size="medium"
                >
                  取消
                </NButton>
                <NButton
                  type="primary"
                  onClick={onReplySubmit}
                  loading={replyMutation.isPending.value}
                  disabled={!replyText.value.trim()}
                  size="medium"
                >
                  回复
                </NButton>
              </div>
            </div>
          )}
        </NCard>
      </NModal>
    </div>
  )
})

export default ManageComment
