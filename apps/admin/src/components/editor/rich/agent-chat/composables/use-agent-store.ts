import { inject, onUnmounted, provide, shallowRef } from 'vue'
import type { AgentStore, AgentStoreSlice } from '@haklex/rich-agent-core'
import type { InjectionKey, ShallowRef } from 'vue'

const AGENT_STORE_KEY: InjectionKey<AgentStore> = Symbol('agent-store')

export function provideAgentStore(store: AgentStore): void {
  provide(AGENT_STORE_KEY, store)
}

export function useAgentStore(): AgentStore {
  const store = inject(AGENT_STORE_KEY)
  if (!store)
    throw new Error('AgentStore not provided. Wrap with provideAgentStore().')
  return store
}

export function useAgentStoreSelector<T>(
  selector: (state: AgentStoreSlice) => T,
): ShallowRef<T> {
  const store = useAgentStore()
  const value = shallowRef<T>(selector(store.getState()))

  const unsubscribe = store.subscribe((state) => {
    const next = selector(state)
    if (!Object.is(next, value.value)) {
      value.value = next
    }
  })

  onUnmounted(unsubscribe)

  return value
}
