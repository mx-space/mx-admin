import {
  BookIcon,
  BookmarkIcon,
  EyeHideIcon,
  EyeIcon,
  EyeOffIcon,
  HeartIcon,
  PlusIcon,
} from '~/components/icons'
import { TableTitleLink } from '~/components/link/title-link'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { Table } from '~/components/table'
import { EditColumn } from '~/components/table/edit-column'
import { RelativeTime } from '~/components/time/relative-time'
import { useDataTableFetch } from '~/hooks/use-table'
import { NButton, NEllipsis, NPopconfirm, NSpace, useMessage } from 'naive-ui'
import { formatNumber } from '~/utils/number'
import { defineComponent, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import { Icon } from '@vicons/utils'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
import type { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import type { NoteModel } from '~/models/note'
import type { Pager } from '~/models/base'

export const ManageNoteListView = defineComponent({
  name: 'NoteList',
  setup() {
    const { loading, checkedRowKeys, data, pager, sortProps, fetchDataFn } =
      useDataTableFetch<NoteModel>(
        (data, pager) =>
          async (page = route.query.page || 1, size = 20, db_query) => {
            const response = await RESTManager.api.notes.get<{
              data: NoteModel[]
              pagination: Pager
            }>({
              params: {
                db_query,
                page,
                size,
                select:
                  'title _id nid id created modified mood weather hide publicAt bookmark coordinates location count meta isPublished',
                ...(sortProps.sortBy
                  ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
                  : {}),
              },
            })
            data.value = response.data
            pager.value = response.pagination
          },
      )

    const message = useMessage()

    const route = useRoute()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onMounted(async () => {
      await fetchData()
    })

    const DataTable = defineComponent({
      setup() {
        const columns = reactive<TableColumns<NoteModel>>([
          {
            type: 'selection',
            options: ['none', 'all'],
          },
          {
            title: '序号',
            width: 16 * 4,
            key: 'nid',
          },
          {
            title: '标题',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 280,

            filter: true,
            filterOptions: [
              { label: '回忆项', value: 'bookmark' },
              { label: '隐藏项', value: 'hide' },
            ],

            render(row) {
              const isSecret =
                row.publicAt && +new Date(row.publicAt) - Date.now() > 0
              return (
                <TableTitleLink
                  inPageTo={`/notes/edit?id=${row.id}`}
                  title={row.title}
                  externalLinkTo={`/notes/${row.nid}`}
                  id={row.id}
                  withToken={row.hide || isSecret}
                  xLog={row.meta?.xLog}
                >
                  {{
                    default() {
                      return (
                        <>
                          {row.hide || isSecret ? (
                            <Icon color="#34495e">
                              <EyeHideIcon />
                            </Icon>
                          ) : null}
                          {row.bookmark ? (
                            <Icon color="#e74c3c">
                              <BookmarkIcon />
                            </Icon>
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
                  initialValue={data.value[index].mood ?? ''}
                  onSubmit={async (v) => {
                    await RESTManager.api.notes(row.id).patch({
                      data: {
                        mood: v,
                      },
                    })

                    message.success('修改成功')
                    data.value[index].mood = v
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
                  initialValue={data.value[index].weather ?? ''}
                  onSubmit={async (v) => {
                    await RESTManager.api.notes(row.id).patch({
                      data: {
                        weather: v,
                      },
                    })
                    message.success('修改成功')
                    data.value[index].weather = v
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
            title: () => (
              <Icon>
                <BookIcon />
              </Icon>
            ),
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
            title: () => (
              <Icon>
                <HeartIcon />
              </Icon>
            ),
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
                <NSpace size={4} align="center">
                  <div class={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    row.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <Icon size={12}>
                      {row.isPublished ? <EyeIcon /> : <EyeOffIcon />}
                    </Icon>
                    {row.isPublished ? '已发布' : '草稿'}
                  </div>
                  <NButton
                    size="tiny"
                    quaternary
                    type={row.isPublished ? "warning" : "primary"}
                    onClick={async () => {
                      const newStatus = !row.isPublished
                      try {
                        await RESTManager.api.notes(row.id)('publish').patch({
                          data: { isPublished: newStatus }
                        })
                        row.isPublished = newStatus
                        message.success(newStatus ? '已发布' : '已设为草稿')
                      } catch (_error) {
                        message.error('操作失败')
                      }
                    }}
                  >
                    {row.isPublished ? '取消发布' : '发布'}
                  </NButton>
                </NSpace>
              )
            }
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
                    onNegativeClick={async () => {
                      await RESTManager.api.notes(row.id).delete()
                      message.success('删除成功')
                      await fetchData(pager.value.currentPage)
                    }}
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
              async onUpdateFilters(filter: { title: string[] }, column) {
                const { title } = filter
                if (!title || title.length === 0) {
                  await fetchData()
                  return
                }
                await fetchData(
                  1,
                  undefined,
                  title.reduce((acc, i) => ({ ...acc, [i]: true }), {}),
                )
              },
            }}
            loading={loading.value}
            columns={columns}
            data={data}
            onFetchData={fetchData}
            pager={pager}
            onUpdateCheckedRowKeys={(keys) => {
              checkedRowKeys.value = keys
            }}
            onUpdateSorter={async (props) => {
              sortProps.sortBy = props.sortBy
              sortProps.sortOrder = props.sortOrder
            }}
          />
        )
      },
    })

    return () => {
      return (
        <ContentLayout>
          {{
            actions: () => (
              <>
                <DeleteConfirmButton
                  checkedRowKeys={checkedRowKeys.value}
                  onDelete={async () => {
                    const status = await Promise.allSettled(
                      checkedRowKeys.value.map((id) =>
                        RESTManager.api.notes(id as string).delete(),
                      ),
                    )

                    for (const s of status) {
                      if (s.status === 'rejected') {
                        message.success(`删除失败，${s.reason.message}`)
                      }
                    }

                    checkedRowKeys.value.length = 0
                    fetchData()
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
                        checkedRowKeys.value.map(id => 
                          RESTManager.api.notes(id as string)('publish').patch({
                            data: { isPublished: true }
                          })
                        )
                      )
                      message.success('批量发布成功')
                      fetchData() // 重新获取数据
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
                        checkedRowKeys.value.map(id => 
                          RESTManager.api.notes(id as string)('publish').patch({
                            data: { isPublished: false }
                          })
                        )
                      )
                      message.success('批量设置草稿成功')
                      fetchData() // 重新获取数据
                      checkedRowKeys.value = []
                    } catch (_error) {
                      message.error('批量设置草稿失败')
                    }
                  }}
                />
                <HeaderActionButton to={'/notes/edit'} icon={<PlusIcon />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})
