import { useAppStore } from './app'
import { useCategoryStore } from './category'
import { useUIStore } from './ui'
import { useUserStore } from './user'

;([useUserStore, useAppStore, useCategoryStore, useUIStore] as const).forEach(
  (store) => {
    if (import.meta.hot)
      import.meta.hot.accept(acceptHMRUpdate(store, import.meta.hot))
  },
)

export const piniaStore = createPinia()
