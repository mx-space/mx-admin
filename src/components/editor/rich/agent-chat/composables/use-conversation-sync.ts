import type { AgentStore, ChatBubble } from '@haklex/rich-agent-core'
import { onUnmounted } from 'vue'

import { API_URL } from '~/constants/env'

interface ConversationSyncOptions {
  store: AgentStore
  refId: string | undefined
  refType: 'post' | 'note' | 'page'
  model: string
  providerId: string
}

export function useConversationSync({
  store,
  refId,
  refType,
  model,
  providerId,
}: ConversationSyncOptions) {
  let conversationId: string | null = null
  let lastSyncedLength = 0

  if (!refId) return

  loadConversation(refId, refType)
    .then((conv) => {
      if (conv) {
        conversationId = conv.id
        if (store.getState().bubbles.length === 0 && conv.messages?.length) {
          lastSyncedLength = conv.messages.length
        }
      }
    })
    .catch(() => {})

  const unsubscribe = store.subscribe((state) => {
    if (state.bubbles.length <= lastSyncedLength) return

    const newBubbles = state.bubbles.slice(lastSyncedLength)
    lastSyncedLength = state.bubbles.length

    appendBubbles(newBubbles, refId, refType, model, providerId)
  })

  onUnmounted(unsubscribe)

  async function appendBubbles(
    bubbles: ChatBubble[],
    refId: string,
    refType: string,
    model: string,
    providerId: string,
  ) {
    const messages = bubbles as unknown as Record<string, unknown>[]

    if (!conversationId) {
      try {
        const res = await fetch(`${API_URL}/ai/agent/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refId, refType, model, providerId, messages }),
        })
        if (res.ok) {
          const conv = await res.json()
          conversationId = conv.id
        }
      } catch {}
      return
    }

    try {
      await fetch(
        `${API_URL}/ai/agent/conversations/${conversationId}/messages`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ messages }),
        },
      )
    } catch {}
  }
}

async function loadConversation(refId: string, refType: string) {
  const res = await fetch(
    `${API_URL}/ai/agent/conversations?refId=${refId}&refType=${refType}`,
    { credentials: 'include' },
  )
  if (!res.ok) return null
  const list = await res.json()
  if (!list?.length) return null

  const detailRes = await fetch(
    `${API_URL}/ai/agent/conversations/${list[0].id}`,
    { credentials: 'include' },
  )
  if (!detailRes.ok) return null
  return detailRes.json()
}
