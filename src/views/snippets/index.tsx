import CheckCircleOutlined from '@vicons/antd/CheckCircleOutlined'
import Lock from '@vicons/antd/LockFilled'
import Add12Filled from '@vicons/fluent/es/Add12Filled'
import { Icon } from '@vicons/utils'
import { HeaderActionButton } from 'components/button/rounded-button'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useMountAndUnmount } from 'hooks/use-react'
import { useTable } from 'hooks/use-table'
import { ContentLayout, useLayout } from 'layouts/content'
import { omit } from 'lodash-es'
import { PaginateResult } from 'models/base'
import {
  NButton,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NPopconfirm,
  NSelect,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui'
import { RESTManager } from 'utils'
import { useRoute, useRouter } from 'vue-router'
import { SnippetModel, SnippetType } from '../../models/snippet'
import { CodeEditorForSnippet } from './code-editor'
// const provideKey = Symbol('provideKey')
// const useTabContext = () => inject(provideKey)

export default defineComponent({
  name: 'SnippetView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const currentTab = computed(() => route.query.tab || '0')

    // provide(provideKey, {
    //   currentTab,
    // })
    return () => (
      <ContentLayout>
        <NTabs
          size="medium"
          value={currentTab.value as string}
          onUpdateValue={(e) => {
            router.push({
              query: {
                tab: e,
              },
            })
          }}
        >
          <NTabPane name={'0'} tab={'列表'}>
            <Tab1ForList />
          </NTabPane>

          <NTabPane name={'1'} tab={'编辑'}>
            <Tab2ForEdit />
          </NTabPane>
        </NTabs>
      </ContentLayout>
    )
  },
})

const Tab1ForList = defineComponent({
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
              render(row) {
                const name = row.name
                const isPrivate = row.private
                return (
                  <NSpace align="center">
                    {name}
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

const Tab2ForEdit = defineComponent({
  setup() {
    const router = useRouter()
    const route = useRoute()
    const editId = computed(() => route.query.id as string)

    const data = ref<SnippetModel>(new SnippetModel())
    watch(
      () => editId,
      async (editId) => {
        if (editId.value) {
          const _data = await RESTManager.api
            .snippets(editId.value)
            .get<SnippetModel>()
          switch (_data.type) {
            case SnippetType.JSON: {
              _data.raw = JSON.stringify(JSON.parse(_data.raw), null, 2)
              break
            }
          }
          data.value = _data
        }
      },
      {
        immediate: true,
      },
    )

    const layout = useLayout()
    const message = useMessage()
    const handleUpdateOrCreate = async () => {
      const tinyJson = (() => {
        try {
          return JSON.stringify(JSON.parse(data.value.raw), null, 0)
        } catch {
          message.error('JSON 格式错误')
        }
      })()

      const omitData = omit(data.value, ['_id', 'id', 'created', 'updated'])
      const finalData = { ...omitData, raw: tinyJson }
      if (!finalData.metatype) {
        delete finalData.metatype
      }

      if (editId.value) {
        await RESTManager.api.snippets(editId.value).put({
          data: finalData,
        })
      } else {
        await RESTManager.api.snippets.post({
          data: finalData,
        })
      }

      message.success(`${editId.value ? '更新' : '创建'}成功`)
      router.replace({
        query: {
          ...route.query,
          tab: 0,
        },
      })
    }
    useMountAndUnmount(() => {
      layout.setHeaderButton(
        <HeaderActionButton
          variant="success"
          onClick={handleUpdateOrCreate}
          icon={<CheckCircleOutlined />}
        ></HeaderActionButton>,
      )

      return () => {
        layout.setHeaderButton(null)
      }
    })

    return () => (
      <>
        <NGrid cols={'36 1:12 1024:36 1600:36'}>
          <NGi span={12}>
            <NForm>
              <NFormItem label="名称" required>
                <NInput
                  onUpdateValue={(e) => void (data.value.name = e)}
                  value={data.value.name}
                ></NInput>
              </NFormItem>

              <NFormItem label="引用" required>
                <NInput
                  value={data.value.reference}
                  onUpdateValue={(e) => void (data.value.reference = e)}
                  defaultValue={'root'}
                ></NInput>
              </NFormItem>

              <NFormItem label="元类型">
                <NInput
                  value={data.value.metatype}
                  onUpdateValue={(e) => void (data.value.metatype = e)}
                ></NInput>
              </NFormItem>

              <NFormItem label="数据类型">
                <NSelect
                  value={data.value.type}
                  defaultValue={SnippetType.JSON}
                  onUpdateValue={(val) => void (data.value.type = val)}
                  options={Object.entries(SnippetType).map(([k, v]) => {
                    return {
                      label: k,
                      value: v,
                    }
                  })}
                ></NSelect>
              </NFormItem>

              <NFormItem label="公开" labelPlacement="left">
                <div class="w-full flex justify-end">
                  <NSwitch
                    value={!data.value.private}
                    onUpdateValue={(val) => void (data.value.private = !val)}
                  ></NSwitch>
                </div>
              </NFormItem>
              <NFormItem label="备注">
                <NInput
                  resizable={false}
                  value={data.value.comment}
                  onUpdateValue={(val) => void (data.value.comment = val)}
                  type="textarea"
                  rows={4}
                ></NInput>
              </NFormItem>
            </NForm>
          </NGi>

          <NGi span={24} class={'ml-[40px]'}>
            <CodeEditorForSnippet
              value={data.value.raw}
              onChange={(value) => {
                data.value.raw = value
              }}
            />
          </NGi>
        </NGrid>
      </>
    )
  },
})
