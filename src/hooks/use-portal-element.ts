import type { InjectionKey } from 'vue'

type CleanFn = () => void
export const PortalInjectKey: InjectionKey<{
  setElement: (el: JSX.Element | null) => CleanFn
}> = Symbol()
export const usePortalElement = () => {
  const ctx = inject(PortalInjectKey)!

  return ctx.setElement
}
