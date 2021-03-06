import {
  BookIcon,
  BookmarkIcon,
  EyeHideIcon,
  HeartIcon,
  PlusIcon,
} from 'components/icons'
import { TableTitleLink } from 'components/link/title-link'
import { DeleteConfirmButton } from 'components/special-button/delete-confirm'
import { Table } from 'components/table'
import { EditColumn } from 'components/table/edit-column'
import { RelativeTime } from 'components/time/relative-time'
import { useDataTableFetch } from 'hooks/use-table'
import type { Pager } from 'models/base'
import type { NoteModel } from 'models/note'
import { NButton, NEllipsis, NPopconfirm, NSpace, useMessage } from 'naive-ui'
import type { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { defineComponent, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import { Icon } from '@vicons/utils'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'

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
                  'title _id nid id created modified mood weather hide secret hasMemory coordinates location count',
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
            title: '??????',
            width: 16 * 4,
            key: 'nid',
          },
          {
            title: '??????',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 280,
            filter: true,
            filterOptions: [
              { label: '?????????', value: 'hasMemory' },
              { label: '?????????', value: 'hide' },
            ],

            render(row) {
              const isSecret =
                row.secret && +new Date(row.secret) - +new Date() > 0
              return (
                <TableTitleLink
                  inPageTo={`/notes/edit?id=${row.id}`}
                  title={row.title}
                  externalLinkTo={`/notes/${row.nid}`}
                  id={row.id}
                  withToken={row.hide || isSecret}
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
                          {row.hasMemory ? (
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
            title: '??????',
            key: 'mood',
            width: 100,
            render(row, index) {
              return (
                <EditColumn
                  initialValue={data.value[index].mood ?? ''}
                  onSubmit={async (v) => {
                    await RESTManager.api.notes(row.id).put({
                      data: {
                        mood: v,
                      },
                    })

                    message.success('????????????')
                    data.value[index].mood = v
                  }}
                  placeholder="??????"
                />
              )
            },
          },
          {
            title: '??????',
            key: 'weather',
            width: 100,
            render(row, index) {
              return (
                <EditColumn
                  initialValue={data.value[index].weather ?? ''}
                  onSubmit={async (v) => {
                    await RESTManager.api.notes(row.id).put({
                      data: {
                        weather: v,
                      },
                    })
                    message.success('????????????')
                    data.value[index].weather = v
                  }}
                  placeholder="??????"
                />
              )
            },
          },
          {
            title: '??????',
            key: 'location',
            width: 200,
            render(row) {
              const { coordinates, location } = row
              if (!location) {
                return null
              } else {
                return (
                  <NEllipsis class="truncate max-w-[200px]">
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
            ellipsis: true,
            render(row) {
              return row.count?.read || 0
            },
          },
          {
            title: () => (
              <Icon>
                <HeartIcon />
              </Icon>
            ),
            ellipsis: true,
            key: 'count.like',
            render(row) {
              return row.count?.like || 0
            },
          },

          {
            title: '?????????',
            key: 'created',
            sortOrder: 'descend',
            sorter: 'default',
            width: 200,
            render(row) {
              return <RelativeTime time={row.created} />
            },
          },
          {
            title: '?????????',
            key: 'modified',
            sorter: 'default',
            sortOrder: false,
            width: 200,
            render(row) {
              return <RelativeTime time={row.modified} />
            },
          },
          {
            title: '??????',
            key: 'id',
            width: 100,
            fixed: 'right',
            render(row) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'??????'}
                    negativeText="??????"
                    onNegativeClick={async () => {
                      await RESTManager.api.notes(row.id).delete()
                      message.success('????????????')
                      await fetchData(pager.value.currentPage)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error" size="tiny">
                          ??????
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">??????????????? {row.title} ?</span>
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
          ></Table>
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
                        message.success(`???????????????${s.reason.message}`)
                      }
                    }

                    checkedRowKeys.value.length = 0
                    fetchData()
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
