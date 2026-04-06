import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createElement, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { $getRoot, $getState, $parseSerializedNode } from 'lexical'
import {
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
  AgentStore,
  ChatBubble,
  LLMProvider,
} from '@haklex/rich-agent-core'
import type { RichEditorVariant } from '@haklex/rich-editor'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type {
  Klass,
  LexicalEditor,
  LexicalNode,
  SerializedEditorState,
} from 'lexical'
import type { Root } from 'react-dom/client'
import type { PropType, Ref } from 'vue'

import { blockIdState } from '@haklex/rich-editor'
import {
  DiffReviewOverlayPlugin,
  useAgentLoop,
} from '@haklex/rich-ext-ai-agent'
import { NestedDocPlugin } from '@haklex/rich-ext-nested-doc'
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'

import '@haklex/rich-ext-ai-agent/style.css'
import '@haklex/rich-kit-shiro/style.css'
import '@haklex/rich-plugin-toolbar/style.css'
import '@haklex/rich-ext-nested-doc/style.css'

import { useUIStore } from '~/stores/ui'

import { AgentChatPanel } from './agent-chat/AgentChatPanel'
import { createContextAwareEngine } from './agent-chat/composables/context-aware-engine'
import { useAgentSetup } from './agent-chat/composables/use-agent-loop'
import { useReapply } from './agent-chat/composables/use-agent-reapply'
import { provideAgentStore } from './agent-chat/composables/use-agent-store'
import { useSessionManager } from './agent-chat/composables/use-session-manager'
import { buildShiroEditorProps } from './build-shiro-editor-props'
import { createShiroEditorBridgeElement } from './shiro-editor-bridge'

type EditorRef = { current: LexicalEditor | null }

function $findBlockByBlockId(blockId: string): LexicalNode | null {
  const root = $getRoot()
  for (const child of root.getChildren()) {
    if ($getState(child, blockIdState) === blockId) {
      return child
    }
  }
  return null
}

// Tool calls emit serialized nodes whose `$.blockId` was guessed by the LLM.
// `$parseSerializedNode` would register that value under an anonymous StateConfig,
// and then BlockIdPlugin re-setting the real blockIdState triggers a
// "State key collision 'blockId'" error. Strip it and let the plugin re-assign.
function stripBlockIdFromSerialized<
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
    next.children = next.children.map((c) =>
      stripBlockIdFromSerialized(c as any),
    )
  }
  return next
}

// React component that captures the agent loop and editor refs
function AgentLoopCapture({
  editorRef,
  onAgentLoopReady,
  provider,
  store,
}: {
  editorRef: EditorRef
  onAgentLoopReady: (loop: ReturnType<typeof useAgentLoop> | null) => void
  provider: LLMProvider | null
  store: AgentStore
}) {
  if (!provider) {
    onAgentLoopReady(null)
    return null
  }
  return createElement(AgentLoopCaptureInner, {
    editorRef,
    onAgentLoopReady,
    provider,
    store,
  })
}

function AgentLoopCaptureInner({
  editorRef,
  onAgentLoopReady,
  provider,
  store,
}: {
  editorRef: EditorRef
  onAgentLoopReady: (loop: ReturnType<typeof useAgentLoop>) => void
  provider: LLMProvider
  store: AgentStore
}) {
  const messageEngine = useMemo(() => createContextAwareEngine(store), [store])
  const loop = useAgentLoop({
    provider,
    store,
    messageEngine: messageEngine as any,
  })
  onAgentLoopReady(loop)

  const [editor] = useLexicalComposerContext()
  editorRef.current = editor

  return null
}

