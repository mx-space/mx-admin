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

export const categoriesApi = {
  // 获取分类列表（响应会被自动解包）
  getList: (params?: GetCategoriesParams) =>
    request.get<CategoryModel[]>('/categories', { params }),

  // 获取单个分类（响应会被自动解包）
  getById: (id: string) => request.get<CategoryModel>(`/categories/${id}`),

  // 创建分类（响应会被自动解包）
  create: (data: CreateCategoryData) =>
    request.post<CategoryModel>('/categories', { data }),

  // 更新分类
  update: (id: string, data: UpdateCategoryData) =>
    request.put<CategoryModel>(`/categories/${id}`, { data }),

  // 删除分类
  delete: (id: string) => request.delete<void>(`/categories/${id}`),

  // 获取标签列表（响应会被自动解包）
  getTags: () =>
    request.get<TagModel[]>('/categories', { params: { type: 'tag' } }),

  // 获取标签关联的文章（响应会被自动解包）
  getPostsByTag: (tagName: string) =>
    request.get<PostModel[]>(`/categories/${tagName}`, {
      params: { tag: 'true' },
    }),
}
