import { useRef } from 'react'
import type {
  AgentStore,
  AgentToolConfig,
  ChatMessage,
  LLMProvider,
} from '@haklex/rich-agent-core'
import type { LexicalEditor } from 'lexical'
import type { ShiroEditorProps } from '../shiro'
import type { AgentLoopHandle, SaveExcalidrawSnapshot } from '../types'
import type { EnrichmentFetcher } from './EnrichmentLinkCardContext'

import { DialogStackProvider } from '@haklex/rich-editor-ui'
import {
  AgentAskAIAction,
  AgentSelectionPinPlugin,
  DiffReviewOverlayPlugin,
} from '@haklex/rich-ext-ai-agent'
import { ExcalidrawConfigProvider } from '@haklex/rich-ext-excalidraw'
import {
  NestedDocDialogEditorProvider,
  nestedDocEditNodes,
  NestedDocPlugin,
} from '@haklex/rich-ext-nested-doc'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'

import { ShiroEditor } from '../shiro'
import { EnrichmentFetcherProvider } from './EnrichmentLinkCardContext'

import './setup-enrichment-linkcard'

import { AgentLoopCapture } from './AgentLoopCapture'
import { NestedDocDialogEditor } from './NestedDocDialogEditor'

import '@haklex/rich-ext-ai-agent/style.css'
import '@haklex/rich-plugin-toolbar/style.css'
import '@haklex/rich-ext-nested-doc/style.css'
import '../shiro/style'

export interface ReactEditorPaneProps {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  store: AgentStore
  provider: LLMProvider | null
  saveExcalidrawSnapshot: SaveExcalidrawSnapshot
  apiUrl: string
  fetchEnrichment?: EnrichmentFetcher | null
  onChange?: ShiroEditorProps['onChange']
  onSubmit?: ShiroEditorProps['onSubmit']
  onEditorReady?: (editor: LexicalEditor | null) => void
  onAgentLoopReady: (loop: AgentLoopHandle | null) => void
  tools?: AgentToolConfig[]
  systemMessages?: ChatMessage[]
}

export function ReactEditorPane({
  editorProps,
  store,
  provider,
  saveExcalidrawSnapshot,
  apiUrl,
  fetchEnrichment,
  onChange,
  onSubmit,
  onEditorReady,
  onAgentLoopReady,
  tools,
  systemMessages,
}: ReactEditorPaneProps) {
  const editorRef = useRef<LexicalEditor | null>(null)

  const handleEditorReady = (editor: LexicalEditor | null) => {
    editorRef.current = editor
    onEditorReady?.(editor)
  }

  return (
    <EnrichmentFetcherProvider value={fetchEnrichment ?? null}>
      <NestedDocDialogEditorProvider value={NestedDocDialogEditor}>
        <DialogStackProvider>
          <ExcalidrawConfigProvider
            saveSnapshot={saveExcalidrawSnapshot}
            apiUrl={apiUrl}
          >
            <ShiroEditor
              {...editorProps}
              extraNodes={[
                ...(editorProps.extraNodes || []),
                ...nestedDocEditNodes,
              ]}
              header={<ToolbarPlugin />}
              floatingToolbarActions={
                provider ? <AgentAskAIAction /> : undefined
              }
              onChange={onChange}
              onSubmit={onSubmit}
              onEditorReady={handleEditorReady}
            >
              <DiffReviewOverlayPlugin store={store} />
              {provider ? <AgentSelectionPinPlugin store={store} /> : null}
              <AgentLoopCapture
                editorRef={editorRef}
                onAgentLoopReady={onAgentLoopReady}
                provider={provider}
                store={store}
                tools={tools}
                systemMessages={systemMessages}
              />
              <NestedDocPlugin />
            </ShiroEditor>
          </ExcalidrawConfigProvider>
        </DialogStackProvider>
      </NestedDocDialogEditorProvider>
    </EnrichmentFetcherProvider>
  )
}
