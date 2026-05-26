type Listener = () => void

let activeScopeId: string | null = null
// Refcounted: multiple FocusScope instances can share the same id (e.g. the
// desktop sidebar `<aside>` and the mobile drawer both render `id="sidebar"`).
// Without refcounting, the first unmount would delete the entry while another
// scope element is still in the DOM.
const knownScopes = new Map<string, number>()
const listeners = new Set<Listener>()
let documentListenersAttached = false

function notify() {
  for (const l of listeners) l()
}

function findScopeIdFromEvent(event: Event): string | null {
  const target = event.target instanceof Element ? event.target : null
  if (!target) return null
  const el = target.closest<HTMLElement>('[data-focus-scope]')
  return el?.dataset.focusScope ?? null
}

function onGlobalInteract(event: PointerEvent | FocusEvent) {
  const id = findScopeIdFromEvent(event)
  // null = clicked / focused outside any scope → no change to active. Clicking
  // outside should not eagerly deactivate; keyboard shortcuts of the last list
  // remain available until the user enters a different scope. Use
  // `setActiveScope(null)` explicitly (e.g. on Escape) to clear.
  if (id == null) return
  setActiveScope(id)
}

function ensureDocumentListeners() {
  if (documentListenersAttached) return
  if (typeof document === 'undefined') return
  documentListenersAttached = true
  document.addEventListener('pointerdown', onGlobalInteract, true)
  document.addEventListener('focusin', onGlobalInteract, true)
}

export function registerFocusScope(id: string): () => void {
  ensureDocumentListeners()
  knownScopes.set(id, (knownScopes.get(id) ?? 0) + 1)
  return () => {
    const current = knownScopes.get(id) ?? 0
    if (current <= 1) {
      knownScopes.delete(id)
      if (activeScopeId === id) {
        activeScopeId = null
        notify()
      }
    } else {
      knownScopes.set(id, current - 1)
    }
  }
}

export function setActiveScope(id: string | null): void {
  if (id !== null && !knownScopes.has(id)) return
  if (activeScopeId === id) return
  activeScopeId = id
  notify()
}

export function getActiveScopeId(): string | null {
  return activeScopeId
}

export function subscribeFocusScope(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
