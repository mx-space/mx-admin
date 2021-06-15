export enum CategoryType {
  Category,
  Tag,
}

export interface CategoryModel {
  type: CategoryType
  count: number
  id: string
  created: string
  slug: string
  name: string
  modified: string
}

export interface CategoryResponse {
  data: CategoryModel[]
}

export interface TagModel {
  count: number
  name: string
}
