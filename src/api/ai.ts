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
  aiModel?: string
  aiProvider?: string
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

// AI Task 类型
export enum AITaskType {
  Summary = 'ai:summary',
  Translation = 'ai:translation',
  TranslationBatch = 'ai:translation:batch',
  TranslationAll = 'ai:translation:all',
}

export enum AITaskStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  PartialFailed = 'partial_failed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface AITaskLog {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface SubTaskStats {
  total: number
  completed: number
  failed: number
  running: number
  pending: number
}

export interface AITask {
  id: string
  type: AITaskType
  status: AITaskStatus
  payload: Record<string, unknown>
  groupId?: string

  progress?: number
  progressMessage?: string
  totalItems?: number
  completedItems?: number
  tokensGenerated?: number

  createdAt: number
  startedAt?: number
  completedAt?: number

  result?: unknown
  error?: string
  logs: AITaskLog[]

  workerId?: string
  retryCount: number

  // For batch tasks: sub-task statistics
  subTaskStats?: SubTaskStats
}

export interface AITasksResponse {
  data: AITask[]
  total: number
}

export interface CreateTaskResponse {
  taskId: string
  created: boolean
}

export const aiApi = {
  // AI 写作生成标题/Slug
  writerGenerate: (data: AIWriterGenerateData) =>
    request.post<AIWriterGenerateResponse>('/ai/writer/generate', { data }),

  // 获取摘要列表（分组）
  getSummariesGrouped: (params?: {
    page?: number
    size?: number
    search?: string
  }) =>
    request.get<GroupedSummaryResponse>('/ai/summaries/grouped', { params }),

  // 根据引用获取摘要
  getSummaryByRef: (refId: string) =>
    request.get<SummaryByRefResponse>(`/ai/summaries/ref/${refId}`),

  // 删除摘要
  deleteSummary: (id: string) => request.delete<void>(`/ai/summaries/${id}`),

  // 更新摘要
  updateSummary: (id: string, data: { summary: string }) =>
    request.patch<AISummary>(`/ai/summaries/${id}`, { data }),

  // 生成摘要（创建任务）
  createSummaryTask: (data: { refId: string; lang?: string }) =>
    request.post<CreateTaskResponse>('/ai/summaries/task', { data }),

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
  getTranslationsGrouped: (params?: {
    page?: number
    size?: number
    search?: string
  }) =>
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

  // 生成翻译（创建任务）
  createTranslationTask: (data: {
    refId: string
    targetLanguages?: string[]
  }) => request.post<CreateTaskResponse>('/ai/translations/task', { data }),

  // 批量生成翻译（创建任务）
  createTranslationBatchTask: (data: {
    refIds: string[]
    targetLanguages?: string[]
  }) =>
    request.post<CreateTaskResponse>('/ai/translations/task/batch', { data }),

  // 为全部文章生成翻译（创建任务）
  createTranslationAllTask: (data: { targetLanguages?: string[] }) =>
    request.post<CreateTaskResponse>('/ai/translations/task/all', { data }),

  // === AI Tasks ===

  // 获取任务列表
  getTasks: (params?: {
    status?: AITaskStatus
    type?: AITaskType
    page?: number
    size?: number
  }) => request.get<AITasksResponse>('/ai/tasks', { params }),

  // 获取单个任务
  getTask: (taskId: string) => request.get<AITask>(`/ai/tasks/${taskId}`),

  // 重试任务
  retryTask: (taskId: string) =>
    request.post<CreateTaskResponse>(`/ai/tasks/${taskId}/retry`),

  // 取消任务
  cancelTask: (taskId: string) =>
    request.delete<{ success: boolean }>(`/ai/tasks/${taskId}`),

  // 批量删除任务
  deleteTasks: (params: {
    status?: AITaskStatus
    type?: AITaskType
    before: number
  }) => request.delete<{ deleted: number }>('/ai/tasks', { params }),

  // 获取组内所有任务（子任务）
  getTasksByGroupId: (groupId: string) =>
    request.get<AITask[]>(`/ai/tasks/group/${groupId}`),

  // 取消组内所有任务
  cancelTasksByGroupId: (groupId: string) =>
    request.delete<{ cancelled: number }>(`/ai/tasks/group/${groupId}`),
}
