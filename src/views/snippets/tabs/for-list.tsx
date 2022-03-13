import { Icon } from '@vicons/utils'
import { HeaderActionButton } from 'components/button/rounded-button'
import { AddIcon, FunctionIcon, LockIcon } from 'components/icons'
import { DeleteConfirmButton } from 'components/special-button/delete-confirm'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useMountAndUnmount } from 'hooks/use-react'
import { useDataTableFetch } from 'hooks/use-table'
import { useLayout } from 'layouts/content'
import { PaginateResult } from 'models/base'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import { RESTManager } from 'utils'
import { getToken } from 'utils/auth'
import { useRouter } from 'vue-router'
import { SnippetModel, SnippetType } from '../../../models/snippet'

const useFetchReferenceNames = () => {
  const referenceNames = ref<string[]>([])
  const fetchReferenceNames = async () => {
    const data = await RESTManager.api.snippets.aggregate.post<{
      data: any[]
    }>({
      data: [
        {
          $group: {
            _id: '$reference',
          },
        },
        {
          $project: {
            name: '$_id',
            _id: false,
          },
        },
      ],
    })

    referenceNames.value = data.data.map(({ name }) => name)
  }

  onMounted(() => {
    fetchReferenceNames()
  })

  return referenceNames
}

export const Tab1ForList = defineComponent({
  setup() {
    const { data, fetchDataFn, loading, pager, checkedRowKeys } =
      useDataTableFetch((data, pager) => {
        return async (page, size, db_query) => {
          const _data = await RESTManager.api.snippets.get<
            PaginateResult<SnippetModel[]>
          >({
            params: {
              page,
              size,
              select: '-raw',
              db_query,
            },
          })

          data.value = _data.data
          pager.value = _data.pagination
        }
      })
    const referenceNames = useFetchReferenceNames()
    onMounted(() => {
      fetchDataFn(1, 20)
    })

    const layout = useLayout()

    useMountAndUnmount(() => {
      layout.setHeaderButtons(
        <>
          <HeaderActionButton
            onClick={() => {
              router.push({
                query: {
                  tab: 1,
                },
              })
            }}
            icon={<AddIcon />}
          ></HeaderActionButton>

          <DeleteConfirmButton
            checkedRowKeys={checkedRowKeys}
            onDelete={async (keys) => {
              if (!keys) {
                return
              }
              await Promise.all(
                (keys as string[]).map((id) => {
                  return RESTManager.api.snippets(id).delete()
                }),
              )

              fetchDataFn(1, 20)
            }}
          />
        </>,
      )

      return () => {
        layout.setHeaderButtons(null)
      }
    })

    const router = useRouter()

    return () => {
      const filterOptions = referenceNames.value.map((i) => ({
        label: i,
        value: i,
      }))

      return (
        <>
          <Table
            onUpdateCheckedRowKeys={(keys) => {
              checkedRowKeys.value = keys
            }}
            data={data}
            nTableProps={{
              onUpdateFilters(filterState: any) {
                if (filterState.reference && filterState.reference.length) {
                  fetchDataFn(1, 20, {
                    $or: filterState.reference.map((name) => ({
                      reference: name,
                    })),
                  })
                } else {
                  fetchDataFn(1, 20)
                }
              },
            }}
            pager={pager}
            columns={[
              {
                type: 'selection',
                options: ['none', 'all'],
              },
              {
                key: 'name',
                title: '名称',
                render(row: SnippetModel) {
                  const name = row.name
                  const isPrivate = row.private
                  return (
                    <NSpace align="center">
                      {row.type === SnippetType.Function && (
                        <Icon>
                          <FunctionIcon />
                        </Icon>
                      )}
                      <NButton
                        tag="a"
                        text
                        // @ts-ignore
                        href={
                          RESTManager.endpoint +
                          (row.type === SnippetType.Function
                            ? '/serverless/'
                            : '/snippets/') +
                          row.reference +
                          '/' +
                          row.name +
                          (row.private ? `?token=${getToken()}` : '')
                        }
                        target="_blank"
                        size="tiny"
                      >
                        {name}
                      </NButton>
                      {isPrivate && (
                        <Icon class={'items-center flex '}>
                          <LockIcon />
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

                filter: true,
                filterOptions,
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
                            <span class="max-w-48">
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
    }
  },
})
