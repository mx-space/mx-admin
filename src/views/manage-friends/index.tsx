import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { omit } from 'es-toolkit/compat'
import {
  Check as CheckIcon,
  Plus,
  RefreshCcw as RefreshCircle,
} from 'lucide-vue-next'
import {
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
  useDialog,
} from 'naive-ui'
import {
  computed,
  defineComponent,
  Fragment,
  ref,
  watchEffect,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LinkModel, LinkStateCount } from '~/models/link'

import { linksApi } from '~/api/links'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { Table } from '~/components/table'
import { RelativeTime } from '~/components/time/relative-time'
import { useDataTable } from '~/hooks/use-data-table'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/layouts/content'
import { LinkState, LinkStateNameMap, LinkType } from '~/models/link'
import { RouteName } from '~/router/name'

import { Avatar } from './components/avatar'
import { LinkAuditModal } from './components/reason-modal'
import { UrlComponent } from './url-components'

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    const queryClient = useQueryClient()

    const tabValue = ref<LinkState>(
      (route.query.state as any) ?? LinkState.Pass,
    )

    const {
      data,
      pager,
      isLoading: loading,
      refresh,
    } = useDataTable<LinkModel>({
      queryKey: (params) => queryKeys.links.list({ ...params, state: tabValue.value }),
      queryFn: (params) =>
        linksApi.getList({
          page: params.page,
          size: params.size,
          state: tabValue.value,
        }),
      pageSize: 50,
    })

    const resetEditData: () => Omit<
      LinkModel,
      'id' | 'created' | 'hide' | 'email'
    > & {
      id: null | string
    } = () => ({
      avatar: '',
      name: '',
      type: LinkType.Friend,
      url: '',
      id: null,
      description: '',
      state: LinkState.Pass,
    })
    const editDialogShow = ref(false)
    const editDialogData = ref(resetEditData())

    // 获取状态计数
    const { data: stateCountData, refetch: refetchStateCount } = useQuery({
      queryKey: queryKeys.links.stateCount(),
      queryFn: linksApi.getStateCount,
    })
    const stateCount = computed(() => stateCountData.value || ({} as LinkStateCount))

    // 创建/更新友链 mutation
    const saveMutation = useMutation({
      mutationFn: async (editData: typeof editDialogData.value) => {
        const id = editData.id
        if (id) {
          return await linksApi.update(
            id,
            omit<any, keyof LinkModel>(editData, ['id', 'created', 'hide']),
          )
        } else {
          return await linksApi.create(editData as any)
        }
      },
      onSuccess: () => {
        message.success('操作成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
        refetchStateCount()
        editDialogShow.value = false
        editDialogData.value = resetEditData()
      },
    })

    // 删除友链 mutation
    const deleteMutation = useMutation({
      mutationFn: linksApi.delete,
      onSuccess: () => {
        message.success('删除成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
        refetchStateCount()
      },
    })

    // 审核通过 mutation
    const auditPassMutation = useMutation({
      mutationFn: linksApi.auditPass,
      onSuccess: (_, id) => {
        const item = data.value.find((i) => i.id === id)
        message.success(`通过了来自${item?.name || ''}的友链邀请`)
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
        refetchStateCount()
      },
    })

    // 审核并发送理由 mutation
    const auditWithReasonMutation = useMutation({
      mutationFn: ({ id, state, reason }: { id: string; state: number; reason: string }) =>
        linksApi.auditWithReason(id, state, reason),
      onSuccess: (_, { id }) => {
        const item = data.value.find((i) => i.id === id)
        message.success(`已发送友链结果给「${item?.name || ''}」`)
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
        refetchStateCount()
      },
    })

    const onSubmit = () => {
      saveMutation.mutate(editDialogData.value)
    }

    const health = ref<
      Record<
        string,
        {
          id: string
          status: number | string
          message?: string
        }
      >
    >()

    const handleCheck = async () => {
      const l = message.loading('检查中', { duration: 20e4 })

      try {
        const result = await linksApi.checkHealth({ timeout: 20e4 })

        // HACK manual lowercase key
        // @see: https://github.com/sindresorhus/camelcase-keys/issues/85
        health.value = Object.entries(result).reduce((acc, [k, v]) => {
          return { ...acc, [k.toLowerCase()]: v }
        }, {})
        message.success('检查完成')
      } catch (error) {
        console.error(error)
      } finally {
        requestAnimationFrame(() => {
          l.destroy()
        })
      }
    }

    const handleMigrateAvatars = async () => {
      const l = message.loading('迁移中', { duration: 20e4 })

      try {
        await linksApi.migrateAvatars({ timeout: 20e4 })
        message.success('迁移完成')
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all })
      } catch (error) {
        console.error(error)
        message.error('迁移失败')
      } finally {
        requestAnimationFrame(() => {
          l.destroy()
        })
      }
    }

    const modal = useDialog()

    const { setActions } = useLayout()
    watchEffect(() => {
      setActions(
        <Fragment>
          <HeaderActionButton
            icon={<Plus />}
            variant="primary"
            onClick={() => {
              editDialogData.value = resetEditData()
              editDialogShow.value = true
            }}
          />

          <HeaderActionButton
            icon={<CheckIcon />}
            variant="info"
            onClick={handleCheck}
            name="检查友链可用性"
          />

          <HeaderActionButton
            icon={<RefreshCircle />}
            variant="info"
            onClick={handleMigrateAvatars}
            name="迁移头像"
          />
        </Fragment>,
      )
    })

    return () => (
      <>
        {/* 筛选标签区 */}
        <section class="mb-4">
          <NTabs
            class="min-h-[30px]"
            size="medium"
            value={tabValue.value}
            onUpdateValue={(e) => {
              tabValue.value = e

              router.replace({ name: RouteName.Friend, query: { state: e } })
            }}
          >
            <NTabPane
              name={LinkState.Pass}
              tab={() => (
                <div class="flex items-center gap-2">
                  <span>朋友们</span>
                  <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {stateCount.value.friends || 0}
                  </span>
                </div>
              )}
            />
            <NTabPane
              name={LinkState.Audit}
              tab={() => (
                <div class="flex items-center gap-2">
                  <span>待审核</span>
                  <span class="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {stateCount.value.audit || 0}
                  </span>
                </div>
              )}
            />
            <NTabPane
              name={LinkState.Outdate}
              tab={() => (
                <div class="flex items-center gap-2">
                  <span>过时的</span>
                  <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {stateCount.value.outdate || 0}
                  </span>
                </div>
              )}
            />
            <NTabPane
              name={LinkState.Reject}
              tab={() => (
                <div class="flex items-center gap-2">
                  <span>已拒绝</span>
                  <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {stateCount.value.reject || 0}
                  </span>
                </div>
              )}
            />
            <NTabPane
              name={LinkState.Banned}
              tab={() => (
                <div class="flex items-center gap-2">
                  <span>封禁的</span>
                  <span class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {stateCount.value.banned || 0}
                  </span>
                </div>
              )}
            />
          </NTabs>
        </section>

        {/* 表格区 */}
        <section>
          <Table
            loading={loading.value}
            data={data}
            nTableProps={{
              maxHeight: 'calc(100vh - 12rem)',
            }}
            columns={[
              {
                title: '头像',
                key: 'avatar',
                width: 80,
                render(row) {
                  return <Avatar name={row.name} avatar={row.avatar} />
                },
              },
              {
                title: '名称',
                key: 'name',
                render(row) {
                  return (
                    <a
                      target="_blank"
                      href={row.url}
                      rel="noreferrer"
                      class="hover:text-primary-600 dark:hover:text-primary-400 text-neutral-700 dark:text-neutral-300"
                    >
                      {row.name}
                    </a>
                  )
                },
              },
              {
                title: '描述',
                key: 'description',
                width: 250,
                ellipsis: { lineClamp: 2, tooltip: true },
              },
              {
                title: '网址',
                key: 'url',
                render(row) {
                  const urlHealth = health.value?.[row.id]
                  return (
                    <UrlComponent
                      url={row.url}
                      errorMessage={urlHealth?.message}
                      status={urlHealth?.status}
                    />
                  )
                },
              },
              {
                title: '类型',
                key: 'type',
                width: 80,
                render(row) {
                  return ['朋友', '收藏'][row.type | 0]
                },
              },
              {
                title: '对方邮箱',
                key: 'email',
                render(row) {
                  return (
                    <a
                      href={`mailto:${row.email}`}
                      class="hover:text-primary-600 dark:hover:text-primary-400 text-neutral-600 dark:text-neutral-400"
                    >
                      {row.email}
                    </a>
                  )
                },
              },
              {
                title: '结识时间',
                key: 'created',
                width: 80,
                render(row) {
                  return <RelativeTime time={row.created} />
                },
              },
              {
                width: 150,
                title: '操作',
                fixed: 'right',
                key: 'action',
                render(row) {
                  return (
                    <NSpace wrap={false}>
                      {row.state == LinkState.Audit && (
                        <>
                          <NButton
                            quaternary
                            size="tiny"
                            type="primary"
                            onClick={() => auditPassMutation.mutate(row.id)}
                          >
                            通过
                          </NButton>

                          <NButton
                            quaternary
                            size="tiny"
                            type="info"
                            onClick={() => {
                              modal.create({
                                title: '发送友链结果',
                                closeOnEsc: true,
                                closable: true,
                                content: () => {
                                  return (
                                    <LinkAuditModal
                                      onCallback={(state, reason) => {
                                        auditWithReasonMutation.mutate(
                                          { id: row.id, state, reason },
                                          {
                                            onSuccess: () => {
                                              modal.destroyAll()
                                            },
                                          },
                                        )
                                      }}
                                    />
                                  )
                                },
                              })
                            }}
                          >
                            理由
                          </NButton>
                        </>
                      )}
                      <NButton
                        quaternary
                        size="tiny"
                        type="info"
                        onClick={() => {
                          editDialogShow.value = true
                          editDialogData.value = { ...row }
                        }}
                      >
                        编辑
                      </NButton>
                      <NPopconfirm
                        positiveText={'取消'}
                        negativeText="删除"
                        onNegativeClick={() => deleteMutation.mutate(row.id)}
                      >
                        {{
                          trigger: () => (
                            <NButton quaternary type="error" size="tiny">
                              移除
                            </NButton>
                          ),

                          default: () => (
                            <span class="max-w-48">
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
            onFetchData={refresh}
            pager={pager as any}
          />
        </section>

        {/* Modal */}

        <NModal
          transformOrigin="center"
          show={editDialogShow.value}
          onUpdateShow={(e) => void (editDialogShow.value = e)}
        >
          <NCard
            style="width: 500px;max-width: 90vw"
            headerStyle={{ textAlign: 'center' }}
            title={
              editDialogData.value.id
                ? `编辑: ${editDialogData.value.name}`
                : '新增'
            }
          >
            <NForm>
              <NFormItem label="名字" required>
                <NInput
                  autofocus
                  value={editDialogData.value.name}
                  onInput={(e) => void (editDialogData.value.name = e)}
                />
              </NFormItem>

              <NFormItem label="头像">
                <NInput
                  autofocus
                  value={editDialogData.value.avatar}
                  onInput={(e) => void (editDialogData.value.avatar = e)}
                />
              </NFormItem>

              <NFormItem label="网址" required>
                <NInput
                  autofocus
                  value={editDialogData.value.url}
                  onInput={(e) => void (editDialogData.value.url = e)}
                />
              </NFormItem>

              <NFormItem label="描述">
                <NInput
                  autofocus
                  value={editDialogData.value.description}
                  onInput={(e) => void (editDialogData.value.description = e)}
                />
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
                />
              </NFormItem>
              {editDialogData.value.id && (
                <NFormItem label="状态">
                  <NSelect
                    placeholder="选择状态"
                    options={Object.entries(LinkStateNameMap).map(([k, v]) => ({
                      label: v,
                      value: LinkState[k],
                    }))}
                    value={editDialogData.value.state}
                    onUpdateValue={(e) =>
                      void (editDialogData.value.state = e | 0)
                    }
                  />
                </NFormItem>
              )}
            </NForm>

            <div class="text-right">
              <NSpace size={12} align="center" inline>
                <NButton type="primary" onClick={onSubmit} round>
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
      </>
    )
  },
})
