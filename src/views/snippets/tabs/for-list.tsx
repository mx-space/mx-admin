import { HeaderActionButton } from 'components/button/rounded-button'
import { AddIcon, FunctionIcon, LockIcon } from 'components/icons'
import { tableRowStyle } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useMountAndUnmount } from 'hooks/use-react'
import { useLayout } from 'layouts/content'
import {
  NButton,
  NDataTable,
  NLayout,
  NLayoutContent,
  NLayoutSider,
  NMenu,
  NPopconfirm,
  NSpace,
} from 'naive-ui'
import type { MenuMixedOption } from 'naive-ui/es/menu/src/interface'
import { RESTManager } from 'utils'
import { getToken } from 'utils/auth'
import { useRoute, useRouter } from 'vue-router'

import { Icon } from '@vicons/utils'

import { SnippetType } from '../../../models/snippet'
import type { SnippetModel } from '../../../models/snippet'
import { ImportSnippetButton } from '../components/import-snippets-button'
import { UpdateDependencyButton } from '../components/update-deps-button'
import type { SnippetGroup } from '../interfaces/snippet-group'

const useFetchReferenceNames = () => {
  const referenceNames = ref<SnippetGroup[]>([])
  const fetchReferenceNames = async () => {
    const data = await RESTManager.api.snippets.group.get<{
      data: SnippetGroup[]
    }>({
      params: {
        size: 50,
      },
    })

    referenceNames.value = data.data
  }

  onMounted(() => {
    fetchReferenceNames()
  })

  return {
    referenceNames,
    fetchReferenceNames,
  }
}

export const Tab1ForList = defineComponent({
  setup() {
    const layout = useLayout()
    const { referenceNames: references, fetchReferenceNames } =
      useFetchReferenceNames()
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

          <ImportSnippetButton onFinish={fetchReferenceNames} />
          <UpdateDependencyButton />
        </>,
      )

      return () => {
        layout.setHeaderButtons(null)
      }
    })

    const router = useRouter()
    const menuOptions = computed<MenuMixedOption[]>(() =>
      references.value.map((group) => {
        return {
          label: () => (
            <div class={'flex justify-between text-sm'}>
              <span class={'truncate'}>{group.reference}</span>
              <span class={'flex-shrink-0'}>{group.count}</span>
            </div>
          ),
          key: group.reference,
        }
      }),
    )
    const selectValue = ref('')
    let abortController: AbortController | null = null
    const datatableSource = ref<SnippetModel[] | undefined>([])
    const route = useRoute()
    const onSelect = (value: string) => {
      router.replace({
        query: {
          ...route.query,
          reference: value,
        },
      })
      selectValue.value = value
    }

    watch(
      // @ts-expect-error
      () => [selectValue.value, references.value],
      ([value]: [string, any]) => {
        if (abortController) {
          abortController.abort()
          datatableSource.value = undefined
        }
        abortController = new AbortController()
        RESTManager.api.snippets
          .group(value)
          .get<{ data: SnippetModel[] }>({
            signal: abortController.signal,
          })
          .then((res) => {
            datatableSource.value = res.data
          })
      },
    )

    onMounted(() => {
      if (route.query.reference) {
        onSelect(route.query.reference as string)
      }
    })

    return () => {
      return (
        <NLayout hasSider embedded>
          <NLayoutSider bordered width={150}>
            <NMenu
              options={menuOptions.value}
              value={selectValue.value}
              onUpdateValue={onSelect}
            ></NMenu>
          </NLayoutSider>
          <NLayoutContent>
            <NDataTable
              bordered={false}
              rowClassName={() => tableRowStyle}
              loading={!datatableSource.value}
              data={datatableSource.value}
              columns={[
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
                          href={`${
                            RESTManager.endpoint +
                            (row.type === SnippetType.Function
                              ? '/fn/'
                              : '/snippets/') +
                            row.reference
                          }/${row.name}${
                            row.private ? `?token=${getToken()}` : ''
                          }`}
                          target="_blank"
                          size="tiny"
                        >
                          {row.type == SnippetType.Function &&
                            row.method != 'GET' && (
                              <span class={'mr-2'}>{row.method} - </span>
                            )}
                          {row.enable === false ? (
                            <del>{name}</del>
                          ) : (
                            <span>{name}</span>
                          )}
                        </NButton>
                        {isPrivate && (
                          <Icon class={'items-center flex'}>
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
                    return (
                      <RelativeTime
                        showPopoverInfoAbsoluteTime
                        time={row.created}
                      />
                    )
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
                                ...route.query,
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
                            if (!datatableSource.value) {
                              return
                            }
                            datatableSource.value =
                              datatableSource.value.filter((source) => {
                                return source.id !== row.id
                              })
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
            />
          </NLayoutContent>
        </NLayout>
      )
    }
  },
})

const colums = [
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
            href={`${
              RESTManager.endpoint +
              (row.type === SnippetType.Function ? '/fn/' : '/snippets/') +
              row.reference
            }/${row.name}${row.private ? `?token=${getToken()}` : ''}`}
            target="_blank"
            size="tiny"
          >
            {row.type == SnippetType.Function && row.method != 'GET' && (
              <span class={'mr-2'}>{row.method} - </span>
            )}
            {row.enable === false ? <del>{name}</del> : <span>{name}</span>}
          </NButton>
          {isPrivate && (
            <Icon class={'items-center flex'}>
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
              // router.push({
              //   query: {
              //     tab: 1,
              //     id: row.id,
              //   },
              // })
            }}
          >
            编辑
          </NButton>

          {/* <NPopconfirm
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
          </NPopconfirm> */}
        </NSpace>
      )
    },
  },
]
