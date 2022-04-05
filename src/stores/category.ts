import { CategoryModel, CategoryResponse } from 'models/category'
import { RESTManager } from 'utils/rest'
import { computed, ref } from 'vue'

export function CategoryStore() {
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
        const response = (await RESTManager.api.categories.get({
          params: {
            type: 'Category',
          },
        })) as CategoryResponse

        data.value = response.data
      } else {
        return data.value
      }
    },
  }
}
