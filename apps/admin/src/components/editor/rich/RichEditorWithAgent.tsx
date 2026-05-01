import {
  applyAgentReviewBatch,
  mountRichEditorWithAgent,
} from '@mx-admin/rich-react'
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  Teleport,
  toRef,
  watch,
} from 'vue'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type {
  AgentToolConfig,
  ChatBubble,
  ChatMessage,
} from '@haklex/rich-agent-core'
import type { RichEditorVariant } from '@haklex/rich-editor'
import type {
  AgentLoopHandle,
  ImageUpload,
  RichEditorWithAgentHandle,
} from '@mx-admin/rich-react'
import type {
  Klass,
  LexicalEditor,
  LexicalNode,
  SerializedEditorState,
} from 'lexical'
import type { PropType, Ref } from 'vue'
import type { MetaFieldsSchema } from './agent-chat/composables/use-meta-tools'

import { filesApi } from '~/api/files'
import { API_URL } from '~/constants/env'
import { useUIStore } from '~/stores/ui'

import { AgentChatPanel } from './agent-chat/AgentChatPanel'
import { useAgentSetup } from './agent-chat/composables/use-agent-loop'
import { useReapply } from './agent-chat/composables/use-agent-reapply'
import { provideAgentStore } from './agent-chat/composables/use-agent-store'
import {
  buildMetaSystemMessages,
  buildMetaTools,
} from './agent-chat/composables/use-meta-tools'
import { useSessionManager } from './agent-chat/composables/use-session-manager'

async function saveExcalidrawSnapshot(
  snapshot: object,
  existingRef?: string,
): Promise<string> {
  const blob = new Blob([JSON.stringify(snapshot)], {
    type: 'application/json',
  })
  const file = new File([blob], 'snapshot.excalidraw', {
    type: 'application/json',
  })

  if (existingRef?.startsWith('ref:file/')) {
    const name = existingRef.slice(9)
    const result = await filesApi.update('file', name, file)
    return `ref:file/${result.name}`
  }

  const result = await filesApi.upload(file, 'file')
  return `ref:file/${result.name}`
}

