import { computed, defineComponent } from 'vue'
import type { AgentStore, ReviewBatch } from '@haklex/rich-agent-core'
import type { PropType } from 'vue'
import type { ProviderGroup, SelectedModel } from './ModelSelector'

import { agentStoreSelectors } from '@haklex/rich-agent-core'

import { ChatInput } from './ChatInput'
import { ChatMessageList } from './ChatMessageList'
import {
  provideAgentStore,
  useAgentStoreSelector,
} from './composables/use-agent-store'
import { ModelSelector } from './ModelSelector'

export const AgentChatPanel = defineComponent({
  name: 'AgentChatPanel',
  props: {
    store: { type: Object as PropType<AgentStore>, required: true },
    providerGroups: {
      type: Array as PropType<ProviderGroup[]>,
      required: true,
    },
    selectedModel: {
      type: Object as PropType<SelectedModel | null>,
      default: null,
    },
  },
  emits: [
    'send',
    'abort',
    'selectModel',
    'acceptBatch',
    'rejectBatch',
    'retry',
  ],
  setup(props, { emit }) {
    provideAgentStore(props.store)

    const bubbles = useAgentStoreSelector(agentStoreSelectors.bubbles)
    const status = useAgentStoreSelector(agentStoreSelectors.status)
    const reviewState = useAgentStoreSelector(agentStoreSelectors.reviewState)

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
      props.store.getState().addBubble({ type: 'user', content: message })
      emit('send', message)
    }

    return () => (
      <div class="flex h-full min-h-0 flex-col overflow-hidden text-sm">
        <ChatMessageList
          bubbles={bubbles.value}
          getBatch={getBatch}
          onAcceptBatch={(id: string) => emit('acceptBatch', id)}
          onRejectBatch={(id: string) => emit('rejectBatch', id)}
          onRetry={() => emit('retry')}
        />
        <ChatInput
          disabled={!hasModel.value}
          isRunning={isRunning.value}
          status={status.value}
          onSend={handleSend}
          onAbort={() => emit('abort')}
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
      </div>
    )
  },
})
