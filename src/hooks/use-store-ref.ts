import type { StoreGeneric } from 'pinia'

export const useStoreRef = <SS extends StoreGeneric>(store: () => SS) =>
  Object.assign({}, store(), storeToRefs(store()))