export const RichEditorWithAgent = defineComponent({
  name: 'RichEditorWithAgent',
  props: {
    initialValue: Object as PropType<SerializedEditorState>,
    theme: String as PropType<'dark' | 'light'>,
    placeholder: String,
    variant: String as PropType<RichEditorVariant>,
    autoFocus: { type: Boolean, default: undefined },
    className: String,
    contentClassName: String,
    debounceMs: Number,
    selfHostnames: Array as PropType<string[]>,
    extraNodes: Array as PropType<Array<Klass<LexicalNode>>>,
    editorStyle: Object as PropType<Record<string, string | number>>,
    imageUpload: Function as PropType<ImageUpload>,
    agentVisible: { type: Boolean, default: false },
    providerGroups: Array as PropType<ProviderGroup[]>,
    selectedModel: Object as PropType<SelectedModel | null>,
    onSelectModel: Function as PropType<(model: SelectedModel) => void>,
    initialBubbles: Array as PropType<ChatBubble[]>,
    refId: String,
    refType: String as PropType<'post' | 'note' | 'page'>,
    metaFieldsSchema: Object as PropType<MetaFieldsSchema>,
    getMetaFields: Function as PropType<() => Record<string, unknown>>,
    onMetaFieldsUpdate: Function as PropType<
      (updates: Record<string, unknown>) => void | Promise<void>
    >,
  },
  emits: {
    change: (_value: SerializedEditorState) => true,
    textChange: (_text: string) => true,
    submit: () => true,
    editorReady: (_editor: LexicalEditor | null) => true,
  },
  setup(props, { emit, expose }) {
    const editorContainerRef = ref<HTMLDivElement>()
    let handle: RichEditorWithAgentHandle | null = null
    let editorInstance: LexicalEditor | null = null
    let agentLoop: AgentLoopHandle | null = null

    const { store, provider, abort, retry } = useAgentSetup({
      providerGroups: toRef(props, 'providerGroups') as any,
      selectedModel: toRef(props, 'selectedModel') as any,
      initialBubbles: props.initialBubbles,
    })
    provideAgentStore(store)

    function realAbort() {
      if (agentLoop) {
        agentLoop.abort()
      }
      abort()
    }

    const reapply = useReapply({
      getEditor: () => editorInstance,
      getReviewBatch: (batchId: string) => {
        const reviewState = store.getState().reviewState
        return reviewState?.batches.find(
          (b: { id: string }) => b.id === batchId,
        )
      },
    })

    const metaTools = computed<AgentToolConfig[] | undefined>(() => {
      if (!props.metaFieldsSchema) return undefined
      return buildMetaTools({
        schema: props.metaFieldsSchema,
        getFields: () => props.getMetaFields?.() ?? {},
        setFields: (updates) => props.onMetaFieldsUpdate?.(updates),
      })
    })

    const metaSystemMessages = computed<ChatMessage[] | undefined>(() => {
      if (!props.metaFieldsSchema) return undefined
      return buildMetaSystemMessages(props.metaFieldsSchema)
    })

    const sessionManager = useSessionManager({
      store,
      refId: toRef(props, 'refId') as Ref<string | undefined>,
      refType: props.refType ?? 'post',
      getModel: () => props.selectedModel?.modelId ?? '',
      getProviderId: () => props.selectedModel?.providerId ?? '',
      abortFn: realAbort,
    })

    const buildOptions = (resolvedTheme: 'dark' | 'light') => ({
      theme: resolvedTheme,
      initialValue: props.initialValue,
      placeholder: props.placeholder,
      variant: props.variant,
      autoFocus: props.autoFocus,
      className: props.className,
      contentClassName: props.contentClassName,
      debounceMs: props.debounceMs,
      selfHostnames: props.selfHostnames,
      extraNodes: props.extraNodes,
      editorStyle: props.editorStyle,
      imageUpload: props.imageUpload,
      store,
      provider: provider.value,
      tools: metaTools.value,
      systemMessages: metaSystemMessages.value,
      saveExcalidrawSnapshot,
      apiUrl: API_URL,
      onChange: (v: SerializedEditorState) => emit('change', v),
      onSubmit: () => emit('submit'),
      onEditorReady: (editor: LexicalEditor | null) => {
        editorInstance = editor
        emit('editorReady', editor)
      },
      onAgentLoopReady: (loop: AgentLoopHandle | null) => {
        agentLoop = loop
      },
      onTextChange: (text: string) => emit('textChange', text),
    })

    const handleSend = (message: string) => {
      if (!agentLoop) return
      agentLoop.run(message).catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return
        const msg = err instanceof Error ? err.message : String(err)
        store.getState().addBubble({ type: 'error', message: msg })
        store.getState().setStatus('idle')
      })
    }

    const handleAbort = () => realAbort()

    const handleRetry = () => {
      const msg = retry()
      if (msg) handleSend(msg)
    }

    const handleAcceptBatch = (batchId: string) => {
      store.getState().acceptReviewBatch(batchId)
      const reviewState = store.getState().reviewState
      const batch = reviewState?.batches.find(
        (b: { id: string }) => b.id === batchId,
      )
      if (!batch || !editorInstance) return
      applyAgentReviewBatch(editorInstance, batch)
    }

    const handleRejectBatch = (batchId: string) => {
      store.getState().rejectReviewBatch(batchId)
    }

    onMounted(() => {
      if (!editorContainerRef.value) return
      const uiStore = useUIStore()
      const resolveTheme = () =>
        props.theme ?? (uiStore.isDark ? 'dark' : 'light')

      handle = mountRichEditorWithAgent(
        editorContainerRef.value,
        buildOptions(resolveTheme()),
      )

      watch(
        () => [
          props.theme,
          uiStore.isDark,
          props.placeholder,
          props.variant,
          props.autoFocus,
          props.className,
          props.contentClassName,
          props.debounceMs,
          props.selfHostnames,
          props.extraNodes,
          props.editorStyle,
          props.imageUpload,
          provider.value,
          props.providerGroups,
          props.selectedModel,
          props.metaFieldsSchema,
          props.getMetaFields,
          props.onMetaFieldsUpdate,
        ],
        () => handle?.update(buildOptions(resolveTheme())),
      )
    })

    onBeforeUnmount(() => {
      handle?.unmount()
      handle = null
      editorInstance = null
      agentLoop = null
    })

    expose({
      focus: () => editorInstance?.focus(),
    })

    return () => (
      <>
        <div class="h-full w-full" ref={editorContainerRef} />
        {props.agentVisible && (
          <Teleport to="#agent-chat-portal" defer>
            <AgentChatPanel
              providerGroups={props.providerGroups ?? []}
              selectedModel={props.selectedModel ?? null}
              replayState={reapply.state}
              isReplayableItem={reapply.isReplayableItem}
              sessions={sessionManager.sessions.value}
              activeSessionId={sessionManager.activeSessionId.value}
              isSessionLoading={sessionManager.isLoading.value}
              isHydrating={sessionManager.isHydrating.value}
              loadError={sessionManager.loadError.value}
              onSend={handleSend}
              onAbort={handleAbort}
              onRetry={handleRetry}
              onAcceptBatch={handleAcceptBatch}
              onRejectBatch={handleRejectBatch}
              onReapplyItem={(_itemId: string, item: any) =>
                reapply.applyReplayItem(item)
              }
              onReapplyGroup={(groupId: string, items: any[]) =>
                reapply.applyReplayGroup(groupId, items)
              }
              onReapplyBatch={(batchId: string) =>
                reapply.applyReplayBatch(batchId)
              }
              onSelectModel={(model: SelectedModel) =>
                props.onSelectModel?.(model)
              }
              onSwitchSession={(id: string) => sessionManager.switchSession(id)}
              onCreateSession={() => sessionManager.createSession()}
              onDeleteSession={(id: string) => sessionManager.deleteSession(id)}
              onRenameSession={(id: string, title: string) =>
                sessionManager.renameSession(id, title)
              }
              onRetryLoad={() => sessionManager.loadSessions()}
            />
          </Teleport>
        )}
      </>
    )
  },
})
