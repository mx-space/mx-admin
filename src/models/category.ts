import type { PostModel } from './post'

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

export type CategoryWithChildrenModel = CategoryModel & {
  children: PickedPostModelInCategoryChildren[]
}

export type PickedPostModelInCategoryChildren = Pick<
  PostModel,
  'id' | 'title' | 'slug' | 'modified' | 'created'
>

export interface TagModel {
  count: number
  name: string
}
