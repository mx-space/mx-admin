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
} from 'naive-ui'
import { RESTManager } from 'utils'
import { useRoute, useRouter } from 'vue-router'
import { SnippetModel, SnippetType } from '../../models/snippet'
const provideKey = Symbol('provideKey')
const useTabContext = () => inject(provideKey)

export default defineComponent({
  name: 'SnippetView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const currentTab = computed(() => route.query.tab || '0')

    provide(provideKey, {
      currentTab,
    })
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

    onMounted(async () => {
      if (editId.value) {
        const _data = await RESTManager.api
          .snippets(editId.value)
          .get<SnippetModel>()

        console.log(_data)
        data.value = _data
      }
    })

    const layout = useLayout()

    useMountAndUnmount(() => {
      layout.setHeaderButton(
        <HeaderActionButton
          variant="success"
          onClick={() => {
            // TODO
          }}
          icon={<CheckCircleOutlined />}
        ></HeaderActionButton>,
      )

      return () => {
        layout.setHeaderButton(null)
      }
    })

    return () => (
      <>
        <NGrid xGap={40} yGap={16} cols={'36 1:12 1024:36 1600:36'}>
          <NGi span={12}>
            <NForm>
              <NFormItem label="名称" required>
                <NInput value={data.value.name}></NInput>
              </NFormItem>

              <NFormItem label="引用">
                <NInput
                  value={data.value.reference}
                  defaultValue={'root'}
                ></NInput>
              </NFormItem>

              <NFormItem label="数据类型">
                <NSelect
                  value={data.value.type}
                  defaultValue={SnippetType.JSON}
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
                  <NSwitch value={data.value.private}></NSwitch>
                </div>
              </NFormItem>
              <NFormItem label="备注">
                <NInput
                  value={data.value.name}
                  type="textarea"
                  rows={4}
                ></NInput>
              </NFormItem>
            </NForm>
          </NGi>

          <NGi span={24}>
            <span>editor placeholder</span>
          </NGi>
        </NGrid>
      </>
    )
  },
})
