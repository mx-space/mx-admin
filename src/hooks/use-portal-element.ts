import { inject } from 'vue'
import type { VNode } from 'vue'
import type { InjectionKey } from 'vue'

type CleanFn = () => void
export const PortalInjectKey: InjectionKey<{
  setElement: (el: VNode | null) => CleanFn
}> = Symbol()
export const usePortalElement = () => {
  const ctx = inject(PortalInjectKey)!

  return ctx.setElement
}
