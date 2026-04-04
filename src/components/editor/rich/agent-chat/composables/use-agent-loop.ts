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

function extractSseErrorMessage(buffer: string): string {
  const match = buffer.match(/data:\s*(\{[\s\S]*?\})\s*(?:\n|$)/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as { message?: string }
      if (parsed.message) return parsed.message
    } catch {
      // fall through
    }
  }
  return buffer.slice(0, 500) || 'Unknown SSE error'
}

function createAdminTransport(providerId: string): TransportAdapter {
  return async (messages, tools, model, signal) => {
    const response = await fetch(`${API_URL}/ai/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ model, messages, tools, providerId }),
      signal,
    })

    if (!response.ok || !response.body) return response

    // The backend may emit `event: error\ndata: {...}` as a custom SSE frame
    // which the upstream OpenAI SSE parser silently drops. Peek the first chunk
    // and surface the error as a thrown exception so the agent loop can show it.
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const first = await reader.read()

    if (first.done) {
      reader.releaseLock()
      return new Response(new ReadableStream(), {
        status: response.status,
        headers: response.headers,
      })
    }

    const firstText = decoder.decode(first.value, { stream: true })

    if (/(^|\n)event:\s*error/.test(firstText)) {
      let buffer = firstText
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
      }
      reader.releaseLock()
      throw new Error(extractSseErrorMessage(buffer))
    }

    // Non-error: rebuild a Response with the peeked chunk re-emitted first.
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(first.value)
      },
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) {
            controller.close()
            return
          }
          // Also detect mid-stream error events and surface them.
          const text = decoder.decode(value, { stream: true })
          if (/(^|\n)event:\s*error/.test(text)) {
            let buffer = text
            while (true) {
              const { done: d, value: v } = await reader.read()
              if (d) break
              buffer += decoder.decode(v, { stream: true })
            }
            controller.error(new Error(extractSseErrorMessage(buffer)))
            return
          }
          controller.enqueue(value)
        } catch (err) {
          controller.error(err)
        }
      },
      cancel(reason) {
        reader.cancel(reason).catch(() => {})
      },
    })

    return new Response(stream, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
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
