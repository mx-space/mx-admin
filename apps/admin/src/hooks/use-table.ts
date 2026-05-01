import qs from 'qs'
import { reactive, ref } from 'vue'
import type { Pager } from '~/models/base'
import type { Ref } from 'vue'
import type { LocationQueryValue } from 'vue-router'

// 内部回调函数类型 - 接收字符串化后的 db_query
type InternalFetchDataFn = (
  page?: string | number | LocationQueryValue[],
  size?: number,
  db_query?: string | undefined,
) => Promise<any>

// 对外暴露的 fetchDataFn 类型 - 接收对象形式的 db_query
export type fetchDataFn = (
  page?: string | number | LocationQueryValue[],
  size?: number,
  db_query?: Record<string, any>,
) => Promise<any>

export const useDataTableFetch = <T = any>(
  fetchDataFn: (data: Ref<T[]>, pager: Ref<Pager>) => InternalFetchDataFn,
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
      page?: string | number | LocationQueryValue[],
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
