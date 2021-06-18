import { Add12Filled, Delete16Regular } from '@vicons/fluent'
import { defineComponent, onMounted } from '@vue/runtime-core'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useTable } from 'hooks/use-table'
import { ProjectResponse } from 'models/project'
import {
  NButton,
  NPopconfirm,
  NSpace,
  NText,
  useDialog,
  useMessage,
} from 'naive-ui'
import { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { RouteName } from 'router/name'
import { reactive, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
import isURL from 'validator/es/lib/isURL'
import { parseDate } from 'utils'
const ManageProjectView = defineComponent({
  setup(props, ctx) {
    const { checkedRowKeys, data, pager, sortProps, fetchDataFn } = useTable(
      (data, pager) => async (page = route.query.page || 1, size = 30) => {
        const response = await RESTManager.api.projects.get<ProjectResponse>({
          params: {
            page,
            size,
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
            title: '项目名称',
            key: 'name',
            width: 100,
            render(row) {
              const hasLink = [row.previewUrl, row.projectUrl, row.docUrl]
                .filter(Boolean)
                .find(i => isURL(i, { require_protocol: true }))
              return hasLink ? (
                <a href={hasLink} target={'_blank'} rel="noreferrer">
                  {row.name}
                </a>
              ) : (
                <NText>{row.name}</NText>
              )
            },
          },
          {
            title: '项目描述',
            key: 'description',
          },
          {
            title: '创建时间',
            key: 'created',

            render(row) {
              return parseDate(row.created)
            },
          },
          {
            title: '修改于',
            key: 'created',

            render(row) {
              return <RelativeTime time={row.created} />
            },
          },
          {
            title: '操作',
            fixed: 'right',
            key: 'id',
            width: 130,
            render(row) {
              return (
                <NSpace wrap={false}>
                  <RouterLink
                    to={{ name: RouteName.EditProject, query: { id: row.id } }}
                  >
                    <NButton text type="primary" size="tiny">
                      编辑
                    </NButton>
                  </RouterLink>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={async () => {
                      await RESTManager.api.projects(row.id).delete()
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
                          确定要删除项目 [{row.name}] ?
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
                          await RESTManager.api.projects(id as string).delete()
                        }
                        checkedRowKeys.value.length = 0
                        message.success('删除成功')

                        await fetchData()
                      },
                    })
                  }}
                  icon={<Delete16Regular />}
                />
                <HeaderActionButton
                  to={'/projects/edit'}
                  icon={<Add12Filled />}
                />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})

export default ManageProjectView
