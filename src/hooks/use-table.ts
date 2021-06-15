import { PostModel, Pager } from 'models/post'
import { RowKey } from 'naive-ui/lib/data-table/src/interface'
import { ref, reactive, Ref } from 'vue'
import { LocationQueryValue } from 'vue-router'

export type fetchDataFn = (
  page?: string | number | LocationQueryValue[],
  size?: number,
) => Promise<void>
export const useTable = (
  fetchDataFn: (data: Ref<PostModel[]>, pager: Ref<Pager>) => fetchDataFn,
) => {
  const data = ref<PostModel[]>([])
  const pager = ref<Pager>({} as any)
  const sortProps = reactive({
    sortBy: '',
    sortOrder: 0,
  })
  const checkedRowKeys = ref<RowKey[]>([])

  return {
    data,
    pager,
    sortProps,
    checkedRowKeys,
    fetchDataFn: fetchDataFn(data, pager),
  }
}
