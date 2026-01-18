import { computed, ref } from 'vue'
import type { CategoryModel } from '~/models/category'

import { categoriesApi } from '~/api/categories'

export const useCategoryStore = defineStore('category', () => {
  const data = ref<CategoryModel[]>()

  const map = computed(
    () => new Map(data.value?.map((i) => [i.id, i])) || new Map(),
  )

  return {
    data,
    map,
    get(id: string) {
      return map.value.get(id)
    },
    async fetch(force?: boolean) {
      if (!data.value || force) {
        const response = await categoriesApi.getList({ type: 'Category' })
        data.value = response.data
      } else {
        return data.value
      }
    },
  }
})

export { useCategoryStore as CategoryStore }
