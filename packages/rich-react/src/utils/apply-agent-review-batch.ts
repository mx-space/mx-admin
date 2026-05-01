import { $getRoot, $getState, $parseSerializedNode } from 'lexical'
import type { ReviewBatch } from '@haklex/rich-agent-core'
import type { LexicalEditor, LexicalNode } from 'lexical'

import { blockIdState } from '@haklex/rich-editor'

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
// Strip it and let BlockIdPlugin re-assign to avoid State key collision.
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

export function applyAgentReviewBatch(
  editor: LexicalEditor,
  batch: ReviewBatch,
): void {
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
