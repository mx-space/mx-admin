import { Add12Filled, Delete16Regular } from '@vicons/fluent'
import { defineComponent, onMounted } from '@vue/runtime-core'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useTable } from 'hooks/use-table'
import { SayResponse } from 'models/say'
import { NButton, NPopconfirm, NSpace, useDialog, useMessage } from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { reactive, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
const ManagePageListView = defineComponent({
  name: 'SayList',
  setup(props, ctx) {
    const { checkedRowKeys, data, pager, sortProps, fetchDataFn } = useTable(
      (data, pager) => async (page = route.query.page || 1, size = 30) => {
        const response = await RESTManager.api.says.get<SayResponse>({
          params: {
            page,
            size,
            select: 'title text _id id created modified author source',
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
            options: ['none', 'all'],
          },
          {
            title: '创建于',
            key: 'created',
            width: 100,
            render(row) {
              return (
                <RouterLink to={'/says/edit?id=' + row.id}>
                  <RelativeTime time={row.created} />
                </RouterLink>
              )
            },
          },
          {
            title: '内容',
            key: 'text',
          },
          { title: '作者', key: 'author' },
          { title: '来源', key: 'source' },
          {
            title: '操作',
            fixed: 'right',
            key: 'id',
            width: 130,
            render(row) {
              return (
                <NSpace wrap={false}>
                  <RouterLink to={'/says/edit?id=' + row.id}>
                    <NButton text type="primary" size="tiny">
                      编辑
                    </NButton>
                  </RouterLink>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={async () => {
                      await RESTManager.api.says(row.id).delete()
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
                          确定要删除“{row.text}” ?
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
            columns={columns}
            data={data}
            onFetchData={fetchData}
            pager={pager}
            onUpdateCheckedRowKeys={keys => {
              checkedRowKeys.value = keys
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
                          await RESTManager.api.says(id as string).delete()
                        }
                        checkedRowKeys.value.length = 0
                        message.success('删除成功')

                        await fetchData()
                      },
                    })
                  }}
                  icon={<Delete16Regular />}
                />
                <HeaderActionButton to={'/says/edit'} icon={<Add12Filled />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})

export default ManagePageListView
