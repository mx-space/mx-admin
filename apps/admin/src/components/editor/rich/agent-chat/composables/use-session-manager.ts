import { onUnmounted, ref, watch } from 'vue'
import type {
  AgentStore,
  ChatBubble,
  DiffState,
  ReviewState,
} from '@haklex/rich-agent-core'
import type { AgentConversation } from '~/api/ai-agent'
import type { Ref } from 'vue'

import { aiAgentApi } from '~/api/ai-agent'

export interface SessionMeta {
  id: string
  title?: string
  updated: string
  messageCount: number
}

interface SessionManagerOptions {
  store: AgentStore
  refId: Ref<string | undefined>
  refType: 'post' | 'note' | 'page'
  getModel: () => string
  getProviderId: () => string
  abortFn: () => void
}

function toSessionMeta(conv: AgentConversation): SessionMeta {
  return {
    id: conv.id,
    title: conv.title,
    updated: conv.updated,
    messageCount: conv.messageCount ?? conv.messages?.length ?? 0,
  }
}

export function useSessionManager(options: SessionManagerOptions) {
  const { store, refId, refType, getModel, getProviderId, abortFn } = options

  const sessions = ref<SessionMeta[]>([])
  const activeSessionId = ref<string | null>(null)
  const isHydrating = ref(false)
  const isLoading = ref(false)
  const loadError = ref(false)
  const isPendingCreation = ref(false)

  let sessionEpoch = 0
  let pendingSync: { sessionId: string; cancel: () => void } | null = null
  let diffSyncTimer: ReturnType<typeof setTimeout> | null = null
  let titlePollTimer: ReturnType<typeof setTimeout> | null = null

  async function loadSessions() {
    const id = refId.value
    if (!id) return

    isLoading.value = true
    loadError.value = false
    try {
      const list = await aiAgentApi.listConversations(id, refType)
      const normalized = Array.isArray(list)
        ? list
        : ((list as any)?.data ?? [])
      sessions.value = normalized.map(toSessionMeta)

      if (sessions.value.length > 0 && !activeSessionId.value) {
        await switchSession(sessions.value[0].id)
      }
    } catch {
      sessions.value = []
      loadError.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function switchSession(id: string) {
    flushPendingSync()

    const epoch = ++sessionEpoch

    abortFn()
    isHydrating.value = true
    activeSessionId.value = id
    isPendingCreation.value = false
    store.getState().reset()

    try {
      const detail = await aiAgentApi.getConversation(id)
      if (epoch !== sessionEpoch) return

      const rawMessages = detail.messages ?? []
      const validBubbles = rawMessages
        .filter((m): m is Record<string, unknown> => {
          const t = m.type ?? m.role
          return typeof t === 'string' && t.length > 0
        })
        .map((m) => {
          const bubble = { ...m } as Record<string, unknown>
          if ('streaming' in bubble) bubble.streaming = false
          if ('isStreaming' in bubble) bubble.isStreaming = false
          return bubble as unknown as ChatBubble
        })

      store.setState({ bubbles: validBubbles, status: 'idle' } as any)

      if (detail.reviewState) {
        store
          .getState()
          .setReviewState(detail.reviewState as unknown as ReviewState)
      }
      if (detail.diffState) {
        store.getState().setDiffState(detail.diffState as unknown as DiffState)
      }

      const meta = sessions.value.find((s) => s.id === id)
      if (meta) {
        meta.title = detail.title
        meta.messageCount = validBubbles.length
      }
    } catch {
      store.setState({ bubbles: [], status: 'idle' } as any)
    } finally {
      if (epoch === sessionEpoch) {
        isHydrating.value = false
      }
    }
  }

  function createSession() {
    flushPendingSync()
    abortFn()
    store.getState().reset()
    activeSessionId.value = null
    isPendingCreation.value = true
    sessionEpoch++
  }

  async function deleteSession(id: string) {
    if (activeSessionId.value === id) {
      flushPendingSync()
    }

    try {
      await aiAgentApi.deleteConversation(id)
    } catch {
      return
    }

    sessions.value = sessions.value.filter((s) => s.id !== id)

    if (activeSessionId.value === id) {
      if (sessions.value.length > 0) {
        await switchSession(sessions.value[0].id)
      } else {
        activeSessionId.value = null
        isPendingCreation.value = false
        store.getState().reset()
        sessionEpoch++
      }
    }
  }

  async function renameSession(id: string, title: string) {
    try {
      await aiAgentApi.updateConversation(id, { title })
      const meta = sessions.value.find((s) => s.id === id)
      if (meta) meta.title = title
    } catch {}
  }

  function syncMessages(sessionId: string) {
    const bubbles = store.getState().bubbles
    if (bubbles.length === 0) return
    const messages = bubbles as unknown as Record<string, unknown>[]
    aiAgentApi
      .replaceMessages(sessionId, messages)
      .then(() => {
        const meta = sessions.value.find((s) => s.id === sessionId)
        if (meta && !meta.title && !titlePollTimer) {
          titlePollTimer = setTimeout(() => {
            titlePollTimer = null
            loadSessions()
          }, 6000)
        }
      })
      .catch(() => {})
  }

  function scheduleSyncMessages() {
    const capturedId = activeSessionId.value
    if (!capturedId) return

    pendingSync?.cancel()
    const timer = setTimeout(() => {
      if (activeSessionId.value === capturedId) {
        syncMessages(capturedId)
      }
      pendingSync = null
    }, 2000)
    pendingSync = {
      sessionId: capturedId,
      cancel: () => clearTimeout(timer),
    }
  }

  function flushPendingSync() {
    if (pendingSync) {
      const { sessionId, cancel } = pendingSync
      cancel()
      syncMessages(sessionId)
      pendingSync = null
    }
  }

  function scheduleDiffSync() {
    if (diffSyncTimer) clearTimeout(diffSyncTimer)
    const capturedId = activeSessionId.value
    if (!capturedId) return
    diffSyncTimer = setTimeout(() => {
      if (activeSessionId.value !== capturedId) return
      const state = store.getState()
      aiAgentApi
        .updateConversation(capturedId, {
          reviewState:
            (state.reviewState as unknown as Record<string, unknown>) ?? null,
          diffState:
            (state.diffState as unknown as Record<string, unknown>) ?? null,
        })
        .catch(() => {})
    }, 2000)
  }

  const unsubscribe = store.subscribe((state) => {
    if (isHydrating.value) return

    const currentBubbles = state.bubbles
    if (currentBubbles.length === 0) return

    const rid = refId.value
    if (!rid) return

    const epoch = sessionEpoch

    if (!activeSessionId.value && isPendingCreation.value) {
      isPendingCreation.value = false
      const messages = currentBubbles as unknown as Record<string, unknown>[]
      aiAgentApi
        .createConversation({
          refId: rid,
          refType,
          model: getModel(),
          providerId: getProviderId(),
          messages,
        })
        .then((conv) => {
          if (epoch !== sessionEpoch) return
          activeSessionId.value = conv.id
          sessions.value.unshift(toSessionMeta(conv))
          setTimeout(() => loadSessions(), 5000)
        })
        .catch(() => {})
      return
    }

    if (!activeSessionId.value && !isPendingCreation.value) {
      isPendingCreation.value = true
      const messages = currentBubbles as unknown as Record<string, unknown>[]
      aiAgentApi
        .createConversation({
          refId: rid,
          refType,
          model: getModel(),
          providerId: getProviderId(),
          messages,
        })
        .then((conv) => {
          if (epoch !== sessionEpoch) return
          activeSessionId.value = conv.id
          isPendingCreation.value = false
          sessions.value.unshift(toSessionMeta(conv))
          setTimeout(() => loadSessions(), 5000)
        })
        .catch(() => {
          isPendingCreation.value = false
        })
      return
    }

    if (activeSessionId.value) {
      scheduleSyncMessages()
    }

    scheduleDiffSync()
  })

  onUnmounted(() => {
    flushPendingSync()
    unsubscribe()
    if (diffSyncTimer) clearTimeout(diffSyncTimer)
    if (titlePollTimer) clearTimeout(titlePollTimer)
  })

  watch(
    refId,
    (newId, oldId) => {
      if (newId === oldId) return
      if (oldId) {
        flushPendingSync()
        sessions.value = []
        activeSessionId.value = null
        isPendingCreation.value = false
        store.getState().reset()
        sessionEpoch++
      }
      if (newId) {
        loadSessions()
      }
    },
    { immediate: true },
  )

  return {
    sessions,
    activeSessionId,
    isHydrating,
    isLoading,
    loadError,
    loadSessions,
    switchSession,
    createSession,
    deleteSession,
    renameSession,
  }
}
