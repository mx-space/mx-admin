export interface NoteModel {
  id: string
  hide: boolean
  allowComment: boolean
  count: {
    read: number
    like: number
  }
  title: string
  text: string
  mood?: string
  weather?: string
  hasMemory?: boolean
  created: string
  modified: string
  secret?: Date
  password?: string | null
  nid: number
  music?: NoteMusicRecord[]
  location?: string

  coordinates?: Coordinate
}

export interface NoteMusicRecord {
  type: string
  id: string
}

export interface Coordinate {
  latitude: number
  longitude: number
}
