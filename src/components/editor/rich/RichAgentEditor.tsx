import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createElement, useCallback, useMemo, useRef } from 'react'
import { $getRoot, $getState, $parseSerializedNode } from 'lexical'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type {
  ChatBubble,
  LLMProvider,
  TransportAdapter,
} from '@haklex/rich-agent-core'
import type { NestedDocDialogEditorProps } from '@haklex/rich-ext-nested-doc'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type { LexicalEditor, LexicalNode } from 'lexical'
import type { ReactNode } from 'react'

import { ChatPanel } from '@haklex/rich-agent-chat'
import { createAgentStore, createProvider } from '@haklex/rich-agent-core'
import { getVariantClass } from '@haklex/rich-editor'
import { DialogStackProvider } from '@haklex/rich-editor-ui'
import { blockIdState } from '@haklex/rich-editor/plugins'
import {
  DiffReviewOverlayPlugin,
  useAgentLoop,
} from '@haklex/rich-ext-ai-agent'
import {
  NestedDocDialogEditorProvider,
  nestedDocEditNodes,
} from '@haklex/rich-ext-nested-doc'
import { ExcalidrawConfigProvider, ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'
import { PortalThemeProvider } from '@haklex/rich-style-token'

import { filesApi } from '~/api/files'
import { API_URL } from '~/constants/env'

import { useConversationSync } from './useConversationSync'

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

function $findBlockByBlockId(blockId: string): LexicalNode | null {
  const root = $getRoot()
  for (const child of root.getChildren()) {
    if ($getState(child, blockIdState) === blockId) {
      return child
    }
  }
  return null
}

const saveExcalidrawSnapshot = async (
  snapshot: object,
  existingRef?: string,
): Promise<string> => {
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

function NestedDocDialogEditor({
  initialValue,
  onEditorReady,
}: NestedDocDialogEditorProps) {
  return createElement(ShiroEditor, {
    initialValue,
    onEditorReady,
    extraNodes: nestedDocEditNodes,
    header: createElement(ToolbarPlugin),
  })
}

interface RichAgentEditorProps {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  editorChildren?: ReactNode
  onChange?: ShiroEditorProps['onChange']
  onSubmit?: ShiroEditorProps['onSubmit']
  onEditorReady?: (editor: LexicalEditor | null) => void
  providerGroups: ProviderGroup[]
  selectedModel: SelectedModel | null
  onSelectModel: (model: SelectedModel) => void
  agentVisible: boolean
  initialBubbles?: ChatBubble[]
  refId?: string
  refType?: 'post' | 'note' | 'page'
}

export function RichAgentEditor({
  editorProps,
  editorChildren,
  onChange,
  onSubmit,
  onEditorReady,
  providerGroups,
  selectedModel,
  onSelectModel,
  agentVisible,
  initialBubbles,
  refId,
  refType,
}: RichAgentEditorProps) {
  const store = useMemo(
    () => createAgentStore(initialBubbles),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useConversationSync({
    store,
    refId,
    refType: refType ?? 'post',
    model: selectedModel?.modelId ?? '',
    providerId: selectedModel?.providerId ?? '',
  })

  const agentLoopRef = useRef<ReturnType<typeof useAgentLoop> | null>(null)
  const editorRef = useRef<LexicalEditor | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const provider: LLMProvider | null = useMemo(() => {
    if (!selectedModel) return null
    const group = providerGroups.find((g) => g.id === selectedModel.providerId)
    if (!group) return null
    const transport = createAdminTransport(selectedModel.providerId)
    return createProvider({
      model: selectedModel.modelId,
      transport,
      providerType: mapProviderType(group.providerType),
    })
  }, [selectedModel, providerGroups])

  const handleSend = useCallback(
    (message: string) => {
      const loop = agentLoopRef.current
      if (!loop) return
      abortRef.current = new AbortController()
      loop.run(message).catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return
        store.getState().addBubble({ type: 'error', message: String(err) })
      })
    },
    [store],
  )

  const handleAbort = useCallback(() => {
    abortRef.current?.abort()
    store.getState().setStatus('idle')
  }, [store])

  const handleRetry = useCallback(() => {
    const bubbles = store.getState().bubbles
    const lastUserBubble = [...bubbles].reverse().find((b) => b.type === 'user')
    if (lastUserBubble && lastUserBubble.type === 'user') {
      handleSend(lastUserBubble.content)
    }
  }, [store, handleSend])

  const handleAcceptBatch = useCallback(
    (batchId: string) => {
      store.getState().acceptReviewBatch(batchId)
      const reviewState = store.getState().reviewState
      const batch = reviewState?.batches.find((b) => b.id === batchId)
      if (!batch || !editorRef.current) return

      const editor = editorRef.current
      editor.update(() => {
        const root = $getRoot()
        for (const entry of batch.entries) {
          const { op } = entry
          if (op.op === 'insert') {
            if (!op.node?.type) continue
            const newNode = $parseSerializedNode(op.node)
            if (op.position.type === 'root') {
              const idx = op.position.index ?? root.getChildrenSize()
              const children = root.getChildren()
              if (idx >= children.length) root.append(newNode)
              else children[idx].insertBefore(newNode)
            } else {
              const target = $findBlockByBlockId(op.position.blockId)
              if (!target) continue
              if (op.position.type === 'after') target.insertAfter(newNode)
              else target.insertBefore(newNode)
            }
          } else if (op.op === 'replace') {
            if (!op.node?.type) continue
            const target = $findBlockByBlockId(op.blockId)
            if (!target) continue
            target.replace($parseSerializedNode(op.node))
          } else if (op.op === 'delete') {
            const target = $findBlockByBlockId(op.blockId)
            if (!target) continue
            target.remove()
          }
        }
      })
    },
    [store],
  )

  const handleRejectBatch = useCallback(
    (batchId: string) => {
      store.getState().rejectReviewBatch(batchId)
    },
    [store],
  )

  const handleEditorReady = useCallback(
    (editor: LexicalEditor | null) => {
      onEditorReady?.(editor)
    },
    [onEditorReady],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <NestedDocDialogEditorProvider value={NestedDocDialogEditor}>
          <DialogStackProvider>
            <ExcalidrawConfigProvider
              saveSnapshot={saveExcalidrawSnapshot}
              apiUrl={API_URL}
            >
              <ShiroEditor
                {...editorProps}
                extraNodes={[
                  ...(editorProps.extraNodes || []),
                  ...nestedDocEditNodes,
                ]}
                header={createElement(ToolbarPlugin)}
                onChange={onChange}
                onSubmit={onSubmit}
                onEditorReady={handleEditorReady}
              >
                <DiffReviewOverlayPlugin store={store} />
                <AgentLoopCapture
                  editorRef={editorRef}
                  loopRef={agentLoopRef}
                  provider={provider}
                  store={store}
                />
                {editorChildren}
              </ShiroEditor>
            </ExcalidrawConfigProvider>
          </DialogStackProvider>
        </NestedDocDialogEditorProvider>
      </div>
      {agentVisible && (
        <div style={{ width: 420, flexShrink: 0, overflow: 'auto' }}>
          <PortalThemeProvider
            className={getVariantClass('article')}
            theme={editorProps.theme ?? 'light'}
          >
            <ChatPanel
              providerGroups={providerGroups}
              selectedModel={selectedModel}
              store={store}
              onAbort={handleAbort}
              onAcceptBatch={handleAcceptBatch}
              onRejectBatch={handleRejectBatch}
              onRetry={handleRetry}
              onSelectModel={onSelectModel}
              onSend={handleSend}
            />
          </PortalThemeProvider>
        </div>
      )}
    </div>
  )
}

function AgentLoopCapture({
  editorRef,
  loopRef,
  provider,
  store,
}: {
  editorRef: React.RefObject<LexicalEditor | null>
  loopRef: React.RefObject<ReturnType<typeof useAgentLoop> | null>
  provider: LLMProvider | null
  store: ReturnType<typeof createAgentStore>
}) {
  if (!provider) {
    loopRef.current = null
    return null
  }
  return (
    <AgentLoopCaptureInner
      editorRef={editorRef}
      loopRef={loopRef}
      provider={provider}
      store={store}
    />
  )
}

function AgentLoopCaptureInner({
  editorRef,
  loopRef,
  provider,
  store,
}: {
  editorRef: React.RefObject<LexicalEditor | null>
  loopRef: React.RefObject<ReturnType<typeof useAgentLoop> | null>
  provider: LLMProvider
  store: ReturnType<typeof createAgentStore>
}) {
  const loop = useAgentLoop({ provider, store })
  loopRef.current = loop

  const [editor] = useLexicalComposerContext()
  editorRef.current = editor

  return null
}
