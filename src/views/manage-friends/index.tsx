import { Plus } from '@vicons/fa'
import { HeaderActionButton } from 'components/button/rounded-button'
import { Table } from 'components/table'
import { useTable } from 'hooks/use-table'
import { ContentLayout } from 'layouts/content'
import { LinkModel, LinkResponse, LinkState, LinkType } from 'models/link'
import {
  NAvatar,
  NBadge,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NText,
  useMessage,
} from 'naive-ui'
import { omit } from 'naive-ui/lib/_utils'
import { RouteName } from 'router/name'
import { RESTManager } from 'utils'
import { defineComponent, onBeforeMount, ref, toRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()

    const tabValue = ref<LinkState>(
      (route.query.state as any) ?? LinkState.Pass,
    )

    const { data, checkedRowKeys, fetchDataFn, pager, loading } =
      useTable<LinkModel>(
        (data, pager) =>
          async (
            page = route.query.page || 1,
            size = 50,
            state: LinkState = (route.query.state as any | 0) ?? LinkState.Pass,
          ) => {
            const response = await RESTManager.api.links.get<LinkResponse>({
              params: {
                page,
                size,
                state: state | 0,
              },
            })
            data.value = response.data
            pager.value = response.page
          },
      )
    const message = useMessage()
    const resetEditData: () => Omit<LinkModel, 'id' | 'state'> & {
      id: null | string
    } = () => ({
      avatar: '',
      name: '',
      type: LinkType.Friend,
      url: '',
      id: null,
      description: '',
    })
    const editDialogShow = ref(false)
    const editDialogData = ref(resetEditData())

    watch(
      () => route.query.state,
      async (_) => {
        await fetchDataFn()
      },
    )

    watch(
      () => route.query.page,
      async (_) => {
        await fetchDataFn()
      },
      { immediate: true },
    )
    const auditCount = ref(0)
    onBeforeMount(async () => {
      const state = (await RESTManager.api.links.state.get()) as {
        audit: number
        collection: number
        friends: number
      }
      auditCount.value = state.audit
    })
    const onSubmit = async () => {
      const id = editDialogData.value.id
      editDialogData.value.id
      if (id) {
        await RESTManager.api
          .links(id)
          .put({ data: omit(editDialogData.value, ['id']) })

        const idx = data.value.findIndex((i) => i.id == id)
        // @ts-expect-error
        data.value[idx] = { ...data.value[idx], ...toRaw(editDialogData.value) }
      } else {
        const { data: item } = (await RESTManager.api.links.post({
          data: { ...editDialogData.value },
        })) as any
        data.value.unshift(item)
      }
      message.success('操作成功')
      editDialogData.value = resetEditData()
      editDialogShow.value = false
    }

    return () => (
      <ContentLayout
        actionsElement={
          <Fragment>
            <HeaderActionButton
              icon={<Plus />}
              variant="primary"
              onClick={() => {
                editDialogData.value = resetEditData()
                editDialogShow.value = true
              }}
            ></HeaderActionButton>
          </Fragment>
        }
      >
        <NTabs
          size="medium"
          value={tabValue.value}
          onUpdateValue={(e) => {
            tabValue.value = e
            router.replace({ name: RouteName.Friend, query: { state: e } })
          }}
        >
          <NTabPane name={LinkState.Pass} tab="朋友们">
            <div class=""></div>
          </NTabPane>
          <NTabPane
            name={LinkState.Audit}
            tab={() => (
              <NBadge value={auditCount.value} processing>
                <NText>待审核</NText>
              </NBadge>
            )}
          >
            <div class=""></div>
          </NTabPane>
        </NTabs>

        <Table
          loading={loading.value}
          data={data}
          nTableProps={{
            virtualScroll: true,
            maxHeight: 'calc(100vh - 22rem)',
          }}
          columns={[
            {
              title: '头像',
              key: 'avatar',
              render(row) {
                return row.avatar ? (
                  <NAvatar src={row.avatar as string} round></NAvatar>
                ) : (
                  <NAvatar round>{row.name.charAt(0)}</NAvatar>
                )
              },
            },
            { title: '名称', key: 'name' },
            {
              title: '类型',
              key: 'type',
              render(row) {
                return ['朋友', '收藏'][row.type | 0]
              },
            },
            {
              title: '网址',
              key: 'url',
              render(row) {
                return (
                  <a target="_blank" href={row.url} rel="noreferrer">
                    {row.url}
                  </a>
                )
              },
            },
            { title: '描述', key: 'description' },
            {
              title: '操作',
              fixed: 'right',
              key: 'id',
              render(row) {
                return (
                  <NSpace wrap={false}>
                    {row.state == LinkState.Audit && (
                      <NButton
                        text
                        size="tiny"
                        type="success"
                        onClick={async () => {
                          await RESTManager.api.links.audit(row.id).patch()
                          message.success(
                            '通过了来自' + row.name + '的友链邀请',
                          )
                          const idx = data.value.findIndex(
                            (i) => i.id == row.id,
                          )
                          data.value.splice(idx, 1)
                          auditCount.value--
                        }}
                      >
                        通过
                      </NButton>
                    )}
                    <NButton
                      text
                      size="tiny"
                      type="info"
                      onClick={(_) => {
                        editDialogShow.value = true
                        editDialogData.value = { ...row }
                      }}
                    >
                      编辑
                    </NButton>
                    <NPopconfirm
                      positiveText={'取消'}
                      negativeText="删除"
                      onNegativeClick={async () => {
                        await RESTManager.api.links(row.id).delete()
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
                            确定要删除友链 {row.name} ?
                          </span>
                        ),
                      }}
                    </NPopconfirm>
                  </NSpace>
                )
              },
            },
          ]}
          onFetchData={fetchDataFn}
          pager={pager}
        ></Table>

        {/* Modal */}

        <NModal
          show={editDialogShow.value}
          onUpdateShow={(e) => void (editDialogShow.value = e)}
        >
          <NCard
            style="width: 500px;max-width: 90vw"
            headerStyle={{ textAlign: 'center' }}
            title={
              editDialogData.value.id
                ? '编辑: ' + editDialogData.value.name
                : '新增'
            }
          >
            <NForm>
              <NFormItem label="名字" required>
                <NInput
                  autofocus
                  value={editDialogData.value.name}
                  onInput={(e) => void (editDialogData.value.name = e)}
                ></NInput>
              </NFormItem>

              <NFormItem label="头像">
                <NInput
                  autofocus
                  value={editDialogData.value.avatar}
                  onInput={(e) => void (editDialogData.value.avatar = e)}
                ></NInput>
              </NFormItem>

              <NFormItem label="网址" required>
                <NInput
                  autofocus
                  value={editDialogData.value.url}
                  onInput={(e) => void (editDialogData.value.url = e)}
                ></NInput>
              </NFormItem>

              <NFormItem label="描述">
                <NInput
                  autofocus
                  value={editDialogData.value.description}
                  onInput={(e) => void (editDialogData.value.description = e)}
                ></NInput>
              </NFormItem>

              <NFormItem label="类型">
                <NSelect
                  placeholder="选择类型"
                  options={[
                    { label: '朋友', value: LinkType.Friend },
                    { label: '收藏', value: LinkType.Collection },
                  ]}
                  value={editDialogData.value.type}
                  onUpdateValue={(e) =>
                    void (editDialogData.value.type = e | 0)
                  }
                ></NSelect>
              </NFormItem>
            </NForm>

            <div class="text-right">
              <NSpace size={12} align="center" inline>
                <NButton type="success" onClick={onSubmit} round>
                  确定
                </NButton>
                <NButton
                  onClick={() => {
                    editDialogShow.value = false
                    editDialogData.value = resetEditData()
                  }}
                  round
                >
                  取消
                </NButton>
              </NSpace>
            </div>
          </NCard>
        </NModal>
      </ContentLayout>
    )
  },
})
