import { useSyncExternalStore } from 'react'

import { getActiveScopeId, setActiveScope, subscribeFocusScope } from './store'

function getServerSnapshot(): null {
  return null
}

/** Returns the currently-active scope id, or `null` if none. */
export function useActiveFocusScopeId(): string | null {
  return useSyncExternalStore(
    subscribeFocusScope,
    getActiveScopeId,
    getServerSnapshot,
  )
}

/** True when the named scope is the currently-active one. */
export function useFocusScopeActive(scopeId: string): boolean {
  const active = useActiveFocusScopeId()
  return active === scopeId
}

export { setActiveScope }
