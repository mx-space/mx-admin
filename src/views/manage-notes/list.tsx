import {
  Book as BookIcon,
  Bookmark as BookmarkIcon,
  ExternalLink,
  EyeOff as EyeHideIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Heart as HeartIcon,
  MapPin,
  Pencil,
  Plus as PlusIcon,
  Search as SearchIcon,
  Trash2,
} from 'lucide-vue-next'
import { NButton, NEllipsis, NInput, NPopconfirm, NSpace } from 'naive-ui'
import { computed, defineComponent, reactive, ref, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import type { NoteModel } from '~/models/note'
import type { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import type { PropType } from 'vue'

import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { notesApi } from '~/api/notes'
import { searchApi } from '~/api/search'
import { TableTitleLink } from '~/components/link/title-link'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { StatusToggle } from '~/components/status-toggle'
import { Table } from '~/components/table'
import { EditColumn } from '~/components/table/edit-column'
import { RelativeTime } from '~/components/time/relative-time'
import { WEB_URL } from '~/constants/env'
import { queryKeys } from '~/hooks/queries/keys'
import { useDataTable } from '~/hooks/use-data-table'
import { useStoreRef } from '~/hooks/use-store-ref'
import { UIStore } from '~/stores/ui'
import { getToken } from '~/utils'
import { formatNumber } from '~/utils/number'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { useLayout } from '../../layouts/content'

// Mobile card item component
const NoteItem = defineComponent({
  name: 'NoteItem',
  props: {
    data: {
      type: Object as PropType<NoteModel>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<(id: string) => void>,
      required: true,
    },
    onTogglePublish: {
      type: Function as PropType<
        (id: string, status: boolean) => Promise<void>
      >,
      required: true,
    },
  },
  setup(props) {
    const row = computed(() => props.data)
    const isSecret = computed(
      () =>
        row.value.publicAt && +new Date(row.value.publicAt) - Date.now() > 0,
    )
    const isUnpublished = computed(() => !row.value.isPublished)

    return () => (
      <div class="flex items-center gap-2 border-b border-neutral-200 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
        <div class="min-w-0 flex-1">
          {/* Title row with badges */}
          <div class="flex items-center gap-1.5">
            <span class="shrink-0 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
              #{row.value.nid}
            </span>
            {(isUnpublished.value || isSecret.value) && (
              <EyeHideIcon class="h-3 w-3 shrink-0 text-neutral-500" />
            )}
            {row.value.bookmark && (
              <BookmarkIcon class="h-3 w-3 shrink-0 text-red-500" />
            )}
            <RouterLink
              to={`/notes/edit?id=${row.value.id}`}
              class="truncate text-[13px] font-medium text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
            >
              {row.value.title}
            </RouterLink>
          </div>

          {/* Meta row - all in one line with consistent sizing */}
          <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {row.value.mood && (
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400">
                {row.value.mood}
              </span>
            )}
            {row.value.weather && (
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400">
                {row.value.weather}
              </span>
            )}
            {row.value.location && (
              <span class="flex max-w-20 items-center gap-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                <MapPin class="h-2.5 w-2.5 shrink-0" />
                {row.value.location}
              </span>
            )}
            <span class="flex items-center gap-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
              <BookIcon class="h-2.5 w-2.5" />
              {formatNumber(row.value.count?.read || 0)}
            </span>
            <span class="flex items-center gap-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
              <HeartIcon class="h-2.5 w-2.5" />
              {formatNumber(row.value.count?.like || 0)}
            </span>
            <span class="text-[11px] text-neutral-400 dark:text-neutral-500">
              ·
            </span>
            <RelativeTime
              time={row.value.created}
              class="text-[11px] text-neutral-400 dark:text-neutral-500"
            />
            <StatusToggle
              isPublished={row.value.isPublished ?? false}
              size="small"
              onToggle={(status) => props.onTogglePublish(row.value.id, status)}
            />
          </div>
        </div>

        {/* Actions */}
        <div class="flex shrink-0 items-center">
          <a
            href={`${WEB_URL}/notes/${row.value.nid}${isUnpublished.value || isSecret.value ? `?token=${getToken()}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="在新窗口打开日记"
          >
            <NButton quaternary size="tiny" class="!px-1.5">
              {{
                icon: () => (
                  <ExternalLink class="h-3.5 w-3.5 text-neutral-500" />
                ),
              }}
            </NButton>
          </a>

          <RouterLink
            to={`/notes/edit?id=${row.value.id}`}
            aria-label="编辑日记"
          >
            <NButton quaternary size="tiny" class="!px-1.5">
              {{
                icon: () => <Pencil class="h-3.5 w-3.5 text-neutral-500" />,
              }}
            </NButton>
          </RouterLink>

          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={() => props.onDelete(row.value.id)}
          >
            {{
              trigger: () => (
                <NButton
                  quaternary
                  size="tiny"
                  class="!px-1.5"
                  aria-label="删除日记"
                >
                  {{
                    icon: () => <Trash2 class="h-3.5 w-3.5 text-red-500" />,
                  }}
                </NButton>
              ),
              default: () => (
                <span class="max-w-48">确定要删除「{row.value.title}」？</span>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

export const ManageNoteListView = defineComponent({
  name: 'NoteList',
  setup() {
    const queryClient = useQueryClient()
    const ui = useStoreRef(UIStore)
    const isMobile = computed(
      () => ui.viewport.value.mobile || ui.viewport.value.pad,
    )

    // 搜索关键词
    const searchKeyword = ref('')
    const debouncedSearch = debouncedRef(searchKeyword, 300)

    // 筛选条件
    const dbQuery = ref<Record<string, boolean> | undefined>(undefined)

    const {
      isLoading: loading,
      checkedRowKeys,
      data,
      pager,
      refresh,
      setSort,
      setPage,
    } = useDataTable<NoteModel>({
      queryKey: (params) =>
        queryKeys.notes.list({ ...params, dbQuery: params.filters?.dbQuery }),
      queryFn: (params) => {
        const keyword = params.filters?.search
        // 有搜索关键词时使用搜索 API
        if (keyword) {
          return searchApi.searchNotes({
            keyword,
            page: params.page,
            size: params.size,
          }) as Promise<any>
        }
        // 否则使用列表 API
        return notesApi.getList({
          page: params.page,
          size: params.size,
          select:
            'title _id nid id created modified mood weather publicAt bookmark coordinates location count meta isPublished',
          sortBy: params.sortBy || undefined,
          sortOrder: params.sortOrder || undefined,
          db_query: params.filters?.dbQuery,
        }) as Promise<any>
      },
      pageSize: 20,
      filters: () => ({
        dbQuery: dbQuery.value,
        search: debouncedSearch.value || undefined,
      }),
    })

    // 删除 mutation
    const deleteMutation = useMutation({
      mutationFn: notesApi.delete,
      onSuccess: () => {
        message.success('删除成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
      },
    })

    // 更新字段 mutation
    const patchMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<NoteModel> }) =>
        notesApi.patch(id, data),
    })

    // 更新发布状态 mutation
    const publishMutation = useMutation({
      mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
        notesApi.patchPublish(id, isPublished),
      onSuccess: (_, { isPublished }) => {
        message.success(isPublished ? '已发布' : '已设为草稿')
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
      },
      onError: () => {
        message.error('操作失败')
      },
    })

    const handleDelete = (id: string) => {
      deleteMutation.mutate(id)
    }

    const handleTogglePublish = async (id: string, newStatus: boolean) => {
      publishMutation.mutate({ id, isPublished: newStatus })
    }

    // Mobile card list view
    const CardList = defineComponent({
      setup() {
        return () => (
          <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {loading.value ? (
              <div class="flex items-center justify-center py-16">
                <span class="text-sm text-neutral-400">加载中…</span>
              </div>
            ) : data.value.length === 0 ? (
              <div class="flex flex-col items-center justify-center py-16">
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  暂无日记
                </p>
                <RouterLink
                  to="/notes/edit"
                  class="mt-4 text-sm text-blue-500 hover:text-blue-600 hover:underline"
                >
                  记录第一篇日记
                </RouterLink>
              </div>
            ) : (
              <div>
                {data.value.map((item) => (
                  <NoteItem
                    key={item.id}
                    data={item}
                    onDelete={handleDelete}
                    onTogglePublish={handleTogglePublish}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pager.value && pager.value.totalPage > 1 && (
              <div class="flex items-center justify-center gap-4 border-t border-neutral-200 py-4 dark:border-neutral-800">
                <button
                  class="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  disabled={!pager.value.hasPrevPage}
                  onClick={() => {
                    if (pager.value?.hasPrevPage) {
                      setPage(pager.value.currentPage - 1)
                    }
                  }}
                >
                  上一页
                </button>
                <span class="text-sm text-neutral-500 dark:text-neutral-400">
                  {pager.value.currentPage} / {pager.value.totalPage}
                </span>
                <button
                  class="rounded-md border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  disabled={!pager.value.hasNextPage}
                  onClick={() => {
                    if (pager.value?.hasNextPage) {
                      setPage(pager.value.currentPage + 1)
                    }
                  }}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )
      },
    })

    // Desktop table view
    const DataTable = defineComponent({
      setup() {
        const columns = reactive<TableColumns<NoteModel>>([
          {
            type: 'selection',
            fixed: 'left',
            options: ['none', 'all'],
          },
          {
            title: '序号',
            width: 16 * 4,
            key: 'nid',
            fixed: 'left',
          },
          {
            title: '标题',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 280,
            fixed: 'left',

            filter: true,
            filterOptions: [
              { label: '回忆项', value: 'bookmark' },
              { label: '草稿项', value: 'unpublished' },
            ],

            render(row) {
              const isSecret =
                row.publicAt && +new Date(row.publicAt) - Date.now() > 0
              const isUnpublished = !row.isPublished
              return (
                <TableTitleLink
                  inPageTo={`/notes/edit?id=${row.id}`}
                  title={row.title}
                  externalLinkTo={`/notes/${row.nid}`}
                  id={row.id}
                  withToken={isUnpublished || isSecret}
                >
                  {{
                    default() {
                      return (
                        <>
                          {isUnpublished || isSecret ? (
                            <EyeHideIcon class="h-3.5 w-3.5 text-neutral-500" />
                          ) : null}
                          {row.bookmark ? (
                            <BookmarkIcon class="h-3.5 w-3.5 text-red-500" />
                          ) : null}
                        </>
                      )
                    },
                  }}
                </TableTitleLink>
              )
            },
          },
          {
            title: '心情',
            key: 'mood',
            width: 100,
            render(row, index) {
              return (
                <EditColumn
                  initialValue={data.value[index]?.mood ?? ''}
                  onSubmit={async (v) => {
                    await patchMutation.mutateAsync({
                      id: row.id,
                      data: { mood: v },
                    })
                    message.success('修改成功')
                  }}
                  placeholder="心情"
                />
              )
            },
          },
          {
            title: '天气',
            key: 'weather',
            width: 100,
            render(row, index) {
              return (
                <EditColumn
                  initialValue={data.value[index]?.weather ?? ''}
                  onSubmit={async (v) => {
                    await patchMutation.mutateAsync({
                      id: row.id,
                      data: { weather: v },
                    })
                    message.success('修改成功')
                  }}
                  placeholder="天气"
                />
              )
            },
          },
          {
            title: '地点',
            key: 'location',
            width: 200,
            render(row) {
              const { coordinates, location } = row
              if (!location) {
                return null
              } else {
                return (
                  <NEllipsis class="max-w-[200px] truncate">
                    {{
                      tooltip() {
                        return (
                          <div class="">
                            <p>{location}</p>
                            <p>
                              {coordinates?.longitude}, {coordinates?.latitude}
                            </p>
                          </div>
                        )
                      },
                      default() {
                        return location
                      },
                    }}
                  </NEllipsis>
                )
              }
            },
          },

          {
            title: () => <BookIcon class="h-4 w-4" />,
            key: 'count.read',
            width: 50,
            ellipsis: {
              tooltip: true,
            },
            render(row) {
              return formatNumber(row.count?.read || 0)
            },
          },
          {
            title: () => <HeartIcon class="h-4 w-4" />,
            width: 50,
            ellipsis: {
              tooltip: true,
            },
            key: 'count.like',
            render(row) {
              return formatNumber(row.count?.like || 0)
            },
          },

          {
            title: '创建于',
            key: 'created',
            sortOrder: 'descend',
            sorter: 'default',
            width: 200,
            render(row) {
              return <RelativeTime time={row.created} />
            },
          },
          {
            title: '修改于',
            key: 'modified',
            sorter: 'default',
            sortOrder: false,
            width: 200,
            render(row) {
              return <RelativeTime time={row.modified} />
            },
          },
          {
            title: '状态',
            key: 'isPublished',
            width: 120,
            render(row) {
              return (
                <StatusToggle
                  isPublished={row.isPublished ?? false}
                  onToggle={(newStatus) =>
                    handleTogglePublish(row.id, newStatus)
                  }
                />
              )
            },
          },
          {
            title: '操作',
            key: 'id',
            width: 100,
            fixed: 'right',
            render(row) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={() => handleDelete(row.id)}
                  >
                    {{
                      trigger: () => (
                        <NButton quaternary type="error" size="tiny">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">确定要删除 {row.title} ?</span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ])

        return () => (
          <Table
            nTableProps={{
              async onUpdateFilters(filter: { title: string[] }, _column) {
                const { title } = filter
                if (!title || title.length === 0) {
                  dbQuery.value = undefined
                  refresh()
                  return
                }
                dbQuery.value = title.reduce(
                  (acc, i) => ({ ...acc, [i]: true }),
                  {},
                )
                setPage(1)
              },
            }}
            loading={loading.value}
            columns={columns}
            data={data}
            onFetchData={refresh}
            pager={pager as any}
            onUpdateCheckedRowKeys={(keys) => {
              checkedRowKeys.value = keys
            }}
            onUpdateSorter={async (props) => {
              setSort(props.sortBy, props.sortOrder as 0 | 1 | -1)
            }}
          />
        )
      },
    })

    const { setActions } = useLayout()

    watchEffect(() => {
      setActions(
        <>
          <DeleteConfirmButton
            checkedRowKeys={checkedRowKeys.value}
            onDelete={async () => {
              const status = await Promise.allSettled(
                checkedRowKeys.value.map((id) => notesApi.delete(id as string)),
              )

              for (const s of status) {
                if (s.status === 'rejected') {
                  message.error(`删除失败，${s.reason.message}`)
                }
              }

              checkedRowKeys.value.length = 0
              queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
            }}
          />

          <HeaderActionButton
            name="批量发布"
            disabled={checkedRowKeys.value.length === 0}
            icon={<EyeIcon />}
            variant="success"
            onClick={async () => {
              try {
                await Promise.all(
                  checkedRowKeys.value.map((id) =>
                    notesApi.patchPublish(id as string, true),
                  ),
                )
                message.success('批量发布成功')
                queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
                checkedRowKeys.value = []
              } catch (_error) {
                message.error('批量发布失败')
              }
            }}
          />

          <HeaderActionButton
            name="批量设为草稿"
            disabled={checkedRowKeys.value.length === 0}
            icon={<EyeOffIcon />}
            variant="warning"
            onClick={async () => {
              try {
                await Promise.all(
                  checkedRowKeys.value.map((id) =>
                    notesApi.patchPublish(id as string, false),
                  ),
                )
                message.success('批量设置草稿成功')
                queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
                checkedRowKeys.value = []
              } catch (_error) {
                message.error('批量设置草稿失败')
              }
            }}
          />
          <HeaderActionButton to={'/notes/edit'} icon={<PlusIcon />} />
        </>,
      )
    })

    return () => (
      <div class="flex flex-col gap-4">
        {/* 搜索框 */}
        <div class="flex items-center gap-2">
          <NInput
            v-model:value={searchKeyword.value}
            placeholder="搜索标题..."
            clearable
            class="max-w-xs"
          >
            {{
              prefix: () => <SearchIcon class="h-4 w-4 text-neutral-400" />,
            }}
          </NInput>
        </div>

        {isMobile.value ? <CardList /> : <DataTable />}
      </div>
    )
  },
})
