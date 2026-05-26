import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import type { GeneralSettingDto } from './editor-config'

import { GeneralSettingSchema } from './editor-config'

const STORAGE_KEY = 'editor-general'

const loadGeneral = (): GeneralSettingDto => {
  if (typeof window === 'undefined') return GeneralSettingSchema.parse({})
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return GeneralSettingSchema.parse({})
  try {
    const parsed = JSON.parse(raw)
    return GeneralSettingSchema.parse(parsed)
  } catch {
    return GeneralSettingSchema.parse({})
  }
}

let generalState: GeneralSettingDto = loadGeneral()
const generalListeners = new Set<() => void>()

function emitGeneral() {
  generalListeners.forEach((l) => l())
}

function persistGeneral() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(generalState))
  } catch {
    /* ignore quota */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    generalState = loadGeneral()
    emitGeneral()
  })
}

export function getGeneralSetting(): GeneralSettingDto {
  return generalState
}

export function setGeneralSetting(
  patch:
    | Partial<GeneralSettingDto>
    | ((prev: GeneralSettingDto) => GeneralSettingDto),
): void {
  const next =
    typeof patch === 'function'
      ? patch(generalState)
      : { ...generalState, ...patch }
  generalState = GeneralSettingSchema.parse(next)
  persistGeneral()
  emitGeneral()
}

export function resetGeneralSetting(): void {
  generalState = GeneralSettingSchema.parse({})
  persistGeneral()
  emitGeneral()
}

function subscribeGeneral(listener: () => void): () => void {
  generalListeners.add(listener)
  return () => {
    generalListeners.delete(listener)
  }
}

export function useGeneralSetting(): GeneralSettingDto {
  return useSyncExternalStore(
    subscribeGeneral,
    getGeneralSetting,
    getGeneralSetting,
  )
}

export function useEditorConfig() {
  const setting = useGeneralSetting()
  return {
    general: {
      setting,
      set: setGeneralSetting,
      reset: resetGeneralSetting,
    },
  }
}

export { GeneralSettingSchema }
export type { GeneralSettingDto }
export { z }
