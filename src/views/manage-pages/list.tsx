import { AddIcon } from 'components/icons'
import { TableTitleLink } from 'components/link/title-link'
import { DeleteConfirmButton } from 'components/special-button/delete-confirm'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useDataTableFetch } from 'hooks/use-table'
import type { PageModel, PageResponse } from 'models/page'
import { NButton, NPopconfirm, NSpace, useMessage } from 'naive-ui'
import type { TableColumns } from 'naive-ui/lib/data-table/src/interface'
import { defineComponent, onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'

export const ManagePageListView = defineComponent({
  name: 'PageList',
  setup() {
    const { checkedRowKeys, data, pager, sortProps, fetchDataFn } =
      useDataTableFetch(
        (data, pager) =>
          async (page = route.query.page || 1, size = 20) => {
            const response = await RESTManager.api.pages.get<PageResponse>({
              params: {
                page,
                size,
                select: 'title subtitle _id id created modified slug',
                ...(sortProps.sortBy
                  ? { sortBy: sortProps.sortBy, sortOrder: sortProps.sortOrder }
                  : {}),
              },
            })
            data.value = response.data
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
        const columns = reactive<TableColumns<PageModel>>([
          {
            type: 'selection',
            options: ['none', 'all'],
          },
          {
            title: '??????',
            sortOrder: false,
            sorter: 'default',
            key: 'title',
            width: 300,
            render(row) {
              return (
                <TableTitleLink
                  inPageTo={`/pages/edit?id=${row.id}`}
                  title={row.title}
                  externalLinkTo={`/${row.slug}`}
                  id={row.id}
                ></TableTitleLink>
              )
            },
          },
          {
            title: '?????????',
            key: 'subtitle',
          },
          {
            title: '??????',
            key: 'slug',
            render(row) {
              return `/${row.slug}`
            },
          },
          {
            title: '?????????',
            key: 'created',
            sortOrder: 'descend',
            sorter: 'default',
            render(row) {
              return <RelativeTime time={row.created} />
            },
          },
          {
            title: '?????????',
            key: 'modified',
            sorter: 'default',
            sortOrder: false,
            render(row) {
              return <RelativeTime time={row.modified} />
            },
          },
          {
            title: '??????',
            fixed: 'right',
            key: 'id',
            render(row) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'??????'}
                    negativeText="??????"
                    onNegativeClick={async () => {
                      await RESTManager.api.pages(row.id).delete()
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
            noPagination
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
                        RESTManager.api.pages(id as string).delete(),
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

                <HeaderActionButton to={'/pages/edit'} icon={<AddIcon />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})
