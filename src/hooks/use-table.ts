import { Pager } from 'models/base'
import qs from 'qs'
import { reactive, ref, Ref } from 'vue'
import { LocationQueryValue } from 'vue-router'

export type fetchDataFn = (
  page?: string | number | LocationQueryValue[],
  size?: number,
  db_query?: string | undefined,
) => Promise<void>
export const useDataTableFetch = <T = any>(
  fetchDataFn: (data: Ref<T[]>, pager: Ref<Pager>) => fetchDataFn,
) => {
  const data: Ref<T[]> = ref<T[]>([]) as any
  const pager = ref<Pager>({} as any)
  const sortProps = reactive({
    sortBy: '',
    sortOrder: 0,
  })
  const checkedRowKeys = ref<string[]>([])
  const loading = ref(false)
  return {
    data,
    pager,
    sortProps,
    checkedRowKeys,
    loading,
    fetchDataFn: async (
      page?: number,
      size?: number,
      db_query?: Record<string, any>,
    ) => {
      loading.value = true
      await fetchDataFn(data, pager)(
        page,
        size,
        db_query ? qs.stringify(db_query) : undefined,
      )
      loading.value = false
    },
  }
}
