import { $getRoot, $getState, $parseSerializedNode } from 'lexical'
import { reactive } from 'vue'
import type {
  AgentOperation,
  ReviewBatch,
  ToolCallGroupItem,
} from '@haklex/rich-agent-core'
import type { LexicalEditor, LexicalNode } from 'lexical'

import { blockIdState } from '@haklex/rich-editor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReplayStatus = 'idle' | 'running' | 'success' | 'conflict' | 'error'

export interface ReplayStateEntry {
  status: ReplayStatus
  message?: string
  finishedAt?: number
  summary?: {
    succeeded: number
    conflicted: number
    failed: number
    total: number
  }
}

export type ReplayStateMap = Record<string, ReplayStateEntry | undefined>

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

export function itemReplayKey(itemId: string): string {
  return `tool:${itemId}`
}

export function groupReplayKey(groupId: string): string {
  return `group:${groupId}`
}

export function batchReplayKey(batchId: string): string {
  return `batch:${batchId}`
}

// ---------------------------------------------------------------------------
// Module-level Lexical helpers ($ prefix = must run inside editor.update)
// ---------------------------------------------------------------------------

function $findBlockByBlockId(blockId: string): LexicalNode | null {
  const root = $getRoot()
  for (const child of root.getChildren()) {
    if ($getState(child, blockIdState) === blockId) {
      return child
    }
  }
  return null
}

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

/**
 * Apply a single `AgentOperation` inside an `editor.update()` callback.
 * Returns the resulting `ReplayStateEntry` instead of silently continuing.
 */
function applyOperation(op: AgentOperation): ReplayStateEntry {
  try {
    if (op.op === 'insert') {
      if (!op.node?.type) {
        return {
          status: 'error',
          message: 'Insert operation missing node type',
        }
      }
      const newNode = $parseSerializedNode(
        stripBlockIdFromSerialized(op.node as any),
      )
      if (op.position.type === 'root') {
        const root = $getRoot()
        const idx = op.position.index ?? root.getChildrenSize()
        const children = root.getChildren()
        if (idx >= children.length) root.append(newNode)
        else children[idx].insertBefore(newNode)
      } else {
        const target = $findBlockByBlockId(op.position.blockId)
        if (!target) {
          return {
            status: 'conflict',
            message: `Target block not found: ${op.position.blockId}`,
          }
        }
        if (op.position.type === 'after') target.insertAfter(newNode)
        else target.insertBefore(newNode)
      }
      return { status: 'success' }
    }

    if (op.op === 'replace') {
      if (!op.node?.type) {
        return {
          status: 'error',
          message: 'Replace operation missing node type',
        }
      }
      const target = $findBlockByBlockId(op.blockId)
      if (!target) {
        return {
          status: 'conflict',
          message: `Target block not found: ${op.blockId}`,
        }
      }
      target.replace(
        $parseSerializedNode(stripBlockIdFromSerialized(op.node as any)),
      )
      return { status: 'success' }
    }

    if (op.op === 'delete') {
      const target = $findBlockByBlockId(op.blockId)
      if (!target) {
        return {
          status: 'conflict',
          message: `Target block not found: ${op.blockId}`,
        }
      }
      target.remove()
      return { status: 'success' }
    }

    return {
      status: 'error',
      message: `Unknown operation type: ${(op as any).op}`,
    }
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    }
  }
}

// ---------------------------------------------------------------------------
// Composable options
// ---------------------------------------------------------------------------

