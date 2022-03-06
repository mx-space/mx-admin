import { Icon } from '@vicons/utils'
import {
  BookIcon,
  BookmarkIcon,
  DeleteIcon,
  EyeHideIcon,
  HeartIcon,
  PlusIcon,
} from 'components/icons'
import { TableTitleLink } from 'components/link/title-link'
import { Table } from 'components/table'
import { EditColumn } from 'components/table/edit-column'
import { RelativeTime } from 'components/time/relative-time'
import { useDataTableFetch } from 'hooks/use-table'
import { Pager } from 'models/base'
import { NoteModel } from 'models/note'
import {
  NButton,
  NEllipsis,
  NPopconfirm,
  NSpace,
  useDialog,
  useMessage,
} from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { defineComponent, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
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
    const dialog = useDialog()

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
              { label: '回忆项', value: 'hasMemory' },
              { label: '隐藏项', value: 'hide' },
            ],

            render(row) {
              const isSecret =
                row.secret && +new Date(row.secret) - +new Date() > 0
              return (
                <TableTitleLink
                  inPageTo={'/notes/edit?id=' + row.id}
                  title={row.title}
                  externalLinkTo={'/notes/' + row.nid}
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
            title: '心情',
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
                    await RESTManager.api.notes(row.id).put({
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
                        <NButton text type="error" size="tiny">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span style={{ maxWidth: '12rem' }}>
                          确定要删除 {row.title} ?
                        </span>
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
                <HeaderActionButton
                  variant="error"
                  disabled={checkedRowKeys.value.length == 0}
                  onClick={() => {
                    dialog.warning({
                      title: '警告',
                      content: '你确定要删除？',
                      positiveText: '确定',
                      negativeText: '不确定',
                      onPositiveClick: async () => {
                        for (const id of checkedRowKeys.value) {
                          await RESTManager.api.notes(id as string).delete()
                        }
                        checkedRowKeys.value.length = 0
                        message.success('删除成功')

                        await fetchData()
                      },
                    })
                  }}
                  icon={<DeleteIcon />}
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
