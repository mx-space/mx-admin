import { Add12Filled, Delete16Regular } from '@vicons/fluent'
import { defineComponent, onMounted } from '@vue/runtime-core'
import { Table } from 'components/table'
import { useTable } from 'hooks/use-table'
import { NButton, NPopconfirm, NSpace, useDialog, useMessage } from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { parseDate, relativeTimeFromNow } from 'utils/time'
import { reactive, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { PostResponse } from '../../models/post'
import { RESTManager } from '../../utils/rest'
export const ManagePageListView = defineComponent({
  name: 'page-list',
  setup({}, ctx) {
    const { checkedRowKeys, data, pager, sortProps, fetchDataFn } = useTable(
      (data, pager) => async (page = route.query.page || 1, size = 20) => {
        const response = await RESTManager.api.pages.get<PostResponse>({
          params: {
            page,
            size,
            select: 'title subtitle _id id created modified',
            ...(sortProps.sortBy
              ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
              : {}),
          },
        })
        data.value = response.data
      },
    )

    const message = useMessage()
    const dialog = useDialog()

    const route = useRoute()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async n => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onMounted(async () => {
      await fetchData()
    })

    const DataTable = defineComponent({
      setup() {
        const columns = reactive<TableColumns<any>>([
          {
            type: 'selection',
            options: ['all', 'none'],
          },
          {
            title: '标题',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 300,
            render(row) {
              return (
                <RouterLink to={'/pages/edit?id=' + row.id}>
                  {row.title}
                </RouterLink>
              )
            },
          },
          {
            title: '副标题',
            key: 'subtitle',
          },
          {
            title: '创建时间',
            key: 'created',
            sortOrder: 'descend',
            sorter: 'default',
            render(row) {
              return relativeTimeFromNow(row.created)
            },
          },
          {
            title: '修改于',
            key: 'modified',
            sorter: 'default',
            sortOrder: false,
            render(row) {
              return parseDate(row.modified, 'YYYY年M月D日')
            },
          },
          {
            title: '操作',
            key: 'id',
            render(row) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={async () => {
                      await RESTManager.api.pages(row.id).delete()
                      message.success('删除成功')
                      await fetchData(pager.value.currentPage)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton text type="error">
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
            noPagination
            columns={columns}
            data={data}
            onFetchData={fetchData}
            pager={pager}
            onUpdateCheckedRowKeys={keys => {
              checkedRowKeys.value = keys
            }}
            onUpdateSorter={async props => {
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
                          await RESTManager.api.pages(id as string).delete()
                        }
                        checkedRowKeys.value.length = 0
                        message.success('删除成功')

                        await fetchData()
                      },
                    })
                  }}
                  icon={<Delete16Regular />}
                />
                <HeaderActionButton to={'/pages/edit'} icon={<Add12Filled />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})