export interface UseReapplyOptions {
  getEditor: () => LexicalEditor | null
  getReviewBatch: (batchId: string) => ReviewBatch | undefined
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useReapply(options: UseReapplyOptions) {
  const state: ReplayStateMap = reactive({})

  function setEntry(key: string, entry: ReplayStateEntry) {
    state[key] = { ...entry, finishedAt: entry.finishedAt ?? Date.now() }
  }

  function getEntry(key: string): ReplayStateEntry | undefined {
    return state[key]
  }

  function autoClearSuccess(key: string) {
    setTimeout(() => {
      if (state[key]?.status === 'success') {
        state[key] = undefined
      }
    }, 3000)
  }

  // -----------------------------------------------------------------------
  // Compatibility check
  // -----------------------------------------------------------------------

  function isReplayableItem(item: ToolCallGroupItem): boolean {
    if (item.status !== 'completed' || !item.result) return false
    try {
      const parsed = JSON.parse(item.result)
      const op = parsed?.op as AgentOperation | undefined
      if (!op?.op) return false
      return ['insert', 'replace', 'delete'].includes(op.op)
    } catch {
      return false
    }
  }

  function extractOperation(item: ToolCallGroupItem): AgentOperation | null {
    if (!item.result) return null
    try {
      const parsed = JSON.parse(item.result)
      return (parsed?.op as AgentOperation) ?? null
    } catch {
      return null
    }
  }

  // -----------------------------------------------------------------------
  // Single-item apply
  // -----------------------------------------------------------------------

  function applyReplayItem(item: ToolCallGroupItem): ReplayStateEntry {
    const key = itemReplayKey(item.id)
    setEntry(key, { status: 'running' })

    const editor = options.getEditor()
    if (!editor) {
      const entry: ReplayStateEntry = {
        status: 'error',
        message: 'Editor not available',
      }
      setEntry(key, entry)
      return entry
    }

    const op = extractOperation(item)
    if (!op) {
      const entry: ReplayStateEntry = {
        status: 'error',
        message: 'Could not extract operation from result',
      }
      setEntry(key, entry)
      return entry
    }

    let result: ReplayStateEntry = { status: 'error', message: 'Not executed' }

    editor.update(
      () => {
        result = applyOperation(op)
      },
      { discrete: true },
    )

    setEntry(key, result)
    if (result.status === 'success') autoClearSuccess(key)
    return result
  }

  // -----------------------------------------------------------------------
  // Group replay
  // -----------------------------------------------------------------------

  function applyReplayGroup(
    groupId: string,
    items: ToolCallGroupItem[],
  ): ReplayStateEntry {
    const key = groupReplayKey(groupId)
    setEntry(key, { status: 'running' })

    const replayable = items.filter(isReplayableItem)
    if (replayable.length === 0) {
      const entry: ReplayStateEntry = {
        status: 'error',
        message: 'No replayable items in group',
        summary: {
          succeeded: 0,
          conflicted: 0,
          failed: 0,
          total: 0,
        },
      }
      setEntry(key, entry)
      return entry
    }

    const summary = {
      succeeded: 0,
      conflicted: 0,
      failed: 0,
      total: replayable.length,
    }

    for (const item of replayable) {
      const result = applyReplayItem(item)
      if (result.status === 'success') summary.succeeded++
      else if (result.status === 'conflict') summary.conflicted++
      else summary.failed++
    }

    const groupStatus: ReplayStatus =
      summary.conflicted > 0 || summary.failed > 0
        ? summary.succeeded > 0
          ? 'conflict'
          : 'error'
        : 'success'

    const entry: ReplayStateEntry = { status: groupStatus, summary }
    setEntry(key, entry)
    if (groupStatus === 'success') autoClearSuccess(key)
    return entry
  }

  // -----------------------------------------------------------------------
  // Batch replay
  // -----------------------------------------------------------------------

  function applyReplayBatch(batchId: string): ReplayStateEntry {
    const key = batchReplayKey(batchId)
    setEntry(key, { status: 'running' })

    const batch = options.getReviewBatch(batchId)
    if (!batch) {
      const entry: ReplayStateEntry = {
        status: 'error',
        message: 'Batch not found',
      }
      setEntry(key, entry)
      return entry
    }

    const editor = options.getEditor()
    if (!editor) {
      const entry: ReplayStateEntry = {
        status: 'error',
        message: 'Editor not available',
      }
      setEntry(key, entry)
      return entry
    }

    const summary = {
      succeeded: 0,
      conflicted: 0,
      failed: 0,
      total: batch.entries.length,
    }

    editor.update(
      () => {
        for (const entry of batch.entries) {
          const result = applyOperation(entry.op)
          if (result.status === 'success') summary.succeeded++
          else if (result.status === 'conflict') summary.conflicted++
          else summary.failed++
        }
      },
      { discrete: true },
    )

    const batchStatus: ReplayStatus =
      summary.conflicted > 0 || summary.failed > 0
        ? summary.succeeded > 0
          ? 'conflict'
          : 'error'
        : 'success'

    const entry: ReplayStateEntry = { status: batchStatus, summary }
    setEntry(key, entry)
    if (batchStatus === 'success') autoClearSuccess(key)
    return entry
  }

  return {
    state,
    getEntry,
    isReplayableItem,
    extractOperation,
    applyReplayItem,
    applyReplayGroup,
    applyReplayBatch,
  }
}
