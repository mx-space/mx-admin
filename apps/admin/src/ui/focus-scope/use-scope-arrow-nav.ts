import { useEffect, useRef } from 'react'
import { tinykeys } from 'tinykeys'

import { getActiveScopeId } from './store'

export interface UseScopeArrowNavOptions {
  /** The focus-scope id whose items this set navigates. */
  scopeId: string
  /** CSS selector matching the navigable items inside the scope. */
  itemSelector: string
  /** Disable bindings. */
  enabled?: boolean
  /**
   * Called after focus moves to a new item via keyboard. Receives the newly
   * focused element. Consumers commonly use this to mirror the focus cursor
   * into their own selection state (e.g. `selection.selectOne(el.dataset.id)`).
   */
  onItemFocus?: (target: HTMLElement) => void
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

type CheckVisibilityFn = (opts?: {
  checkOpacity?: boolean
  checkVisibilityCSS?: boolean
  contentVisibilityAuto?: boolean
}) => boolean

function isItemVisible(el: HTMLElement): boolean {
  // `checkVisibility` reliably accounts for display:none, visibility:hidden,
  // ancestor opacity:0 (used by the sidebar collapse), content-visibility,
  // and clipped/zero-sized ancestors. Fall back to offsetParent for older
  // browsers — admin-vue3 targets modern evergreen, this is just a safety
  // net.
  const cv = (el as unknown as { checkVisibility?: CheckVisibilityFn })
    .checkVisibility
  if (typeof cv === 'function') {
    return cv.call(el, { checkOpacity: true, checkVisibilityCSS: true })
  }
  return el.offsetParent !== null
}

/**
 * Bind J / K, ArrowDown / ArrowUp, Home / End to move keyboard focus through
 * items inside the active focus scope. Items are discovered at fire time via
 * `[data-focus-scope="<id>"] <itemSelector>` and filtered to visible elements.
 *
 * Bindings only fire when the scope is currently active (per
 * `getActiveScopeId()`) and the event target isn't a text input /
 * contentEditable. The handler walks up from `document.activeElement` to find
 * the current item; if none, the first / last item is focused.
 */
export function useScopeArrowNav(options: UseScopeArrowNavOptions): void {
  const scopeIdRef = useRef(options.scopeId)
  scopeIdRef.current = options.scopeId
  const itemSelectorRef = useRef(options.itemSelector)
  itemSelectorRef.current = options.itemSelector
  const onItemFocusRef = useRef(options.onItemFocus)
  onItemFocusRef.current = options.onItemFocus

  useEffect(() => {
    if (options.enabled === false) return
    if (typeof window === 'undefined') return

    const getScopeRoot = (): HTMLElement | null => {
      // Multiple FocusScope instances may share the same id (e.g. desktop
      // aside + mobile drawer). Pick the one that's actually visible.
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-focus-scope="${scopeIdRef.current}"]`,
        ),
      )
      const visible = candidates.find(isItemVisible)
      return visible ?? candidates[0] ?? null
    }

    const getItems = (): HTMLElement[] => {
      const root = getScopeRoot()
      if (!root) return []
      return Array.from(
        root.querySelectorAll<HTMLElement>(itemSelectorRef.current),
      ).filter(isItemVisible)
    }

    const focusAt = (target: HTMLElement) => {
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: 'nearest' })
      onItemFocusRef.current?.(target)
    }

    const move = (direction: 1 | -1) => {
      const items = getItems()
      if (items.length === 0) return
      const active = document.activeElement
      let idx = -1
      if (active instanceof HTMLElement) {
        const itemEl = active.closest<HTMLElement>(itemSelectorRef.current)
        if (itemEl) idx = items.indexOf(itemEl)
      }
      const nextIdx =
        idx === -1
          ? direction === 1
            ? 0
            : items.length - 1
          : (idx + direction + items.length) % items.length
      focusAt(items[nextIdx])
    }

    const jumpToEdge = (edge: 'first' | 'last') => {
      const items = getItems()
      if (items.length === 0) return
      focusAt(items[edge === 'first' ? 0 : items.length - 1])
    }

    const isReachable = (): boolean => {
      // Primary gate: scope is the currently-active one (sticky from prior
      // click). Fallback: document.activeElement happens to be inside the
      // scope's DOM subtree — useful right after a router navigation that
      // restored focus before any user pointerdown was captured.
      if (getActiveScopeId() === scopeIdRef.current) return true
      const active = document.activeElement
      if (active instanceof HTMLElement) {
        return (
          active.closest(`[data-focus-scope="${scopeIdRef.current}"]`) != null
        )
      }
      return false
    }

    const gated =
      (handler: (event: KeyboardEvent) => void) => (event: KeyboardEvent) => {
        if (!isReachable()) return
        if (isTextInputTarget(event.target)) return
        event.preventDefault()
        handler(event)
      }

    return tinykeys(window, {
      ArrowDown: gated(() => move(1)),
      ArrowUp: gated(() => move(-1)),
      End: gated(() => jumpToEdge('last')),
      Home: gated(() => jumpToEdge('first')),
      j: gated(() => move(1)),
      k: gated(() => move(-1)),
    })
  }, [options.enabled])
}
