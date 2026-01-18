import {
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryKey,
} from '@tanstack/vue-query'
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Pager, PaginateResult } from '~/models/base'

export interface DataTableQueryParams {
  page: number
  size: number
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 0 | 1 | -1
}

export interface UseDataTableOptions<T> {
  /**
   * Query key 工厂函数
   * @param params - 当前查询参数 (page, size, filters, sortBy, sortOrder)
   */
  queryKey: (params: DataTableQueryParams) => QueryKey

  /**
   * 获取数据的函数
   */
  queryFn: (params: DataTableQueryParams) => Promise<PaginateResult<T>>

  /**
   * 每页大小，默认 20
   */
  pageSize?: number

  /**
   * 是否同步路由 query.page，默认 true
   */
  syncRoute?: boolean

  /**
   * 额外的筛选参数（响应式）
   */
  filters?: MaybeRefOrGetter<Record<string, any> | undefined>

  /**
   * 数据转换函数
   */
  transform?: (data: T[]) => T[]

  /**
   * 是否启用查询，默认 true
   */
  enabled?: MaybeRefOrGetter<boolean>
}

export interface UseDataTableReturn<T> {
  /** 数据列表 */
  data: ComputedRef<T[]>
  /** 分页信息 */
  pager: ComputedRef<Pager | undefined>

  /** 是否首次加载中 */
  isLoading: Ref<boolean>
  /** 是否正在获取数据（包括后台刷新） */
  isFetching: Ref<boolean>
  /** 是否有错误 */
  isError: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>

  /** 选中的行 keys */
  checkedRowKeys: Ref<string[]>

  /** 当前页码 */
  currentPage: ComputedRef<number>
  /** 每页大小 */
  pageSize: ComputedRef<number>
  /** 设置页码 */
  setPage: (page: number) => void
  /** 设置每页大小 */
  setPageSize: (size: number) => void

  /** 排序参数 */
  sortProps: Ref<{ sortBy: string; sortOrder: 0 | 1 | -1 }>
  /** 设置排序 */
  setSort: (sortBy: string, sortOrder: 0 | 1 | -1) => void

  /** 刷新数据 */
  refresh: () => Promise<void>
  /** 失效缓存并刷新 */
  invalidate: () => Promise<void>

  // === 兼容旧 API ===
  /** @deprecated 使用 isLoading 代替 */
  loading: ComputedRef<boolean>
  /** @deprecated 使用 refresh 代替 */
  fetchDataFn: () => Promise<void>
}

/**
 * 基于 Vue Query 的数据表格 Hook
 *
 * @example
 * ```ts
 * const {
 *   data,
 *   pager,
 *   isLoading,
 *   checkedRowKeys,
 *   refresh,
 * } = useDataTable<PostModel>({
 *   queryKey: (params) => queryKeys.posts.list(params),
 *   queryFn: (params) => postsApi.getList(params),
 *   pageSize: 20,
 * })
 * ```
 */
export const useDataTable = <T extends { id?: string }>(
  options: UseDataTableOptions<T>,
): UseDataTableReturn<T> => {
  const {
    queryKey,
    queryFn,
    pageSize: defaultPageSize = 20,
    syncRoute = true,
    filters,
    transform,
    enabled,
  } = options

  const route = useRoute()
  const router = useRouter()
  const queryClient = useQueryClient()

  // 当前页码（可从路由同步）
  const currentPage = ref(syncRoute ? Number(route.query.page) || 1 : 1)
  const size = ref(defaultPageSize)

  // 选中的行
  const checkedRowKeys = ref<string[]>([])

  // 排序参数
  const sortProps = ref<{ sortBy: string; sortOrder: 0 | 1 | -1 }>({
    sortBy: '',
    sortOrder: 0,
  })

  // 构建查询参数
  const queryParams = computed(() => ({
    page: currentPage.value,
    size: size.value,
    filters: toValue(filters),
    ...(sortProps.value.sortBy
      ? {
          sortBy: sortProps.value.sortBy,
          sortOrder: sortProps.value.sortOrder,
        }
      : {}),
  }))

  // 使用 Vue Query
  const query = useQuery({
    queryKey: computed(() => queryKey(queryParams.value)),
    queryFn: () => queryFn(queryParams.value),
    placeholderData: keepPreviousData, // 保持旧数据直到新数据加载
    enabled: computed(() => toValue(enabled) ?? true),
  })

  // 转换后的数据
  const data = computed(() => {
    const rawData = query.data.value?.data ?? []
    return transform ? transform(rawData) : rawData
  })

  // 分页信息
  const pager = computed<Pager | undefined>(() => query.data.value?.pagination)

  // 路由同步
  if (syncRoute) {
    // 路由 → 状态
    watch(
      () => route.query.page,
      (newPage) => {
        const page = Number(newPage) || 1
        if (page !== currentPage.value) {
          currentPage.value = page
          checkedRowKeys.value = [] // 切换页面清空选中
        }
      },
    )

    // 状态 → 路由
    watch(currentPage, (page) => {
      if (Number(route.query.page) !== page) {
        router.replace({ query: { ...route.query, page: page.toString() } })
      }
    })
  }

  // 清空选中当 filters 变化时
  watch(
    () => toValue(filters),
    () => {
      checkedRowKeys.value = []
    },
    { deep: true },
  )

  // 设置页码
  const setPage = (page: number) => {
    currentPage.value = page
  }

  // 设置每页大小
  const setPageSize = (newSize: number) => {
    size.value = newSize
    currentPage.value = 1
  }

  // 设置排序
  const setSort = (sortBy: string, sortOrder: 0 | 1 | -1) => {
    sortProps.value = { sortBy, sortOrder }
  }

  // 刷新数据
  const refresh = async () => {
    await query.refetch()
  }

  // 失效缓存并刷新
  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKey({ page: currentPage.value, size: size.value }),
    })
  }

  return {
    // 数据
    data,
    pager,

    // 状态
    isLoading: query.isLoading as Ref<boolean>,
    isFetching: query.isFetching as Ref<boolean>,
    isError: query.isError as Ref<boolean>,
    error: query.error as Ref<Error | null>,

    // 选中行
    checkedRowKeys,

    // 分页
    currentPage: computed(() => currentPage.value),
    pageSize: computed(() => size.value),
    setPage,
    setPageSize,

    // 排序
    sortProps,
    setSort,

    // 操作
    refresh,
    invalidate,

    // 兼容旧 API
    loading: computed(() => query.isLoading.value),
    fetchDataFn: refresh,
  }
}

// === 兼容旧 API 的类型导出 ===
export type { fetchDataFn } from './use-table'
