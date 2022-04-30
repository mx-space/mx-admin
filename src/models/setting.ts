export declare class SeoDto {
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
declare class MailOption {
  port: number
  host: string
}
export declare class MailOptionsDto {
  enable: boolean
  user: string
  pass: string
  options?: MailOption
}
export declare class CommentOptionsDto {
  antiSpam: boolean
  spamKeywords?: string[]
  blockIps?: string[]
  disableNoChinese?: boolean
}
export declare class BackupOptionsDto {
  enable: boolean
  secretId?: string
  secretKey?: string
  bucket?: string
  region: string
}
export declare class BaiduSearchOptionsDto {
  enable: boolean
  token?: string
}
export declare class AlgoliaSearchOptionsDto {
  enable: boolean
  apiKey?: string
  appId?: string
  indexName?: string
}
export declare class AdminExtraDto {
  background?: string
  gaodemapKey?: string
  title?: string
  enableAdminProxy?: boolean
}
export declare class TerminalOptionsDto {
  enable: boolean
  password?: string
  script?: string
}

export declare class FriendLinkOptionsDto {
  allowApply: boolean
}

export declare class TextOptionsDto {
  macros: boolean;
}

export declare abstract class IConfig {
  seo: SeoDto
  url: UrlDto
  mailOptions: MailOptionsDto
  commentOptions: CommentOptionsDto
  friendLinkOptions: FriendLinkOptionsDto
  backupOptions: BackupOptionsDto
  baiduSearchOptions: BaiduSearchOptionsDto
  algoliaSearchOptions: AlgoliaSearchOptionsDto
  adminExtra: AdminExtraDto
  terminalOptions: TerminalOptionsDto
  textOptions: TextOptionsDto;
}
