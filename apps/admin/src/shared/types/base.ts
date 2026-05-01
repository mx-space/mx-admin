import type { Image } from '~/models/base'

export type ContentFormat = 'markdown' | 'lexical'

export type WriteBaseType = {
  title: string
  text: string
  allowComment: boolean
  contentFormat?: ContentFormat
  content?: string

  id?: string
  images: Image[]
  created?: string
  modified?: string

  meta?: any
}
