import type { LinkState, LinkStateCount } from '~/models/link'

export interface HealthEntry {
  message?: string
  status: number | string
}

export type HealthMap = Record<string, HealthEntry & { id: string }>

export interface StateTab {
  countKey: keyof LinkStateCount
  label: string
  value: LinkState
}
