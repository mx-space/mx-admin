export interface NoteModel {
  id: string
  hide: boolean
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
}

export interface NoteMusicRecord {
  type: string
  id: string
}
