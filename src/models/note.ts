import type { TopicModel } from '@mx-space/api-client'

export interface NoteModel {
  id: string
  allowComment: boolean
  count: {
    read: number
    like: number
  }
  title: string
  text: string
  mood?: string
  weather?: string
  bookmark?: boolean
  created: string
  modified: string
  publicAt?: Date
  password?: string | null
  nid: number
  hide: boolean

  location?: string

  coordinates?: Coordinate

  meta?: any
  isPublished?: boolean
  topicId?: string
  topic?: TopicModel
}

export interface Coordinate {
  latitude: number
  longitude: number
}
