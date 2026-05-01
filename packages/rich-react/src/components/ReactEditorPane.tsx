import type {
  AgentStore,
  AgentToolConfig,
  ChatMessage,
  LLMProvider,
} from '@haklex/rich-agent-core'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type { LexicalEditor } from 'lexical'
import type { RefObject } from 'react'
import type { AgentLoopHandle, SaveExcalidrawSnapshot } from '../types'

import { DialogStackProvider } from '@haklex/rich-editor-ui'
import {
  AgentAskAIAction,
  AgentSelectionPinPlugin,
  DiffReviewOverlayPlugin,
} from '@haklex/rich-ext-ai-agent'
import {
  NestedDocDialogEditorProvider,
  nestedDocEditNodes,
  NestedDocPlugin,
} from '@haklex/rich-ext-nested-doc'
import { ExcalidrawConfigProvider, ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'

import { AgentLoopCapture } from './AgentLoopCapture'
import { NestedDocDialogEditor } from './NestedDocDialogEditor'

export interface ReactEditorPaneProps {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  store: AgentStore
  provider: LLMProvider | null
  saveExcalidrawSnapshot: SaveExcalidrawSnapshot
  apiUrl: string
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
  onChange,
  onSubmit,
  onEditorReady,
  onAgentLoopReady,
  tools,
  systemMessages,
}: ReactEditorPaneProps) {
  const editorRef: RefObject<LexicalEditor | null> = {
    current: null,
  }

  const handleEditorReady = (editor: LexicalEditor | null) => {
    editorRef.current = editor
    onEditorReady?.(editor)
  }

  return (
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
            floatingToolbarActions={provider ? <AgentAskAIAction /> : undefined}
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
  )
}
