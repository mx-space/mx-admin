import { createRoot } from 'react-dom/client'
import type {
  AgentStore,
  AgentToolConfig,
  ChatMessage,
  LLMProvider,
} from '@haklex/rich-agent-core'
import type { LexicalEditor, SerializedEditorState } from 'lexical'

import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'

import '@haklex/rich-ext-ai-agent/style.css'
import '@haklex/rich-kit-shiro/style.css'
import '@haklex/rich-plugin-toolbar/style.css'
import '@haklex/rich-ext-nested-doc/style.css'

import type { AgentLoopHandle, SaveExcalidrawSnapshot } from '../types'
import type { BuildShiroEditorPropsInput } from '../utils/build-shiro-editor-props'

import { ReactEditorPane } from '../components/ReactEditorPane'
import { buildShiroEditorProps } from '../utils/build-shiro-editor-props'

export interface MountRichEditorWithAgentOptions extends BuildShiroEditorPropsInput {
  theme: 'dark' | 'light'
  store: AgentStore
  provider: LLMProvider | null
  tools?: AgentToolConfig[]
  systemMessages?: ChatMessage[]
  saveExcalidrawSnapshot: SaveExcalidrawSnapshot
  apiUrl: string
  onChange?: (value: SerializedEditorState) => void
  onSubmit?: () => void
  onEditorReady?: (editor: LexicalEditor | null) => void
  onAgentLoopReady?: (loop: AgentLoopHandle | null) => void
  onTextChange?: (text: string) => void
}

export interface RichEditorWithAgentHandle {
  update(opts: MountRichEditorWithAgentOptions): void
  unmount(): void
  getEditor(): LexicalEditor | null
  focus(): void
}

export function mountRichEditorWithAgent(
  container: HTMLElement,
  initial: MountRichEditorWithAgentOptions,
): RichEditorWithAgentHandle {
  const root = createRoot(container)
  let editorInstance: LexicalEditor | null = null
  let current = initial
  let unmounted = false

  const handleChange = (value: SerializedEditorState) => {
    if (unmounted) return
    current.onChange?.(value)
    if (editorInstance && current.onTextChange) {
      const cb = current.onTextChange
      editorInstance.read(() => cb($convertToMarkdownString(TRANSFORMERS)))
    }
  }

  const handleSubmit = () => {
    if (unmounted) return
    current.onSubmit?.()
  }

  const handleEditorReady = (editor: LexicalEditor | null) => {
    if (unmounted) return
    editorInstance = editor
    current.onEditorReady?.(editor)
    if (editor && current.onTextChange) {
      const cb = current.onTextChange
      editor.read(() => cb($convertToMarkdownString(TRANSFORMERS)))
    }
  }

  const handleAgentLoopReady = (loop: AgentLoopHandle | null) => {
    if (unmounted) return
    current.onAgentLoopReady?.(loop)
  }

  const render = (opts: MountRichEditorWithAgentOptions) => {
    const editorProps = buildShiroEditorProps(opts.theme, opts)
    root.render(
      <ReactEditorPane
        editorProps={editorProps}
        store={opts.store}
        provider={opts.provider}
        saveExcalidrawSnapshot={opts.saveExcalidrawSnapshot}
        apiUrl={opts.apiUrl}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onEditorReady={handleEditorReady}
        onAgentLoopReady={handleAgentLoopReady}
        tools={opts.tools}
        systemMessages={opts.systemMessages}
      />,
    )
  }

  render(initial)

  return {
    update(opts) {
      current = opts
      render(opts)
    },
    unmount() {
      unmounted = true
      root.unmount()
      editorInstance = null
    },
    getEditor() {
      return editorInstance
    },
    focus() {
      editorInstance?.focus()
    },
  }
}
