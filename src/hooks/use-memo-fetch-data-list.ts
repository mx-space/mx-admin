import type { Ref } from 'vue'

import type { PaginateResult } from '@mx-space/api-client'

export const createMemoDataListFetchHook = <
  T extends { id: string },
  FetchDataType extends T,
>(
  fetchFn: (page?: number) => Promise<PaginateResult<FetchDataType>>,
) => {
  return createGlobalState(() => {
    const datalist: Ref<T[]> = ref([])
    const idSet = new Set<string>()
    let currentPage = 0
    let isEnd = false

    const loading = ref(true)
    const fetch = async (page = 1) => {
      loading.value = true
      const { data, pagination } = await fetchFn(page)

      datalist.value.push(...data.filter((dataItem) => !idSet.has(dataItem.id)))
      loading.value = false
      data.forEach((i) => idSet.add(i.id))

      currentPage = pagination.currentPage
      if (!pagination.hasNextPage) {
        isEnd = true
      }
    }

    return {
      loading,
      datalist,
      append(data: T[]) {
        for (const item of data) {
          if (!idSet.has(item.id)) {
            idSet.add(item.id)
            datalist.value.push({ ...item })
          }
        }
      },
      fetchNext: () => {
        if (isEnd) {
          return
        }
        fetch(currentPage + 1)
      },
      refresh() {
        this.reset()

        nextTick(() => {
          this.fetchNext()
        })
      },
      reset() {
        currentPage = 0
        isEnd = false
        datalist.value = []
        idSet.clear()
      },
    }
  })
}