// React-side editor pane rendered via createRoot
function ReactEditorPane({
  editorProps,
  store,
  provider,
  onChange,
  onSubmit,
  onEditorReady,
  onAgentLoopReady,
}: {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  store: AgentStore
  provider: LLMProvider | null
  onChange?: ShiroEditorProps['onChange']
  onSubmit?: ShiroEditorProps['onSubmit']
  onEditorReady?: (editor: LexicalEditor | null) => void
  onAgentLoopReady: (loop: ReturnType<typeof useAgentLoop> | null) => void
}) {
  const editorRef: EditorRef = { current: null }

  const handleEditorReady = (editor: LexicalEditor | null) => {
    editorRef.current = editor
    onEditorReady?.(editor)
  }

  return createShiroEditorBridgeElement({
    editorProps,
    onChange,
    onSubmit,
    onEditorReady: handleEditorReady,
    children: [
      createElement(DiffReviewOverlayPlugin, { store }),
      createElement(AgentLoopCapture, {
        editorRef,
        onAgentLoopReady,
        provider,
        store,
      }),
      createElement(NestedDocPlugin),
    ],
  })
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
    imageUpload: Function as PropType<ShiroEditorProps['imageUpload']>,
    agentVisible: { type: Boolean, default: false },
    providerGroups: Array as PropType<ProviderGroup[]>,
    selectedModel: Object as PropType<SelectedModel | null>,
    onSelectModel: Function as PropType<(model: SelectedModel) => void>,
    initialBubbles: Array as PropType<ChatBubble[]>,
    refId: String,
    refType: String as PropType<'post' | 'note' | 'page'>,
  },
  emits: {
    change: (_value: SerializedEditorState) => true,
    textChange: (_text: string) => true,
    submit: () => true,
    editorReady: (_editor: LexicalEditor | null) => true,
  },
  setup(props, { emit, expose }) {
    const editorContainerRef = ref<HTMLDivElement | null>(null)
    let reactRoot: Root | null = null
    let editorInstance: LexicalEditor | null = null
    let agentLoop: ReturnType<typeof useAgentLoop> | null = null
    let unmounting = false

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

    const sessionManager = useSessionManager({
      store,
      refId: toRef(props, 'refId') as Ref<string | undefined>,
      refType: props.refType ?? 'post',
      getModel: () => props.selectedModel?.modelId ?? '',
      getProviderId: () => props.selectedModel?.providerId ?? '',
      abortFn: realAbort,
    })

    const handleChange = (value: SerializedEditorState) => {
      if (unmounting) return
      emit('change', value)
      if (editorInstance) {
        editorInstance.read(() => {
          emit('textChange', $convertToMarkdownString(TRANSFORMERS))
        })
      }
    }

    const handleSubmit = () => emit('submit')

    const handleEditorReady = (editor: LexicalEditor | null) => {
      editorInstance = editor
      emit('editorReady', editor)
      if (editor) {
        editor.read(() => {
          emit('textChange', $convertToMarkdownString(TRANSFORMERS))
        })
      }
    }

    const handleAgentLoopReady = (
      loop: ReturnType<typeof useAgentLoop> | null,
    ) => {
      agentLoop = loop
    }

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

      const editor = editorInstance
      editor.update(() => {
        const root = $getRoot()
        const lastInserted = new Map<string, LexicalNode>()
        for (const entry of batch.entries) {
          const { op } = entry
          if (op.op === 'insert') {
            if (!op.node?.type) continue
            const newNode = $parseSerializedNode(
              stripBlockIdFromSerialized(op.node),
            )
            if (op.position.type === 'root') {
              const idx = op.position.index ?? root.getChildrenSize()
              const children = root.getChildren()
              if (idx >= children.length) root.append(newNode)
              else children[idx].insertBefore(newNode)
            } else {
              const anchorKey = `${op.position.type}:${op.position.blockId}`
              const prev = lastInserted.get(anchorKey)
              if (prev) {
                prev.insertAfter(newNode)
              } else {
                const target = $findBlockByBlockId(op.position.blockId)
                if (!target) continue
                if (op.position.type === 'after') target.insertAfter(newNode)
                else target.insertBefore(newNode)
              }
              lastInserted.set(anchorKey, newNode)
            }
          } else if (op.op === 'replace') {
            if (!op.node?.type) continue
            const target = $findBlockByBlockId(op.blockId)
            if (!target) continue
            target.replace(
              $parseSerializedNode(stripBlockIdFromSerialized(op.node)),
            )
          } else if (op.op === 'delete') {
            const target = $findBlockByBlockId(op.blockId)
            if (!target) continue
            target.remove()
          }
        }
      })
    }

    const handleRejectBatch = (batchId: string) => {
      store.getState().rejectReviewBatch(batchId)
    }

    const renderReact = (resolvedTheme: 'dark' | 'light') => {
      if (!reactRoot) return
      const editorProps = buildShiroEditorProps(resolvedTheme, {
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
      })

      reactRoot.render(
        createElement(ReactEditorPane, {
          editorProps,
          store,
          provider: provider.value,
          onChange: handleChange,
          onSubmit: handleSubmit,
          onEditorReady: handleEditorReady,
          onAgentLoopReady: handleAgentLoopReady,
        }),
      )
    }

    onMounted(() => {
      reactRoot = createRoot(editorContainerRef.value!)

      const uiStore = useUIStore()
      const resolveTheme = () =>
        props.theme ?? (uiStore.isDark ? 'dark' : 'light')

      renderReact(resolveTheme())

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
        ],
        () => renderReact(resolveTheme()),
      )
    })

    onBeforeUnmount(() => {
      unmounting = true
      reactRoot?.unmount()
      reactRoot = null
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
