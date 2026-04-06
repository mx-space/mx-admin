import { NSpin } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { ReviewBatch, ToolCallGroupItem } from '@haklex/rich-agent-core'
import type { PropType } from 'vue'
import type { ReplayStateMap } from './composables/use-agent-reapply'
import type { SessionMeta } from './composables/use-session-manager'
import type { ProviderGroup, SelectedModel } from './ModelSelector'

import { agentStoreSelectors } from '@haklex/rich-agent-core'

import { ChatInput } from './ChatInput'
import { ChatMessageList } from './ChatMessageList'
import {
  useAgentStore,
  useAgentStoreSelector,
} from './composables/use-agent-store'
import { ModelSelector } from './ModelSelector'
import { SessionHeader } from './SessionHeader'

export const AgentChatPanel = defineComponent({
  name: 'AgentChatPanel',
  props: {
    providerGroups: {
      type: Array as PropType<ProviderGroup[]>,
      required: true,
    },
    selectedModel: {
      type: Object as PropType<SelectedModel | null>,
      default: null,
    },
    replayState: {
      type: Object as PropType<ReplayStateMap>,
      default: () => ({}),
    },
    isReplayableItem: {
      type: Function as PropType<(item: ToolCallGroupItem) => boolean>,
      default: undefined,
    },
    sessions: {
      type: Array as PropType<SessionMeta[]>,
      default: () => [],
    },
    activeSessionId: {
      type: String as PropType<string | null>,
      default: null,
    },
    isSessionLoading: {
      type: Boolean,
      default: false,
    },
    isHydrating: {
      type: Boolean,
      default: false,
    },
    loadError: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'send',
    'abort',
    'selectModel',
    'acceptBatch',
    'rejectBatch',
    'retry',
    'reapplyItem',
    'reapplyGroup',
    'reapplyBatch',
    'switchSession',
    'createSession',
    'deleteSession',
    'renameSession',
    'retryLoad',
  ],
  setup(props, { emit }) {
    const store = useAgentStore()
    const bubbles = useAgentStoreSelector(agentStoreSelectors.bubbles)
    const status = useAgentStoreSelector(agentStoreSelectors.status)
    const reviewState = useAgentStoreSelector(agentStoreSelectors.reviewState)
    const pinnedSelection = useAgentStoreSelector(
      agentStoreSelectors.pinnedSelection,
    )

    const isRunning = computed(
      () => status.value !== 'idle' && status.value !== 'done',
    )
    const hasModel = computed(() => props.selectedModel !== null)

    function getBatch(batchId: string): ReviewBatch | undefined {
      return reviewState.value?.batches.find(
        (b: ReviewBatch) => b.id === batchId,
      )
    }

    function handleSend(message: string) {
      store.getState().addBubble({ type: 'user', content: message })
      emit('send', message)
    }

    return () => (
      <div class="flex h-full min-h-0 flex-col overflow-hidden text-sm">
        <SessionHeader
          sessions={props.sessions}
          activeSessionId={props.activeSessionId}
          isLoading={props.isSessionLoading}
          loadError={props.loadError}
          onSwitchSession={(id: string) => emit('switchSession', id)}
          onCreateSession={() => emit('createSession')}
          onDeleteSession={(id: string) => emit('deleteSession', id)}
          onRenameSession={(id: string, title: string) =>
            emit('renameSession', id, title)
          }
          onRetry={() => emit('retryLoad')}
        />
        {props.isHydrating ? (
          <div class="flex flex-1 items-center justify-center">
            <NSpin size="small" />
          </div>
        ) : (
          <>
            <ChatMessageList
              bubbles={bubbles.value}
              getBatch={getBatch}
              replayState={props.replayState}
              isReplayableItem={props.isReplayableItem}
              onAcceptBatch={(id: string) => emit('acceptBatch', id)}
              onRejectBatch={(id: string) => emit('rejectBatch', id)}
              onReapplyItem={(itemId: string, item: ToolCallGroupItem) =>
                emit('reapplyItem', itemId, item)
              }
              onReapplyGroup={(groupId: string, items: ToolCallGroupItem[]) =>
                emit('reapplyGroup', groupId, items)
              }
              onReapplyBatch={(batchId: string) =>
                emit('reapplyBatch', batchId)
              }
              onRetry={() => emit('retry')}
            />
            <ChatInput
              disabled={!hasModel.value}
              isRunning={isRunning.value}
              pinnedSelection={pinnedSelection.value}
              status={status.value}
              onSend={handleSend}
              onAbort={() => emit('abort')}
              onDismissSelection={() => store.getState().clearPinnedSelection()}
            >
              {{
                modelSelector: () => (
                  <ModelSelector
                    providerGroups={props.providerGroups}
                    selectedModel={props.selectedModel}
                    onSelectModel={(model: SelectedModel) =>
                      emit('selectModel', model)
                    }
                  />
                ),
              }}
            </ChatInput>
          </>
        )}
      </div>
    )
  },
})
