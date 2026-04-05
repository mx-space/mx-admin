import { computed, shallowRef } from 'vue'
import type {
  AgentOperation,
  AgentStore,
  AgentStoreSlice,
  ChatBubble,
  DiffState,
  LLMProvider,
  ReviewBatch,
  ReviewState,
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

function stripBlockIdFromSerializedNode<
  T extends { $?: Record<string, unknown>; children?: unknown[] },
>(node: T): T {
  if (!node || typeof node !== 'object') return node

  const next = { ...node } as T & {
    $?: Record<string, unknown>
    children?: unknown[]
  }

  if (next.$ && typeof next.$ === 'object') {
    const rest = { ...next.$ }
    delete rest.blockId
    if (Object.keys(rest).length === 0) delete next.$
    else next.$ = rest
  }

  if (Array.isArray(next.children)) {
    next.children = next.children.map((child) =>
      stripBlockIdFromSerializedNode(child as any),
    )
  }

  return next
}

function sanitizeReviewOperation(op: AgentOperation): AgentOperation {
  if (op.op === 'insert' || op.op === 'replace') {
    if (!op.node) return op
    return {
      ...op,
      node: stripBlockIdFromSerializedNode(op.node as any),
    }
  }

  return op
}

function sanitizeReviewBatch(batch: ReviewBatch): ReviewBatch {
  return {
    ...batch,
    entries: batch.entries.map((entry) => ({
      ...entry,
      op: sanitizeReviewOperation(entry.op),
    })),
  }
}

function sanitizeDiffState(diffState: DiffState | null): DiffState | null {
  if (!diffState) return diffState

  const entries = diffState.entries.map((entry) => ({
    ...entry,
    op: sanitizeReviewOperation(entry.op),
  }))

  return {
    ...diffState,
    entries,
    getByBlockId(blockId: string) {
      return entries.find((entry) => {
        if (entry.op.op === 'replace' || entry.op.op === 'delete') {
          return entry.op.blockId === blockId
        }
        if (entry.op.op === 'insert' && entry.op.position.type !== 'root') {
          return entry.op.position.blockId === blockId
        }
        return false
      })
    },
    getPending() {
      return entries.filter((entry) => entry.status === 'pending')
    },
  }
}

function sanitizeReviewState(
  reviewState: ReviewState | null,
): ReviewState | null {
  if (!reviewState) return reviewState

  return {
    ...reviewState,
    batches: reviewState.batches.map(sanitizeReviewBatch),
  }
}

function sanitizeStoreSlice(
  slice: Partial<AgentStoreSlice> | AgentStoreSlice,
): Partial<AgentStoreSlice> | AgentStoreSlice {
  const next = { ...slice }

  if ('diffState' in next) {
    next.diffState = sanitizeDiffState(next.diffState ?? null)
  }

  if ('reviewState' in next) {
    next.reviewState = sanitizeReviewState(next.reviewState ?? null)
  }

  return next
}

function patchReviewStateActions(store: AgentStore) {
  const state = store.getState()
  const setState = store.setState.bind(store)
  const addReviewBatch = state.addReviewBatch
  const setDiffState = state.setDiffState
  const setReviewState = state.setReviewState

  store.setState = ((partial, replace) => {
    if (typeof partial === 'function') {
      return setState(
        ((current) =>
          sanitizeStoreSlice(partial(current) as AgentStoreSlice)) as any,
        replace as any,
      )
    }

    return setState(
      sanitizeStoreSlice(partial as AgentStoreSlice),
      replace as any,
    )
  }) as typeof store.setState

  state.setDiffState = (diffState: DiffState | null) =>
    setDiffState(sanitizeDiffState(diffState))

  state.addReviewBatch = (batch: ReviewBatch) =>
    addReviewBatch(sanitizeReviewBatch(batch))

  state.setReviewState = (reviewState: ReviewState | null) =>
    setReviewState(sanitizeReviewState(reviewState))
}

interface UseAgentSetupOptions {
  providerGroups: Ref<ProviderGroup[]>
  selectedModel: Ref<SelectedModel | null>
  initialBubbles?: ChatBubble[]
}

export function useAgentSetup(options: UseAgentSetupOptions) {
  const store: AgentStore = createAgentStore(options.initialBubbles)
  patchReviewStateActions(store)
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
