export interface IConfig {
  seo: SEODto
  url: UrlDto
  imageBed: ImageBedDto
  mailOptions: MailOptionsDto
  commentOptions: CommentOptions
  backupOptions: BackupOptions
  baiduSearchOptions: BaiduSearchOptions
  algoliaSearchOptions: AlgoliaSearchOptions
}
export declare class SEODto {
  title: string
  description: string
  icon?: string
  keywords?: string[]
}
export declare class UrlDto {
  webUrl: string
  adminUrl: string
  serverUrl: string
  wsUrl: string
}
export declare class ImageBedDto {
  type: 'github'
  token?: string
  repo?: string
  customUrl?: string
}
export declare class MailOptionsDto {
  enable: boolean
  user: string
  pass: string
  options: {
    port: number
    host: string
  }
}
export declare class CommentOptions {
  antiSpam: boolean
  spamKeywords?: string[]
  blockIps?: string[]
  disableNoChinese?: boolean
}

export interface Dimensions {
  height: number
  width: number
  type: string
}
export enum FileType {
  IMAGE = 0,
  AVATAR = 1,
  BACKGROUND = 2,
  PHOTO = 3,
}
export enum FileLocate {
  Local = 0,
  Online = 1,
}

export declare class File {
  filename: string
  name: string
  mime: string
  info?: Record<string, any>
  dimensions?: Dimensions
  type: number
  locate: 0 | 1
  url?: string
}
export declare class BackupOptions {
  enable: boolean
  SecretId?: string
  SecretKey?: string
  Bucket?: string
  Region: string
}

export interface TokenModel {
  created: string

  token: string

  expired?: Date

  name: string

  id: string
}

export interface BaiduSearchOptions {
  enable?: boolean

  token?: string
}

export interface AlgoliaSearchOptions {
  enable: boolean

  apiKey?: string

  appId?: string

  indexName?: string
}
