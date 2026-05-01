import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type {
  AgentStore,
  AgentToolConfig,
  ChatMessage,
  LLMProvider,
} from '@haklex/rich-agent-core'
import type { LexicalEditor } from 'lexical'
import type { RefObject } from 'react'
import type { AgentLoopHandle } from '../types'

import { useAgentLoop } from '@haklex/rich-ext-ai-agent'

interface AgentLoopCaptureInnerProps {
  editorRef: RefObject<LexicalEditor | null>
  onAgentLoopReady: (loop: AgentLoopHandle) => void
  provider: LLMProvider
  store: AgentStore
  tools?: AgentToolConfig[]
  systemMessages?: ChatMessage[]
}

function AgentLoopCaptureInner({
  editorRef,
  onAgentLoopReady,
  provider,
  store,
  tools,
  systemMessages,
}: AgentLoopCaptureInnerProps) {
  const loop = useAgentLoop({ provider, store, tools, systemMessages })
  onAgentLoopReady(loop)
  const [editor] = useLexicalComposerContext()
  editorRef.current = editor
  return null
}

export interface AgentLoopCaptureProps {
  editorRef: RefObject<LexicalEditor | null>
  onAgentLoopReady: (loop: AgentLoopHandle | null) => void
  provider: LLMProvider | null
  store: AgentStore
  tools?: AgentToolConfig[]
  systemMessages?: ChatMessage[]
}

export function AgentLoopCapture({
  editorRef,
  onAgentLoopReady,
  provider,
  store,
  tools,
  systemMessages,
}: AgentLoopCaptureProps) {
  if (!provider) {
    onAgentLoopReady(null)
    return null
  }
  return (
    <AgentLoopCaptureInner
      editorRef={editorRef}
      onAgentLoopReady={onAgentLoopReady}
      provider={provider}
      store={store}
      tools={tools}
      systemMessages={systemMessages}
    />
  )
}
