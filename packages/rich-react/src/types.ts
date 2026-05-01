import type { useAgentLoop } from '@haklex/rich-ext-ai-agent'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'

export type SaveExcalidrawSnapshot = (
  snapshot: object,
  existingRef?: string,
) => Promise<string>

// Admin-safe alias so consumers don't need to depend on React-bound types
export type ImageUpload = NonNullable<ShiroEditorProps['imageUpload']>

export type AgentLoopHandle = ReturnType<typeof useAgentLoop>
