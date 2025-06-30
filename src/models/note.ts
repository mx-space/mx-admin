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

  location?: string

  coordinates?: Coordinate

  meta?: any
  isPublished?: boolean
}

export interface Coordinate {
  latitude: number
  longitude: number
}
