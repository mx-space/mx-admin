import {
  CheckCircle2 as CheckIcon,
  ExternalLink as ExternalLinkIcon,
  Hammer as ForceRebuildIcon,
  Layers as IncrementalRebuildIcon,
  Loader2 as LoaderIcon,
  RefreshCw as RefreshIcon,
  RotateCcw as RetryIcon,
  Search as SearchIcon,
  CircleAlert as UnsyncIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NInput,
  NPagination,
  NPopconfirm,
  NScrollbar,
  NSelect,
  NTag,
  NTooltip,
} from 'naive-ui'
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import type {
  SearchDocumentAdminRow,
  SearchIndexRefType,
} from '~/models/search-index'
import type { PropType } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { searchIndexApi } from '~/api/search-index'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { RelativeTime } from '~/components/time/relative-time'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/hooks/use-layout'

const refTypeOptions: Array<{
  label: string
  value: SearchIndexRefType | undefined
}> = [
  { label: '全部类型', value: undefined },
  { label: '博文 post', value: 'post' },
  { label: '手记 note', value: 'note' },
  { label: '页面 page', value: 'page' },
]

const refTypeLabel: Record<string, string> = {
  post: '博文',
  note: '手记',
  page: '页面',
}

const refTypeTone: Record<string, 'info' | 'success' | 'warning' | 'default'> =
  {
    post: 'info',
    note: 'success',
    page: 'warning',
  }

const buildEditUrl = (refType: string, refId: string): string | null => {
  switch (refType) {
    case 'post':
      return `/posts/edit?id=${encodeURIComponent(refId)}`
    case 'note':
      return `/notes/edit?id=${encodeURIComponent(refId)}`
    case 'page':
      return `/pages/edit?id=${encodeURIComponent(refId)}`
    default:
      return null
  }
}

