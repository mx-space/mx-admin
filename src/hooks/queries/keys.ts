/**
 * Query Keys 管理
 * 用于 Vue Query 的缓存键管理，支持类型安全和层级结构
 */

export const queryKeys = {
  // === 文章 ===
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },

  // === 笔记 ===
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.notes.lists(), params] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
  },

  // === 页面 ===
  pages: {
    all: ['pages'] as const,
    lists: () => [...queryKeys.pages.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.pages.lists(), params] as const,
    details: () => [...queryKeys.pages.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.pages.details(), id] as const,
  },

  // === 分类 ===
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.categories.all, 'detail', id] as const,
  },

  // === 标签 ===
  tags: {
    all: ['tags'] as const,
    list: () => [...queryKeys.tags.all, 'list'] as const,
    postsByTag: (tagName: string) =>
      [...queryKeys.tags.all, 'posts', tagName] as const,
  },

  // === 评论 ===
  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    list: (state?: number, params?: object) =>
      [...queryKeys.comments.lists(), { state, ...params }] as const,
    detail: (id: string) => [...queryKeys.comments.all, 'detail', id] as const,
  },

  // === 友链 ===
  links: {
    all: ['links'] as const,
    lists: () => [...queryKeys.links.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.links.lists(), params] as const,
    stateCount: () => [...queryKeys.links.all, 'state-count'] as const,
    detail: (id: string) => [...queryKeys.links.all, 'detail', id] as const,
  },

  // === 草稿 ===
  drafts: {
    all: ['drafts'] as const,
    lists: () => [...queryKeys.drafts.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.drafts.lists(), params] as const,
    detail: (id: string) => [...queryKeys.drafts.all, 'detail', id] as const,
    byRef: (refType: string, refId: string) =>
      [...queryKeys.drafts.all, 'ref', refType, refId] as const,
    history: (id: string) => [...queryKeys.drafts.all, 'history', id] as const,
  },

  // === 专栏 ===
  topics: {
    all: ['topics'] as const,
    list: () => [...queryKeys.topics.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.topics.all, 'detail', id] as const,
  },

  // === 一言 ===
  says: {
    all: ['says'] as const,
    lists: () => [...queryKeys.says.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.says.lists(), params] as const,
    detail: (id: string) => [...queryKeys.says.all, 'detail', id] as const,
  },

  // === 项目 ===
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.projects.lists(), params] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },

  // === 用户 ===
  user: {
    all: ['user'] as const,
    master: () => [...queryKeys.user.all, 'master'] as const,
    sessions: () => [...queryKeys.user.all, 'sessions'] as const,
    allowLogin: () => [...queryKeys.user.all, 'allow-login'] as const,
  },

  // === 认证 ===
  auth: {
    all: ['auth'] as const,
    tokens: () => [...queryKeys.auth.all, 'tokens'] as const,
    passkeys: () => [...queryKeys.auth.all, 'passkeys'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // === 备份 ===
  backup: {
    all: ['backup'] as const,
    list: () => [...queryKeys.backup.all, 'list'] as const,
  },

  // === 统计 ===
  aggregate: {
    all: ['aggregate'] as const,
    stat: () => [...queryKeys.aggregate.all, 'stat'] as const,
    categoryDistribution: () =>
      [...queryKeys.aggregate.all, 'category-distribution'] as const,
    publicationTrend: () =>
      [...queryKeys.aggregate.all, 'publication-trend'] as const,
    tagCloud: () => [...queryKeys.aggregate.all, 'tag-cloud'] as const,
    topArticles: () => [...queryKeys.aggregate.all, 'top-articles'] as const,
    commentActivity: () =>
      [...queryKeys.aggregate.all, 'comment-activity'] as const,
    siteWords: () => [...queryKeys.aggregate.all, 'site-words'] as const,
    readAndLike: () => [...queryKeys.aggregate.all, 'read-and-like'] as const,
  },

  // === 分析 ===
  analyze: {
    all: ['analyze'] as const,
    lists: () => [...queryKeys.analyze.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.analyze.lists(), params] as const,
    aggregate: () => [...queryKeys.analyze.all, 'aggregate'] as const,
  },

  // === 活动 ===
  activity: {
    all: ['activity'] as const,
    lists: () => [...queryKeys.activity.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.activity.lists(), params] as const,
    readingRank: (range?: [number, number]) =>
      [...queryKeys.activity.all, 'reading-rank', range] as const,
    topReadings: () => [...queryKeys.activity.all, 'top-readings'] as const,
    recently: (params?: object) =>
      [...queryKeys.activity.all, 'recently', params] as const,
  },

  // === AI ===
  ai: {
    all: ['ai'] as const,
    summaries: () => [...queryKeys.ai.all, 'summaries'] as const,
    summariesGrouped: (params?: object) =>
      [...queryKeys.ai.summaries(), 'grouped', params] as const,
    summaryByRef: (refId: string) =>
      [...queryKeys.ai.summaries(), 'ref', refId] as const,
    translations: () => [...queryKeys.ai.all, 'translations'] as const,
    translationsGrouped: (params?: object) =>
      [...queryKeys.ai.translations(), 'grouped', params] as const,
    translationsByRef: (refId: string) =>
      [...queryKeys.ai.translations(), 'ref', refId] as const,
    models: () => [...queryKeys.ai.all, 'models'] as const,
    tasks: () => [...queryKeys.ai.all, 'tasks'] as const,
    tasksList: (params?: object) =>
      [...queryKeys.ai.tasks(), 'list', params] as const,
    task: (taskId: string) => [...queryKeys.ai.tasks(), taskId] as const,
  },

  // === Cron Task ===
  cronTask: {
    all: ['cronTask'] as const,
    definitions: () => [...queryKeys.cronTask.all, 'definitions'] as const,
    tasks: () => [...queryKeys.cronTask.all, 'tasks'] as const,
    tasksList: (params?: object) =>
      [...queryKeys.cronTask.tasks(), 'list', params] as const,
    task: (taskId: string) => [...queryKeys.cronTask.tasks(), taskId] as const,
  },

  // === 配置 ===
  options: {
    all: ['options'] as const,
    list: () => [...queryKeys.options.all, 'list'] as const,
    detail: (key: string) => [...queryKeys.options.all, key] as const,
    schema: () => [...queryKeys.options.all, 'schema'] as const,
  },

  // === 片段 ===
  snippets: {
    all: ['snippets'] as const,
    lists: () => [...queryKeys.snippets.all, 'list'] as const,
    list: (params?: object) => [...queryKeys.snippets.lists(), params] as const,
    detail: (id: string) => [...queryKeys.snippets.all, 'detail', id] as const,
  },

  // === 系统 ===
  system: {
    all: ['system'] as const,
    appInfo: () => [...queryKeys.system.all, 'app-info'] as const,
    init: () => [...queryKeys.system.all, 'init'] as const,
  },

  // === Webhook ===
  webhooks: {
    all: ['webhooks'] as const,
    list: () => [...queryKeys.webhooks.all, 'list'] as const,
    events: () => [...queryKeys.webhooks.all, 'events'] as const,
    dispatches: (hookId: string) =>
      [...queryKeys.webhooks.all, 'dispatches', hookId] as const,
  },

  // === Meta 预设 ===
  metaPresets: {
    all: ['metaPresets'] as const,
    list: () => [...queryKeys.metaPresets.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.metaPresets.all, 'detail', id] as const,
  },
}
