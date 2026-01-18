import { request } from '~/utils/request'

export interface DependencyGraph {
  dependencies: Record<string, string>
}

export const dependenciesApi = {
  // 获取依赖图
  getGraph: () => request.get<DependencyGraph>('/dependencies/graph'),
}
