import { ChevronDown, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { NPopconfirm, NPopover, NSpin } from 'naive-ui'
import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import type { SessionMeta } from './composables/use-session-manager'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export const SessionHeader = defineComponent({
  name: 'SessionHeader',
  props: {
    sessions: {
      type: Array as PropType<SessionMeta[]>,
      required: true,
    },
    activeSessionId: {
      type: String as PropType<string | null>,
      default: null,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    loadError: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'switchSession',
    'createSession',
    'deleteSession',
    'renameSession',
    'retry',
  ],
  setup(props, { emit }) {
    const dropdownVisible = ref(false)
    const isEditing = ref(false)
    const editValue = ref('')

    const activeSession = computed(() =>
      props.sessions.find((s) => s.id === props.activeSessionId),
    )

    const displayTitle = computed(
      () => activeSession.value?.title || '未命名对话',
    )

    const sortedSessions = computed(() =>
      [...props.sessions].sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
      ),
    )

    function handleStartEdit() {
      isEditing.value = true
      editValue.value = activeSession.value?.title || ''
    }

    function handleFinishEdit() {
      isEditing.value = false
      const trimmed = editValue.value.trim()
      if (trimmed && props.activeSessionId) {
        emit('renameSession', props.activeSessionId, trimmed)
      }
    }

    function handleEditKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleFinishEdit()
      }
      if (e.key === 'Escape') {
        isEditing.value = false
      }
    }

    function handleSelectSession(id: string) {
      dropdownVisible.value = false
      if (id !== props.activeSessionId) {
        emit('switchSession', id)
      }
    }

    return () => (
      <div class="flex h-9 flex-shrink-0 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-700">
        {props.loadError ? (
          <button
            class="flex flex-1 cursor-pointer items-center gap-1.5 text-xs text-red-500"
            onClick={() => emit('retry')}
          >
            <RefreshCw class="h-3 w-3" />
            加载失败，点击重试
          </button>
        ) : (
          <>
            <div class="flex min-w-0 flex-1 items-center gap-1">
              {isEditing.value ? (
                <input
                  class="h-6 min-w-0 flex-1 rounded border border-neutral-300 bg-transparent px-1.5 text-xs font-semibold text-neutral-800 outline-none focus:border-blue-400 dark:border-neutral-600 dark:text-neutral-200"
                  value={editValue.value}
                  onInput={(e) => {
                    editValue.value = (e.target as HTMLInputElement).value
                  }}
                  onBlur={handleFinishEdit}
                  onKeydown={handleEditKeydown}
                  autofocus
                />
              ) : (
                <NPopover
                  trigger="click"
                  placement="bottom-start"
                  show={dropdownVisible.value}
                  onUpdateShow={(v: boolean) => {
                    dropdownVisible.value = v
                  }}
                  raw
                  style={{ padding: 0 }}
                >
                  {{
                    trigger: () => (
                      <button
                        class="flex min-w-0 cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onDblclick={handleStartEdit}
                      >
                        <span class="truncate">{displayTitle.value}</span>
                        <ChevronDown class="h-3 w-3 flex-shrink-0 opacity-50" />
                      </button>
                    ),
                    default: () => (
                      <div class="w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                        {props.isLoading ? (
                          <div class="flex items-center justify-center py-6">
                            <NSpin size="small" />
                          </div>
                        ) : sortedSessions.value.length === 0 ? (
                          <div class="px-3 py-4 text-center text-xs text-neutral-400">
                            暂无历史对话
                          </div>
                        ) : (
                          <div class="max-h-64 overflow-y-auto py-1">
                            {sortedSessions.value.map((session) => (
                              <button
                                key={session.id}
                                class={[
                                  'flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left transition-colors',
                                  session.id === props.activeSessionId
                                    ? 'bg-neutral-100 dark:bg-neutral-800'
                                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                                ]}
                                onClick={() => handleSelectSession(session.id)}
                              >
                                <span class="truncate text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                  {session.title || '未命名对话'}
                                </span>
                                <span class="text-xs text-neutral-400">
                                  {formatRelativeTime(session.updated)}
                                  {' · '}
                                  {session.messageCount} 条消息
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  }}
                </NPopover>
              )}
            </div>

            <div class="flex items-center gap-0.5">
              <button
                class="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="新建对话"
                onClick={() => emit('createSession')}
              >
                <Plus class="h-3.5 w-3.5" />
              </button>

              {props.activeSessionId && (
                <NPopconfirm
                  onPositiveClick={() => {
                    if (props.activeSessionId) {
                      emit('deleteSession', props.activeSessionId)
                    }
                  }}
                >
                  {{
                    trigger: () => (
                      <button
                        class="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        title="删除对话"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    ),
                    default: () => '确定删除这个对话吗？',
                  }}
                </NPopconfirm>
              )}
            </div>
          </>
        )}
      </div>
    )
  },
})
