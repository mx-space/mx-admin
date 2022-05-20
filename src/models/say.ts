import type { Pager } from './base'

export interface SayModel {
  id?: string
  text: string
  source?: string
  author?: string
}

export interface SayResponse {
  data: SayModel[]
  pagination: Pager
}
