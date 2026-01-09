export module MxServerOptions {
  export interface SeoOption {
    title: string
    description: string
    keywords: string[]
  }

  export interface UrlOption {
    webUrl: string
    adminUrl: string
    serverUrl: string
    wsUrl: string
  }

  export interface MailOption {
    port: number
    host: string
    secure: boolean
  }

  export interface MailOptionsOption {
    enable: boolean
    user: string
    pass: string
    options: MailOption
  }

  export interface CommentOptionsOption {
    antiSpam: boolean
    disableComment: boolean
    spamKeywords: string[]
    blockIps: string[]
    disableNoChinese: boolean
    commentShouldAudit: boolean
    recordIpLocation: boolean
  }

  export interface S3OptionsOption {
    endpoint: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    region: string
    customDomain: string
    pathStyleAccess: boolean
  }

  export interface BackupOptionsOption {
    enable: boolean
    path: string
  }

  export interface ImageBedOptionsOption {
    enable: boolean
    path: string
    allowedFormats: string
    maxSizeMB: number
  }

  export interface BaiduSearchOptionsOption {
    enable: boolean
    token: string
  }

  export interface AlgoliaSearchOptionsOption {
    enable: boolean
    apiKey: string
    appId: string
    indexName: string
  }

  export interface AdminExtraOption {
    enableAdminProxy: boolean
    background: string
    gaodemapKey: string
  }

  export interface FriendLinkOptionsOption {
    allowApply: boolean
  }

  export interface TextOptionsOption {
    macros: boolean
  }

  export interface BarkOptionsOption {
    enable: boolean
    key: string
    serverUrl: string
    enableComment: boolean
  }

  export interface FeatureListOption {
    emailSubscribe: boolean
  }

  export interface ThirdPartyServiceIntegrationOption {
    xLogSiteId: string
  }

  export interface AuthSecurityOption {
    disablePasswordLogin: boolean
  }

  export interface AIOption {
    openAiKey: string
    openAiEndpoint: string
    openAiPreferredModel: string
    enableSummary: boolean
    enableAutoGenerateSummary: boolean
  }
}
