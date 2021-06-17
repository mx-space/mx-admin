import { Pager } from './base'

export enum LinkType {
  Friend,
  Collection,
}
export interface LinkModel {
  id: string
  name: string
  url: string
  avatar: string
  description?: string
  type: LinkType
}

export interface LinkResponse {
  page: Pager
  data: LinkModel[]
}
