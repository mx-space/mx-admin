import { computed, shallowRef } from 'vue'
import type {
  AgentStore,
  ChatBubble,
  LLMProvider,
  TransportAdapter,
} from '@haklex/rich-agent-core'
import type { Ref } from 'vue'

import { createAgentStore, createProvider } from '@haklex/rich-agent-core'

import { API_URL } from '~/constants/env'

export interface ProviderGroup {
  id: string
  name: string
  providerType: 'claude' | 'openai-compatible'
  models: { id: string; displayName: string }[]
}

export interface SelectedModel {
  modelId: string
  providerId: string
  providerType: 'claude' | 'openai-compatible'
}

function createAdminTransport(providerId: string): TransportAdapter {
  return async (messages, tools, model, signal) => {
    return fetch(`${API_URL}/ai/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ model, messages, tools, providerId }),
      signal,
    })
  }
}

function mapProviderType(type: string): 'claude' | 'openai-compatible' {
  if (type === 'anthropic' || type === 'claude') return 'claude'
  return 'openai-compatible'
}

interface UseAgentSetupOptions {
  providerGroups: Ref<ProviderGroup[]>
  selectedModel: Ref<SelectedModel | null>
  initialBubbles?: ChatBubble[]
}

export function useAgentSetup(options: UseAgentSetupOptions) {
  const store: AgentStore = createAgentStore(options.initialBubbles)
  const abortController = shallowRef<AbortController | null>(null)

  const provider = computed<LLMProvider | null>(() => {
    const model = options.selectedModel.value
    if (!model) return null
    const group = options.providerGroups.value.find(
      (g) => g.id === model.providerId,
    )
    if (!group) return null
    const transport = createAdminTransport(model.providerId)
    return createProvider({
      model: model.modelId,
      transport,
      providerType: mapProviderType(group.providerType),
    })
  })

  function abort() {
    abortController.value?.abort()
    store.getState().setStatus('idle')
  }

  function retry(): string | null {
    const bubbles = store.getState().bubbles
    const last = [...bubbles].reverse().find((b) => b.type === 'user')
    if (last && last.type === 'user') {
      return last.content
    }
    return null
  }

  return {
    store,
    provider,
    abortController,
    abort,
    retry,
  }
}
