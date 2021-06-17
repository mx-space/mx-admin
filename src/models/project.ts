import { Pager } from './base'

export interface ProjectModel {
  id?: string
  name: string
  previewUrl?: string
  docUrl?: string
  projectUrl?: string
  images?: string[]
  description: string
  avatar?: string
  text: string
}

export type ProjectResponse = {
  data: ProjectModel[]
  page: Pager
}