export default defineComponent({
  name: 'SearchIndexAdminPage',
  setup() {
    const queryClient = useQueryClient()

    const refTypeFilter = ref<SearchIndexRefType | undefined>(undefined)
    const langFilter = ref<string>('')
    const keywordRaw = ref<string>('')
    const keywordCommitted = ref<string>('')
    const pageRef = ref(1)
    const sizeRef = ref(20)

    const queryParams = computed(() => ({
      refType: refTypeFilter.value,
      lang: langFilter.value || undefined,
      keyword: keywordCommitted.value || undefined,
      page: pageRef.value,
      size: sizeRef.value,
    }))

    const { data, isPending, isFetching, refetch } = useQuery({
      queryKey: computed(() => queryKeys.searchIndex.list(queryParams.value)),
      queryFn: () => searchIndexApi.listDocuments(queryParams.value),
      placeholderData: (prev) => prev,
    })

    const rows = computed<SearchDocumentAdminRow[]>(
      () => data.value?.data || [],
    )
    const total = computed(() => data.value?.pagination.total || 0)
    const pageCount = computed(() => data.value?.pagination.totalPage || 1)

    const refTypeDistribution = computed(() => {
      const map = new Map<string, number>()
      for (const r of rows.value) {
        map.set(r.refType, (map.get(r.refType) ?? 0) + 1)
      }
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    })

    const langDistribution = computed(() => {
      const map = new Map<string, number>()
      for (const r of rows.value) {
        const key = r.lang || '—'
        map.set(key, (map.get(key) ?? 0) + 1)
      }
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    })

    const unsyncCount = computed(
      () => rows.value.filter((r) => !r.inSync).length,
    )

    const rebuildMutation = useMutation({
      mutationFn: ({ refType, refId }: { refType: string; refId: string }) =>
        searchIndexApi.rebuildOne(refType, refId),
      onSuccess: (result) => {
        toast.success(`已重建 ${result.rebuilt} 行`)
        queryClient.invalidateQueries({ queryKey: queryKeys.searchIndex.all })
      },
      onError: (e: any) => {
        toast.error(e?.message || '重建失败')
      },
    })

    const rebuildAllMutation = useMutation({
      mutationFn: (force: boolean) => searchIndexApi.rebuildAll(force),
      onSuccess: (r, force) => {
        toast.success(
          `${force ? '全量' : '增量'}重建完成 · total ${r.total} · +${r.created} ~${r.updated} -${r.deleted} =${r.skipped}`,
        )
        queryClient.invalidateQueries({ queryKey: queryKeys.searchIndex.all })
      },
      onError: (e: any) => {
        toast.error(e?.message || '重建失败')
      },
    })

    const isRowRebuilding = (row: SearchDocumentAdminRow) =>
      rebuildMutation.isPending.value &&
      rebuildMutation.variables.value?.refType === row.refType &&
      rebuildMutation.variables.value?.refId === row.refId

    const commitKeyword = () => {
      keywordCommitted.value = keywordRaw.value.trim()
      pageRef.value = 1
    }

    const resetFilters = () => {
      refTypeFilter.value = undefined
      langFilter.value = ''
      keywordRaw.value = ''
      keywordCommitted.value = ''
      pageRef.value = 1
    }

    const { setActions } = useLayout()
    watchEffect(() => {
      const isRebuildingAll = rebuildAllMutation.isPending.value
      setActions(
        <div class="flex items-center gap-2">
          <span class="hidden text-xs tabular-nums text-neutral-500 md:inline">
            共 {total.value} 条
          </span>
          <NPopconfirm
            positiveText="增量重建"
            negativeText="取消"
            onPositiveClick={() => rebuildAllMutation.mutate(false)}
          >
            {{
              trigger: () => (
                <HeaderActionButton
                  icon={
                    isRebuildingAll &&
                    rebuildAllMutation.variables.value === false ? (
                      <LoaderIcon class="animate-spin" />
                    ) : (
                      <IncrementalRebuildIcon />
                    )
                  }
                  name="增量重建"
                  variant="info"
                  disabled={isRebuildingAll}
                />
              ),
              default: () => (
                <span>
                  按 sourceHash 比对，仅 upsert 变更行并清理孤立条目。
                </span>
              ),
            }}
          </NPopconfirm>
          <NPopconfirm
            positiveText="全量重建"
            negativeText="取消"
            onPositiveClick={() => rebuildAllMutation.mutate(true)}
          >
            {{
              trigger: () => (
                <HeaderActionButton
                  icon={
                    isRebuildingAll &&
                    rebuildAllMutation.variables.value === true ? (
                      <LoaderIcon class="animate-spin" />
                    ) : (
                      <ForceRebuildIcon />
                    )
                  }
                  name="全量重建 (force)"
                  variant="warning"
                  disabled={isRebuildingAll}
                />
              ),
              default: () => (
                <span class="text-amber-600 dark:text-amber-400">
                  将清空 search
                  表后重建全部文档，搜索功能将短暂不可用，确认继续？
                </span>
              ),
            }}
          </NPopconfirm>
          <HeaderActionButton
            icon={
              isFetching.value ? (
                <LoaderIcon class="animate-spin" />
              ) : (
                <RefreshIcon />
              )
            }
            name="刷新"
            onClick={() => refetch()}
          />
        </div>,
      )
    })

    return () => (
      <div class="flex h-full flex-col">
        <NScrollbar class="min-h-0 flex-1">
          <div class="space-y-4 p-4">
            <StatsBar
              total={total.value}
              refTypeDistribution={refTypeDistribution.value}
              langDistribution={langDistribution.value}
              unsync={unsyncCount.value}
              currentPageSize={rows.value.length}
            />

            <FilterBar
              refType={refTypeFilter.value}
              lang={langFilter.value}
              keyword={keywordRaw.value}
              onRefTypeChange={(v) => {
                refTypeFilter.value = v
                pageRef.value = 1
              }}
              onLangChange={(v) => {
                langFilter.value = v
                pageRef.value = 1
              }}
              onKeywordInput={(v) => (keywordRaw.value = v)}
              onKeywordCommit={commitKeyword}
              onReset={resetFilters}
            />

            {isPending.value && rows.value.length === 0 ? (
              <div class="flex items-center justify-center py-16">
                <LoaderIcon class="size-5 animate-spin text-neutral-400" />
              </div>
            ) : rows.value.length === 0 ? (
              <EmptyState />
            ) : (
              <div class="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                <table class="w-full text-sm">
                  <thead class="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium">类型</th>
                      <th class="px-3 py-2 text-left font-medium">refId</th>
                      <th class="px-3 py-2 text-left font-medium">语言</th>
                      <th class="px-3 py-2 text-left font-medium">标题</th>
                      <th class="px-3 py-2 text-left font-medium">
                        sourceHash
                      </th>
                      <th class="px-3 py-2 text-left font-medium">同步</th>
                      <th class="px-3 py-2 text-left font-medium">已有语言</th>
                      <th class="px-3 py-2 text-left font-medium">最后修改</th>
                      <th class="px-3 py-2 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {rows.value.map((row) => (
                      <IndexRow
                        key={row.id}
                        row={row}
                        rebuilding={isRowRebuilding(row)}
                        onRebuild={() =>
                          rebuildMutation.mutate({
                            refType: row.refType,
                            refId: row.refId,
                          })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </NScrollbar>

        {pageCount.value > 1 && (
          <div class="flex shrink-0 items-center justify-end border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <NPagination
              page={pageRef.value}
              pageCount={pageCount.value}
              pageSize={sizeRef.value}
              onUpdatePage={(p) => (pageRef.value = p)}
              showSizePicker
              pageSizes={[10, 20, 50, 100]}
              onUpdatePageSize={(s) => {
                sizeRef.value = s
                pageRef.value = 1
              }}
            />
          </div>
        )}
      </div>
    )
  },
})

// ======================== Stats bar ========================

const StatsBar = defineComponent({
  props: {
    total: { type: Number, required: true },
    refTypeDistribution: {
      type: Array as PropType<Array<[string, number]>>,
      required: true,
    },
    langDistribution: {
      type: Array as PropType<Array<[string, number]>>,
      required: true,
    },
    unsync: { type: Number, required: true },
    currentPageSize: { type: Number, required: true },
  },
  setup(props) {
    return () => (
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div class="flex items-baseline gap-1.5">
          <span class="text-xs text-neutral-500">总索引行</span>
          <span class="text-base font-semibold tabular-nums">
            {props.total}
          </span>
        </div>
        <div class="hidden h-4 w-px bg-neutral-200 sm:block dark:bg-neutral-700" />
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-neutral-500">类型 (本页)</span>
          <div class="flex flex-wrap items-center gap-1">
            {props.refTypeDistribution.length === 0 ? (
              <span class="text-xs text-neutral-400">—</span>
            ) : (
              props.refTypeDistribution.map(([k, v]) => (
                <NTag key={k} size="small" type={refTypeTone[k] ?? 'default'}>
                  {(refTypeLabel[k] ?? k) + ' '}
                  <span class="tabular-nums">{v}</span>
                </NTag>
              ))
            )}
          </div>
        </div>
        <div class="hidden h-4 w-px bg-neutral-200 sm:block dark:bg-neutral-700" />
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-neutral-500">语言 (本页)</span>
          <div class="flex flex-wrap items-center gap-1">
            {props.langDistribution.length === 0 ? (
              <span class="text-xs text-neutral-400">—</span>
            ) : (
              props.langDistribution.map(([k, v]) => (
                <NTag key={k} size="small">
                  {k + ' '}
                  <span class="tabular-nums">{v}</span>
                </NTag>
              ))
            )}
          </div>
        </div>
        <div class="hidden h-4 w-px bg-neutral-200 sm:block dark:bg-neutral-700" />
        <div class="flex items-baseline gap-1.5">
          <span class="text-xs text-neutral-500">未同步 (本页)</span>
          <span
            class={[
              'text-base font-semibold tabular-nums',
              props.unsync > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-neutral-900 dark:text-neutral-100',
            ]}
          >
            {props.unsync} / {props.currentPageSize}
          </span>
        </div>
      </div>
    )
  },
})

// ======================== Filter bar ========================

const FilterBar = defineComponent({
  props: {
    refType: { type: String as PropType<SearchIndexRefType | undefined> },
    lang: { type: String, required: true },
    keyword: { type: String, required: true },
    onRefTypeChange: {
      type: Function as PropType<(v: SearchIndexRefType | undefined) => void>,
      required: true,
    },
    onLangChange: {
      type: Function as PropType<(v: string) => void>,
      required: true,
    },
    onKeywordInput: {
      type: Function as PropType<(v: string) => void>,
      required: true,
    },
    onKeywordCommit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onReset: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="flex flex-wrap items-center gap-2">
        <NSelect
          size="small"
          style={{ width: '140px' }}
          value={props.refType}
          options={refTypeOptions}
          onUpdateValue={(v) => props.onRefTypeChange(v as any)}
        />
        <NInput
          size="small"
          style={{ width: '120px' }}
          placeholder="语言 (zh/en…)"
          value={props.lang}
          onUpdateValue={(v) => props.onLangChange(v)}
          clearable
        />
        <NInput
          size="small"
          style={{ width: '240px' }}
          placeholder="关键词搜索 标题/正文"
          value={props.keyword}
          onUpdateValue={(v) => props.onKeywordInput(v)}
          onKeyup={(e: KeyboardEvent) => {
            if (e.key === 'Enter') props.onKeywordCommit()
          }}
          clearable
        >
          {{
            prefix: () => (
              <SearchIcon
                class="size-3.5 text-neutral-400"
                aria-hidden="true"
              />
            ),
          }}
        </NInput>
        <NButton size="small" secondary onClick={() => props.onKeywordCommit()}>
          应用搜索
        </NButton>
        <NButton size="small" quaternary onClick={() => props.onReset()}>
          重置
        </NButton>
      </div>
    )
  },
})

// ======================== Empty ========================

const EmptyState = defineComponent({
  setup() {
    return () => (
      <div class="flex flex-col items-center justify-center py-16">
        <SearchIcon
          class="mb-3 size-10 text-neutral-300 dark:text-neutral-600"
          aria-hidden="true"
        />
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          暂无匹配的索引行
        </p>
      </div>
    )
  },
})

// ======================== Row ========================

const IndexRow = defineComponent({
  props: {
    row: { type: Object as PropType<SearchDocumentAdminRow>, required: true },
    rebuilding: { type: Boolean, default: false },
    onRebuild: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => {
      const { row } = props
      const editUrl = buildEditUrl(row.refType, row.refId)
      return (
        <tr class="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
          <td class="px-3 py-2 align-top">
            <NTag size="small" type={refTypeTone[row.refType] ?? 'default'}>
              {refTypeLabel[row.refType] ?? row.refType}
            </NTag>
          </td>
          <td class="px-3 py-2 align-top">
            <code class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800">
              {row.refId}
            </code>
          </td>
          <td class="px-3 py-2 align-top">
            {row.lang ? (
              <NTag size="small">{row.lang}</NTag>
            ) : (
              <span class="text-xs text-neutral-400">—</span>
            )}
          </td>
          <td class="px-3 py-2 align-top">
            <div class="flex items-start gap-1">
              <span class="line-clamp-1 max-w-[28ch] text-neutral-900 dark:text-neutral-100">
                {row.title || <span class="text-neutral-400">(无标题)</span>}
              </span>
              {!row.isPublished && (
                <NTooltip>
                  {{
                    trigger: () => (
                      <NTag size="small" type="warning">
                        未发布
                      </NTag>
                    ),
                    default: () => '该内容未对外发布',
                  }}
                </NTooltip>
              )}
              {row.hasPassword && (
                <NTag size="small" type="default">
                  密码
                </NTag>
              )}
            </div>
            <div class="mt-1 text-xs tabular-nums text-neutral-400">
              title {row.titleLength} · body {row.bodyLength}
            </div>
          </td>
          <td class="px-3 py-2 align-top">
            <code
              class="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800"
              title={row.sourceHash}
            >
              {row.sourceHash ? row.sourceHash.slice(0, 8) : '—'}
            </code>
          </td>
          <td class="px-3 py-2 align-top">
            {row.inSync ? (
              <NTooltip>
                {{
                  trigger: () => (
                    <CheckIcon
                      class="size-4 text-green-500"
                      aria-hidden="true"
                    />
                  ),
                  default: () => '索引与源数据一致',
                }}
              </NTooltip>
            ) : (
              <NTooltip>
                {{
                  trigger: () => (
                    <UnsyncIcon
                      class="size-4 text-amber-500"
                      aria-hidden="true"
                    />
                  ),
                  default: () => '索引落后于源数据，建议重建',
                }}
              </NTooltip>
            )}
          </td>
          <td class="px-3 py-2 align-top">
            <div class="flex flex-wrap gap-1">
              {row.availableLangs.length === 0 ? (
                <span class="text-xs text-neutral-400">—</span>
              ) : (
                row.availableLangs.map((l) => (
                  <NTag
                    key={l}
                    size="small"
                    type={l === row.lang ? 'info' : 'default'}
                  >
                    {l || 'default'}
                  </NTag>
                ))
              )}
            </div>
          </td>
          <td class="px-3 py-2 align-top text-xs text-neutral-500">
            <RelativeTime time={new Date(row.modifiedAt)} />
          </td>
          <td class="px-3 py-2 text-right align-top">
            <div class="flex justify-end gap-1">
              {editUrl && (
                <RouterLink to={editUrl}>
                  <NButton size="tiny" secondary>
                    {{
                      icon: () => (
                        <ExternalLinkIcon class="size-3" aria-hidden="true" />
                      ),
                      default: () => '查看原文',
                    }}
                  </NButton>
                </RouterLink>
              )}
              <NButton
                size="tiny"
                secondary
                loading={props.rebuilding}
                onClick={() => props.onRebuild()}
              >
                {{
                  icon: () => <RetryIcon class="size-3" aria-hidden="true" />,
                  default: () => '重建',
                }}
              </NButton>
            </div>
          </td>
        </tr>
      )
    }
  },
})
