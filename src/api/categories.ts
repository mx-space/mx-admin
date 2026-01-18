import type { CategoryModel, TagModel } from '~/models/category'
import type { PostModel } from '~/models/post'

import { request } from '~/utils/request'

export interface GetCategoriesParams {
  type?: 'Category' | 'Tag' | 'tag'
}

export interface CreateCategoryData {
  name: string
  slug: string
  type?: number
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CategoryResponse {
  data: CategoryModel[]
}

export interface TagResponse {
  data: TagModel[]
}

export const categoriesApi = {
  // 获取分类列表
  getList: (params?: GetCategoriesParams) =>
    request.get<CategoryResponse>('/categories', { params }),

  // 获取单个分类
  getById: (id: string) =>
    request.get<{ data: CategoryModel }>(`/categories/${id}`),

  // 创建分类
  create: (data: CreateCategoryData) =>
    request.post<{ data: CategoryModel }>('/categories', { data }),

  // 更新分类
  update: (id: string, data: UpdateCategoryData) =>
    request.put<CategoryModel>(`/categories/${id}`, { data }),

  // 删除分类
  delete: (id: string) => request.delete<void>(`/categories/${id}`),

  // 获取标签列表
  getTags: () =>
    request.get<TagResponse>('/categories', { params: { type: 'tag' } }),

  // 获取标签关联的文章
  getPostsByTag: (tagName: string) =>
    request.get<{ data: PostModel[] }>(`/categories/${tagName}`, {
      params: { tag: 'true' },
    }),
}
