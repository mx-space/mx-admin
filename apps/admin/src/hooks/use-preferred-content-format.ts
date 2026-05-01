import type { ContentFormat } from '~/shared/types/base'

import { useStorage } from '@vueuse/core'

const STORAGE_KEY = 'preferred-content-format'

export function usePreferredContentFormat() {
  const preferred = useStorage<ContentFormat>(STORAGE_KEY, 'markdown')

  const setPreferred = (format: ContentFormat) => {
    preferred.value = format
  }

  return {
    preferredContentFormat: preferred,
    setPreferredContentFormat: setPreferred,
  }
}
