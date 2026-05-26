import type { ContextMenuItem } from './types'

interface VirtualElement {
  contextElement?: Element
  getBoundingClientRect: () => DOMRect
}

export interface ContextMenuState {
  anchor: VirtualElement | null
  items: ContextMenuItem[]
  open: boolean
  triggerId: string | null
}

const emptyState: ContextMenuState = {
  anchor: null,
  items: [],
  open: false,
  triggerId: null,
}

let state: ContextMenuState = emptyState
const listeners = new Set<() => void>()
const lastPointer = {
  ready: false,
  triggerId: null as string | null,
  x: 0,
  y: 0,
}

function notify() {
  for (const l of listeners) l()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): ContextMenuState {
  return state
}

export function getServerSnapshot(): ContextMenuState {
  return emptyState
}

export function updateLastPointer(event: MouseEvent | PointerEvent): void {
  lastPointer.x = event.clientX
  lastPointer.y = event.clientY
  lastPointer.ready = true
  if (event.target instanceof Element) {
    const trigger = event.target.closest<HTMLElement>(
      '[data-contextmenu-trigger]',
    )
    lastPointer.triggerId = trigger?.dataset.contextmenuTrigger ?? null
  } else {
    lastPointer.triggerId = null
  }
}

function createVirtualElement(point: { x: number; y: number }): VirtualElement {
  return {
    contextElement: typeof document === 'undefined' ? undefined : document.body,
    getBoundingClientRect: () =>
      ({
        bottom: point.y,
        height: 0,
        left: point.x,
        right: point.x,
        toJSON: () => undefined,
        top: point.y,
        width: 0,
        x: point.x,
        y: point.y,
      }) as DOMRect,
  }
}

export function setContextMenuState(next: Partial<ContextMenuState>): void {
  state = { ...state, ...next }
  notify()
}

export function showContextMenu(items: ContextMenuItem[]): void {
  if (typeof window === 'undefined') return
  const fallback = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const point = lastPointer.ready
    ? { x: lastPointer.x, y: lastPointer.y }
    : fallback
  setContextMenuState({
    anchor: createVirtualElement(point),
    items,
    open: true,
    triggerId: lastPointer.triggerId ?? null,
  })
}

/**
 * Replace the items of an open menu without re-anchoring.
 * Useful when a checkbox toggles in-place.
 */
export function updateContextMenuItems(items: ContextMenuItem[]): void {
  if (typeof window === 'undefined') return
  setContextMenuState({ items })
}

export function closeContextMenu(): void {
  setContextMenuState({
    anchor: null,
    items: [],
    open: false,
    triggerId: null,
  })
}
