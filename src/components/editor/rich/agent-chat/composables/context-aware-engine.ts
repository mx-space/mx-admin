import type {
  AgentStore,
  ChatBubble,
  ChatMessage,
  MessageEngineContext,
  PageContentContext,
  PreparedMessages,
  ToolCall,
} from '@haklex/rich-agent-core'
import type { SerializedEditorState } from 'lexical'

import {
  BaseLastUserContentProvider,
  BaseSystemRoleProvider,
  BaseSystemRootProvider,
  buildDocumentContext,
  MessagesEngine,
} from '@haklex/rich-agent-core'
import { defaultAgentSystemMessage } from '@haklex/rich-ext-ai-agent'

const DOCUMENT_TOOL_SYSTEM_ROLE = `Use the document editing tools according to the following contract.

## Document XML Contract

- Document XML references use the serialized \`<doc>...</doc>\` structure.
- Tool \`xml\` arguments must contain block fragments only, not a full \`<document>\` wrapper.
- Use node IDs from injected XML context when a tool requires a target block.

## Tool Contract

### \`insert_node\`

- Insert one or more block nodes.
- \`position.type\` must be \`before\`, \`after\`, or \`root\`.
- \`position.blockId\` is required for \`before\` and \`after\`.
- \`xml\` must be valid block XML fragments.

### \`replace_node\`

- Replace the block identified by \`blockId\`.
- The first block in \`xml\` replaces the target block.
- Additional blocks, if any, are inserted after the replaced block.
- Do not invent a new block ID inside replacement XML.

### \`delete_node\`

- Delete the block identified by \`blockId\`.
- Use only when the user requests removal or the edit clearly requires deleting superseded content.

### \`search_document\`

- Use to locate candidate blocks by text or block type.
- Prefer search when the target block is unknown or a prior edit attempt failed.

## Failure Recovery

- \`block_not_found\`: search again and retry with the correct target.
- \`block_modified\`: assume the reference is stale; re-locate the target or narrow the edit.
- \`xml_parse_error\`, \`invalid_xml\`, \`empty_xml\`: rewrite the XML as valid block fragments and retry.`

class SystemRoleInjector extends BaseSystemRootProvider {
  protected buildMessages() {
    return [defaultAgentSystemMessage]
  }
}

class ToolSystemRoleInjector extends BaseSystemRoleProvider {
  protected buildContent() {
    return DOCUMENT_TOOL_SYSTEM_ROLE
  }
}

class PageEditorContextInjector extends BaseLastUserContentProvider {
  protected buildContent(context: MessageEngineContext) {
    const pageContext = resolvePageContentContext(context)
    if (!pageContext) return null

    const formatted = formatPageContentContext(pageContext)
    if (!formatted) return null

    return { content: formatted, contextType: 'current_page_context' }
  }
}

function resolvePageContentContext(
  context: MessageEngineContext,
): PageContentContext | undefined {
  if (context.pageContentContext) return context.pageContentContext

  const initialPageEditor = context.initialContext?.pageEditor
  if (!initialPageEditor) return undefined

  return {
    markdown: initialPageEditor.markdown,
    metadata: initialPageEditor.metadata,
    xml: context.stepContext?.stepPageEditor?.xml || initialPageEditor.xml,
  }
}

function formatPageContentContext(context: PageContentContext): string {
  const sections: string[] = []

  if (context.markdown) {
    const charCount = context.metadata.charCount ?? context.markdown.length
    const lineCount =
      context.metadata.lineCount ?? context.markdown.split('\n').length
    sections.push(
      `<markdown chars="${charCount}" lines="${lineCount}">\n${context.markdown}\n</markdown>`,
    )
  }

  if (context.xml) {
    sections.push(
      `<doc_xml_structure>\n<instruction>IMPORTANT: Use node IDs from this XML structure when performing modify or remove operations.</instruction>\n${context.xml}\n</doc_xml_structure>`,
    )
  }

  return `<current_page title="${context.metadata.title}">\n${sections.join('\n')}\n</current_page>`
}

/**
 * Converts store ChatBubble[] to LLM ChatMessage[] for conversation history.
 * Skips UI-only bubbles (thinking, error, diff_summary, diff_review).
 */
export function bubblesToChatMessages(bubbles: ChatBubble[]): ChatMessage[] {
  const messages: ChatMessage[] = []

  for (const bubble of bubbles) {
    if (bubble.type === 'user') {
      messages.push({ role: 'user', content: bubble.content })
    } else if (
      bubble.type === 'assistant' &&
      bubble.content &&
      !bubble.streaming
    ) {
      messages.push({ role: 'assistant', content: bubble.content })
    } else if (bubble.type === 'tool_call_group') {
      const toolCalls: ToolCall[] = []
      for (const item of bubble.items) {
        toolCalls.push({
          id: item.id,
          name: item.toolName,
          arguments: JSON.stringify(item.params),
        })
      }

      if (toolCalls.length > 0) {
        messages.push({ role: 'assistant_tool_call', toolCalls })
        for (const item of bubble.items) {
          if (item.status === 'completed' || item.status === 'error') {
            messages.push({
              role: 'tool_result',
              toolCallId: item.id,
              content: item.result || item.error || '',
              isError: item.status === 'error',
            })
          }
        }
      }
    }
  }

  return messages
}

/**
 * Creates a message engine that includes conversation history from the
 * AgentStore when building messages for the LLM. This is a duck-typed
 * replacement for AgentMessagesEngine with multi-turn support.
 *
 * The engine replicates the same processor pipeline as the library's
 * AgentMessagesEngine (system role, tool docs, page context injection)
 * but prepends conversation history from bubbles before the current
 * user message.
 */
export function createContextAwareEngine(store: AgentStore) {
  const engine = new MessagesEngine([
    new SystemRoleInjector(),
    new ToolSystemRoleInjector(),
    new PageEditorContextInjector(),
  ])

  return {
    processWithEditor(params: {
      editorState: SerializedEditorState
      userInput: string
      title?: string
    }): PreparedMessages {
      const bubbles = store.getState().bubbles

      // AgentChatPanel adds the user bubble to the store synchronously
      // before emitting 'send', so the last bubble may be the current
      // user message. Exclude it to avoid duplication (the engine creates
      // its own user message below).
      const lastBubble = bubbles[bubbles.length - 1]
      const historyBubbles =
        lastBubble?.type === 'user' && lastBubble.content === params.userInput
          ? bubbles.slice(0, -1)
          : bubbles

      const history = bubblesToChatMessages(historyBubbles)

      const userMessage: Extract<ChatMessage, { role: 'user' }> = {
        role: 'user',
        content: params.userInput,
        cacheBreakpoint: true,
      }

      return engine.process({
        messages: [...history, userMessage],
        pageContentContext: {
          metadata: { title: params.title ?? 'Current Document' },
          xml: buildDocumentContext(params.editorState, {
            mode: 'full',
            compact: true,
          }),
        },
      })
    },
  }
}
