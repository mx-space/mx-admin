import { Bookmark } from '@vicons/fa'
import Add12Filled from '@vicons/fluent/es/Add12Filled'
import Delete16Regular from '@vicons/fluent/es/Delete16Regular'
import EyeHide20Filled from '@vicons/fluent/es/EyeHide20Filled'

import { Icon } from '@vicons/utils'
import { defineComponent, onMounted } from 'vue'
import { Table } from 'components/table'
import { EditColumn } from 'components/table/edit-column'
import { RelativeTime } from 'components/time/relative-time'
import { useTable } from 'hooks/use-table'
import { Pager } from 'models/base'
import { NoteModel } from 'models/note'
import {
  NButton,
  NEllipsis,
  NPopconfirm,
  NPopover,
  NSpace,
  useDialog,
  useMessage,
} from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { parseDate } from 'utils/time'
import { reactive, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
export const ManageNoteListView = defineComponent({
  name: 'NoteList',
  setup() {
    const { loading, checkedRowKeys, data, pager, sortProps, fetchDataFn } =
      useTable<NoteModel>(
        (data, pager) =>
          async (page = route.query.page || 1, size = 20) => {
            const response = await RESTManager.api.notes.get<{
              data: NoteModel[]
              page: Pager
            }>({
              params: {
                page,
                size,
                select:
                  'title _id id created modified mood weather hide secret hasMemory coordinates location',
                ...(sortProps.sortBy
                  ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
                  : {}),
              },
            })
            data.value = response.data
            pager.value = response.page
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
            title: '标题',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 300,
            render(row) {
              return (
                <RouterLink
                  to={'/notes/edit?id=' + row.id}
                  class="flex items-center space-x-2"
                >
                  <span>{row.title}</span>
                  {row.hide ||
                  (row.secret && +new Date(row.secret) - +new Date() > 0) ? (
                    <Icon color="#34495e">
                      <EyeHide20Filled />
                    </Icon>
                  ) : null}
                  {row.hasMemory ? (
                    <Icon color="#e74c3c">
                      <Bookmark />
                    </Icon>
                  ) : null}
                </RouterLink>
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
            title: '创建时间',
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
              return parseDate(row.modified, 'yyyy年M月d日')
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
                  icon={<Delete16Regular />}
                />
                <HeaderActionButton to={'/notes/edit'} icon={<Add12Filled />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})
