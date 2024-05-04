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

  export interface BackupOptionsOption {
    enable: boolean
    endpoint: string
    secretId: string
    secretKey: string
    bucket: string
    region: string
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

  export interface ClerkOptionsOption {
    enable: boolean
    adminUserId: string
    pemKey: string
    secretKey: string
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
