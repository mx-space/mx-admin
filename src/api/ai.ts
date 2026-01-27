import { request } from '~/utils/request'

// AI Writer 类型
export enum AiQueryType {
  TitleSlug = 'title-slug',
  Slug = 'slug',
}

export interface AIWriterGenerateData {
  type: AiQueryType
  text?: string // 当 type 为 title-slug 时需要
  title?: string // 当 type 为 slug 时需要
}

export interface AIWriterGenerateResponse {
  title?: string
  slug?: string
}

// AI Summary 类型
export interface AISummary {
  id: string
  created: string
  summary: string
  hash: string
  refId: string
  lang: string
}

export interface GroupedSummary {
  type: string
  items: AISummary[]
}

export interface ArticleInfo {
  type: 'Post' | 'Note' | 'Page' | 'Recently'
  title: string
  id: string
}

export interface GroupedSummaryData {
  article: ArticleInfo
  summaries: AISummary[]
}

export interface GroupedSummaryResponse {
  data: GroupedSummaryData[]
  pagination: {
    total: number
    currentPage: number
    totalPage: number
    size: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface SummaryByRefResponse {
  summaries: AISummary[]
  article: {
    type: 'Post' | 'Note' | 'Page' | 'Recently'
    document: { title: string }
  }
}

// AI Translation 类型
export interface AITranslation {
  id: string
  created: string
  hash: string
  refId: string
  refType: string
  lang: string
  sourceLang: string
  title: string
  text: string
  summary?: string
  tags?: string[]
}

export interface GroupedTranslationData {
  article: ArticleInfo
  translations: AITranslation[]
}

export interface GroupedTranslationResponse {
  data: GroupedTranslationData[]
  pagination: {
    total: number
    currentPage: number
    totalPage: number
    size: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface TranslationByRefResponse {
  translations: AITranslation[]
  article: {
    type: 'Post' | 'Note' | 'Page' | 'Recently'
    document: { title: string }
  }
}

export interface ProviderModel {
  id: string
  name: string
}

export interface ProviderModelsResponse {
  provider: string
  models: ProviderModel[]
}

export interface AITestData {
  providerId: string
  type: string
  apiKey?: string
  endpoint?: string
  model?: string
}

export interface AIModelListData {
  providerId: string
  type: string
  apiKey?: string
  endpoint?: string
}

export const aiApi = {
  // AI 写作生成标题/Slug
  writerGenerate: (data: AIWriterGenerateData) =>
    request.post<AIWriterGenerateResponse>('/ai/writer/generate', { data }),

  // 获取摘要列表（分组）
  getSummariesGrouped: (params?: { page?: number; size?: number }) =>
    request.get<GroupedSummaryResponse>('/ai/summaries/grouped', { params }),

  // 根据引用获取摘要
  getSummaryByRef: (refId: string) =>
    request.get<SummaryByRefResponse>(`/ai/summaries/ref/${refId}`),

  // 删除摘要
  deleteSummary: (id: string) => request.delete<void>(`/ai/summaries/${id}`),

  // 更新摘要
  updateSummary: (id: string, data: { summary: string }) =>
    request.patch<AISummary>(`/ai/summaries/${id}`, { data }),

  // 生成摘要
  generateSummary: (data: { refId: string; lang: string }) =>
    request.post<AISummary | null>('/ai/summaries/generate', { data }),

  // 获取可用模型列表
  getModels: () => request.get<ProviderModelsResponse[]>('/ai/models'),

  // 获取指定 provider 的模型列表
  getModelList: (data: AIModelListData) =>
    request.post<{ models: ProviderModel[]; error?: string }>(
      '/ai/models/list',
      { data },
    ),

  // 测试 AI 配置
  testConfig: (data: AITestData) => request.post<void>('/ai/test', { data }),

  // === AI Translation ===

  // 获取翻译列表（分组）
  getTranslationsGrouped: (params?: { page?: number; size?: number }) =>
    request.get<GroupedTranslationResponse>('/ai/translations/grouped', {
      params,
    }),

  // 根据引用获取翻译
  getTranslationsByRef: (refId: string) =>
    request.get<TranslationByRefResponse>(`/ai/translations/ref/${refId}`),

  // 删除翻译
  deleteTranslation: (id: string) =>
    request.delete<void>(`/ai/translations/${id}`),

  // 更新翻译
  updateTranslation: (
    id: string,
    data: { title?: string; text?: string; summary?: string; tags?: string[] },
  ) => request.patch<AITranslation>(`/ai/translations/${id}`, { data }),

  // 生成翻译
  generateTranslation: (data: { refId: string; targetLanguages?: string[] }) =>
    request.post<AITranslation[]>('/ai/translations/generate', { data }),
}
