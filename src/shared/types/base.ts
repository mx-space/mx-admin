import type { Image } from 'models/base'

export type WriteBaseType = {
  title: string
  text: string
  allowComment: boolean

  id?: string
  images: Image[]
  created?: string
  modified?: string

  meta?: any
}
