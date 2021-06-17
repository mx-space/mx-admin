import { Pager } from './base'

export enum LinkType {
  Friend,
  Collection,
}

export enum LinkState {
  Pass,
  Audit,
}
export interface LinkModel {
  id: string
  name: string
  url: string
  avatar: string
  description?: string
  type: LinkType
  state: LinkState
}

export interface LinkResponse {
  page: Pager
  data: LinkModel[]
}
