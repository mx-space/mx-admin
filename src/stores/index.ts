import { useAppStore } from './app'
import { useCategoryStore } from './category'
import { useLayoutStore } from './layout'
import { useUIStore } from './ui'
import { useUserStore } from './user'

;(
  [
    useUserStore,
    useAppStore,
    useCategoryStore,
    useUIStore,
    useLayoutStore,
  ] as const
).forEach((store: any) => {
  if (import.meta.hot)
    import.meta.hot.accept(acceptHMRUpdate(store, import.meta.hot))
})

export const piniaStore = createPinia()
