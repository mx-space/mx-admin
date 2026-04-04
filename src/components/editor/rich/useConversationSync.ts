import { useEffect, useRef } from 'react'
import type { AgentStore, ChatBubble } from '@haklex/rich-agent-core'

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
  const conversationIdRef = useRef<string | null>(null)
  const lastSyncedLengthRef = useRef(0)
  const pendingRef = useRef(false)

  useEffect(() => {
    if (!refId) return

    loadConversation(refId, refType)
      .then((conv) => {
        if (conv) {
          conversationIdRef.current = conv.id
          if (store.getState().bubbles.length === 0 && conv.messages?.length) {
            lastSyncedLengthRef.current = conv.messages.length
          }
        }
      })
      .catch(() => {})

    const unsubscribe = store.subscribe((state) => {
      if (state.bubbles.length <= lastSyncedLengthRef.current) return
      if (pendingRef.current) return

      const newBubbles = state.bubbles.slice(lastSyncedLengthRef.current)
      lastSyncedLengthRef.current = state.bubbles.length

      appendBubbles(
        newBubbles,
        refId,
        refType,
        model,
        providerId,
        conversationIdRef,
      )
    })

    return unsubscribe
  }, [store, refId, refType, model, providerId])
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

async function appendBubbles(
  bubbles: ChatBubble[],
  refId: string,
  refType: string,
  model: string,
  providerId: string,
  conversationIdRef: React.RefObject<string | null>,
) {
  const messages = bubbles as unknown as Record<string, unknown>[]

  if (!conversationIdRef.current) {
    try {
      const res = await fetch(`${API_URL}/ai/agent/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refId, refType, model, providerId, messages }),
      })
      if (res.ok) {
        const conv = await res.json()
        conversationIdRef.current = conv.id
      }
    } catch {
      // Silent fail — conversation sync is best-effort
    }
    return
  }

  try {
    await fetch(
      `${API_URL}/ai/agent/conversations/${conversationIdRef.current}/messages`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages }),
      },
    )
  } catch {
    // Silent fail
  }
}
