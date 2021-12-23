import Lock from '@vicons/antd/LockFilled'
import Add12Filled from '@vicons/fluent/es/Add12Filled'
import { Icon } from '@vicons/utils'
import { HeaderActionButton } from 'components/button/rounded-button'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useMountAndUnmount } from 'hooks/use-react'
import { useTable } from 'hooks/use-table'
import { useLayout } from 'layouts/content'
import { PaginateResult } from 'models/base'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import { RESTManager } from 'utils'
import { getToken } from 'utils/auth'
import { useRouter } from 'vue-router'
import { SnippetModel } from '../../../models/snippet'

export const Tab1ForList = defineComponent({
  setup() {
    onMounted(async () => {
      await fetchDataFn(1, 20)
    })

    const layout = useLayout()

    useMountAndUnmount(() => {
      layout.setHeaderButton(
        <HeaderActionButton
          onClick={() => {
            router.push({
              query: {
                tab: 1,
              },
            })
          }}
          icon={<Add12Filled />}
        ></HeaderActionButton>,
      )

      return () => {
        layout.setHeaderButton(null)
      }
    })

    const { data, fetchDataFn, loading, pager } = useTable((data, pager) => {
      return async (page, size) => {
        const _data = await RESTManager.api.snippets.get<
          PaginateResult<SnippetModel[]>
        >({
          params: {
            page,
            size,
            select: '-raw',
          },
        })

        data.value = _data.data
        pager.value = _data.pagination
      }
    })

    const router = useRouter()

    return () => (
      <>
        <Table
          data={data}
          pager={pager}
          columns={[
            {
              key: 'name',
              title: '名称',
              render(row: SnippetModel) {
                const name = row.name
                const isPrivate = row.private
                return (
                  <NSpace align="center">
                    <NButton
                      tag="a"
                      text
                      // @ts-ignore
                      href={
                        RESTManager.endpoint +
                        '/snippets/' +
                        row.reference +
                        '/' +
                        row.name +
                        (row.private ? `?token=bearer%20${getToken()}` : '')
                      }
                      target="_blank"
                      size="tiny"
                    >
                      {name}
                    </NButton>
                    {isPrivate && (
                      <Icon class={'items-center flex '}>
                        <Lock />
                      </Icon>
                    )}
                  </NSpace>
                )
              },
            },

            {
              title: '类型',
              key: 'type',
            },
            {
              title: '引用',
              key: 'reference',
            },
            {
              key: 'comment',
              title: '备注',
              width: 300,
              ellipsis: {
                tooltip: true,
              },
            },
            {
              title: '创建于',
              key: 'created',
              render(row) {
                return <RelativeTime time={row.created} />
              },
            },

            {
              title: '操作',
              key: 'id',
              fixed: 'right',
              render(row) {
                return (
                  <NSpace>
                    <NButton
                      text
                      size="tiny"
                      type="primary"
                      onClick={() => {
                        router.push({
                          query: {
                            tab: 1,
                            id: row.id,
                          },
                        })
                      }}
                    >
                      编辑
                    </NButton>

                    <NPopconfirm
                      positiveText={'取消'}
                      negativeText="删除"
                      onNegativeClick={async () => {
                        await RESTManager.api.snippets(row.id).delete()
                        message.success('删除成功')
                        await fetchDataFn(pager.value.currentPage)
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
          ]}
          loading={loading.value}
        ></Table>
      </>
    )
  },
})
