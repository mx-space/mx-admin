import {
  ArrowLeft as ArrowLeftIcon,
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  SmilePlus as EmojiAddIcon,
  Globe as GlobeIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Monitor as MonitorIcon,
  Smartphone as PhoneIcon,
  ShieldAlert as SpamIcon,
  Trash2 as TrashIcon,
  CornerDownRight as TurnRightIcon,
} from 'lucide-vue-next'
import {
  NAvatar,
  NButton,
  NInput,
  NPopconfirm,
  NPopover,
  NScrollbar,
  NTooltip,
} from 'naive-ui'
import { computed, defineComponent, nextTick, ref, unref, watch } from 'vue'
import type { CommentModel } from '~/models/comment'
import type { PropType } from 'vue'

import { EmojiPicker } from '~/components/editor/toolbar/emoji-picker'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { WEB_URL } from '~/constants/env'
import { CommentState } from '~/models/comment'
import { useUserStore } from '~/stores/user'

import { CommentMarkdownRender } from '../markdown-render'

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

interface LocalReply {
  id: string
  text: string
  created: Date
}

export const CommentDetail = defineComponent({
  name: 'CommentDetail',
  props: {
    comment: {
      type: Object as PropType<CommentModel>,
      required: true,
    },
    currentTab: {
      type: Number,
      required: true,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    replyLoading: {
      type: Boolean,
      default: false,
    },
    onBack: {
      type: Function as PropType<() => void>,
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
    onReply: {
      type: Function as PropType<(id: string, text: string) => Promise<void>>,
      required: true,
    },
  },
  setup(props) {
    const userStore = useUserStore()
    const user = computed(() => userStore.user)

    const link = computed(() => getReferenceLink(props.comment))
    const isReply = computed(() => !!(props.comment as any).parent)
    const isTrash = computed(() => props.currentTab === 2)

    const deviceInfo = computed(() => {
      const ua = props.comment.agent?.toLowerCase() || ''
      const isMobile =
        ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')
      return {
        icon: isMobile ? (
          <PhoneIcon class="h-3.5 w-3.5" />
        ) : (
          <MonitorIcon class="h-3.5 w-3.5" />
        ),
        label: props.comment.agent?.split(' ')[0] || '未知设备',
        full: props.comment.agent,
      }
    })

    const replyText = ref('')
    const replyInputRef = ref<typeof NInput>()
    const localReplies = ref<LocalReply[]>([])
    const scrollbarRef = ref<InstanceType<typeof NScrollbar>>()

    const focusInput = () => {
      nextTick(() => {
        if (replyInputRef.value && !isTrash.value) {
          const el = unref(replyInputRef.value)
          el.focus()
        }
      })
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (scrollbarRef.value) {
          const container = scrollbarRef.value.$el?.querySelector(
            '.n-scrollbar-container',
          ) as HTMLElement
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }
      })
    }

    watch(
      () => props.comment.id,
      () => {
        replyText.value = ''
        localReplies.value = []
        focusInput()
      },
      { immediate: true },
    )

    const handleReplySubmit = async () => {
      if (!replyText.value.trim()) return
      const text = replyText.value
      replyText.value = ''

      await props.onReply(props.comment.id, text)

      localReplies.value.push({
        id: Date.now().toString(),
        text,
        created: new Date(),
      })

      scrollToBottom()
      focusInput()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleReplySubmit()
        e.preventDefault()
      }
    }

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
              评论详情
            </h2>
          </div>

          <div class="flex items-center gap-1">
            {props.currentTab !== 1 && (
              <ActionButton
                icon={CheckIcon}
                label="标为已读"
                onClick={() =>
                  props.onChangeState(props.comment.id, CommentState.Read)
                }
              />
            )}
            {props.currentTab !== 2 && (
              <ActionButton
                icon={SpamIcon}
                label="标为垃圾"
                onClick={() =>
                  props.onChangeState(props.comment.id, CommentState.Junk)
                }
              />
            )}
            <NPopconfirm
              positiveText="确认删除"
              negativeText="取消"
              onPositiveClick={() => props.onDelete(props.comment.id)}
            >
              {{
                trigger: () => (
                  <div class="inline-block">
                    <ActionButton
                      icon={TrashIcon}
                      label="删除"
                      onClick={() => {}}
                      class="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500"
                    />
                  </div>
                ),
                default: () => '确定要删除这条评论吗？',
              }}
            </NPopconfirm>
          </div>
        </div>

        <NScrollbar ref={scrollbarRef} class="min-h-0 flex-1">
          <div class="mx-auto max-w-3xl space-y-8 p-6">
            {isReply.value && (
              <div class="relative pl-6">
                <div class="absolute left-0 top-0 h-full w-0.5 bg-neutral-200 dark:bg-neutral-800" />
                <div class="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                  <TurnRightIcon class="h-3 w-3" />
                  <span>
                    回复{' '}
                    <strong class="font-medium text-neutral-900 dark:text-neutral-100">
                      @{(props.comment as any).parent.author}
                    </strong>
                  </span>
                </div>
                <div class="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <CommentMarkdownRender
                    text={(props.comment as any).parent.text}
                  />
                </div>
              </div>
            )}

            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <NAvatar
                  round
                  src={props.comment.avatar}
                  size={48}
                  class="bg-neutral-100 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-800"
                />
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-neutral-900 dark:text-neutral-100">
                      {props.comment.author}
                    </span>
                    {props.comment.isWhispers && (
                      <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                        悄悄话
                      </span>
                    )}
                  </div>
                  <div class="text-xs text-neutral-500">
                    <RelativeTime time={props.comment.created} />
                  </div>
                </div>
              </div>

              <div class="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed text-neutral-900 dark:text-neutral-100">
                <CommentMarkdownRender text={props.comment.text} />
              </div>

              {/* @ts-expect-error */}
              {props.comment.ref?.title && (
                <div class="flex items-center gap-2 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800">
                  <span class="text-neutral-400">来源:</span>
                  <a
                    href={link.value}
                    target="_blank"
                    class="truncate font-medium hover:underline"
                    rel="noreferrer"
                  >
                    {/* @ts-expect-error */}
                    {props.comment.ref.title}
                  </a>
                  <ChevronRightIcon class="ml-auto h-4 w-4 text-neutral-400" />
                </div>
              )}
            </div>

            <div class="h-px bg-neutral-100 dark:bg-neutral-800" />

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-neutral-500">
                  IP 地址
                </span>
                <div class="flex items-center gap-2">
                  <IpInfoPopover
                    ip={props.comment.ip}
                    trigger="click"
                    triggerEl={
                      <button class="flex items-center gap-1.5 text-sm text-neutral-900 hover:underline dark:text-neutral-100">
                        <MapPinIcon class="h-3.5 w-3.5 text-neutral-400" />
                        <span>{props.comment.ip}</span>
                      </button>
                    }
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-neutral-500">
                  访问设备
                </span>
                <NTooltip trigger="hover">
                  {{
                    trigger: () => (
                      <div class="flex items-center gap-1.5 text-sm text-neutral-900 dark:text-neutral-100">
                        <span class="text-neutral-400">
                          {deviceInfo.value.icon}
                        </span>
                        <span class="truncate">{deviceInfo.value.label}</span>
                      </div>
                    ),
                    default: () => deviceInfo.value.full,
                  }}
                </NTooltip>
              </div>

              {props.comment.mail && (
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-medium text-neutral-500">
                    电子邮箱
                  </span>
                  <a
                    href={`mailto:${props.comment.mail}`}
                    class="flex items-center gap-1.5 text-sm text-neutral-900 hover:underline dark:text-neutral-100"
                  >
                    <MailIcon class="h-3.5 w-3.5 text-neutral-400" />
                    <span class="truncate">{props.comment.mail}</span>
                  </a>
                </div>
              )}

              {props.comment.url && (
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-medium text-neutral-500">
                    站点地址
                  </span>
                  <a
                    href={props.comment.url}
                    target="_blank"
                    class="flex items-center gap-1.5 text-sm text-neutral-900 hover:underline dark:text-neutral-100"
                    rel="noreferrer"
                  >
                    <GlobeIcon class="h-3.5 w-3.5 text-neutral-400" />
                    <span class="truncate">{props.comment.url}</span>
                  </a>
                </div>
              )}
            </div>

            {localReplies.value.length > 0 && (
              <div class="mt-8 space-y-6 border-t border-neutral-100 pt-8 dark:border-neutral-800">
                <h3 class="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  新增回复
                </h3>
                {localReplies.value.map((reply) => (
                  <div key={reply.id} class="flex gap-4">
                    <NAvatar
                      round
                      src={user.value?.avatar}
                      size={32}
                      class="shrink-0 bg-neutral-100 ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-800"
                    />
                    <div class="min-w-0 flex-1 space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {user.value?.name || '我'}
                        </span>
                        <span class="text-xs text-neutral-400">
                          <RelativeTime time={reply.created.toISOString()} />
                        </span>
                      </div>
                      <div class="prose prose-sm prose-neutral dark:prose-invert">
                        <CommentMarkdownRender text={reply.text} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </NScrollbar>

        {!isTrash.value && (
          <div class="flex-shrink-0 border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div class="mx-auto max-w-3xl">
              <div class="relative overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-700 dark:focus-within:ring-neutral-700">
                <NInput
                  ref={replyInputRef}
                  value={replyText.value}
                  type="textarea"
                  placeholder="写下你的回复..."
                  onInput={(v) => (replyText.value = v)}
                  autosize={{ minRows: 2, maxRows: 8 }}
                  onKeydown={handleKeyDown}
                  bordered={false}
                  class="!bg-transparent bg-transparent"
                />
                <div class="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <NPopover
                    internalExtraClass={['headless']}
                    trigger="click"
                    placement="top-start"
                    showArrow={false}
                  >
                    {{
                      trigger: () => (
                        <button class="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                          <EmojiAddIcon class="h-4 w-4" />
                        </button>
                      ),
                      default: () => (
                        <EmojiPicker
                          onSelect={(emoji) => {
                            if (!replyInputRef.value) return
                            const el = unref(replyInputRef.value)
                              .textareaElRef as HTMLTextAreaElement
                            const start = el.selectionStart
                            const text = replyText.value
                            replyText.value = `${text.slice(0, start)}${emoji}${text.slice(el.selectionEnd)}`
                            nextTick(() => {
                              el.focus()
                              el.setSelectionRange(
                                start + emoji.length,
                                start + emoji.length,
                              )
                            })
                          }}
                        />
                      ),
                    }}
                  </NPopover>

                  <div class="flex items-center gap-3">
                    <span class="hidden text-xs text-neutral-400 sm:inline-block">
                      使用 <kbd class="font-sans">⌘</kbd> +{' '}
                      <kbd class="font-sans">Enter</kbd> 发送
                    </span>
                    <NButton
                      type="primary"
                      size="tiny"
                      onClick={handleReplySubmit}
                      loading={props.replyLoading}
                      disabled={!replyText.value.trim()}
                      class="px-2"
                    >
                      发送回复
                    </NButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
})
