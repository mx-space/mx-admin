import type { ProjectModel, ProjectResponse } from '~/models/project'
import { request } from '~/utils/request'

export interface GetProjectsParams {
  page?: number
  size?: number
}

export interface CreateProjectData {
  name: string
  description: string
  text: string
  previewUrl?: string
  docUrl?: string
  projectUrl?: string
  images?: string[]
  avatar?: string
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

export const projectsApi = {
  // 获取项目列表
  getList: (params?: GetProjectsParams) =>
    request.get<ProjectResponse>('/projects', { params }),

  // 获取单个项目
  getById: (id: string) => request.get<ProjectModel>(`/projects/${id}`),

  // 创建项目
  create: (data: CreateProjectData) =>
    request.post<ProjectModel>('/projects', { data }),

  // 更新项目
  update: (id: string, data: UpdateProjectData) =>
    request.put<ProjectModel>(`/projects/${id}`, { data }),

  // 删除项目
  delete: (id: string) => request.delete<void>(`/projects/${id}`),
}
