import { cloneDeep } from 'es-toolkit/compat'
import {
  ArrowLeft,
  Calendar,
  ExternalLink as ExternalLinkIcon,
  Globe,
  Pencil as PencilIcon,
  Play as PlayIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshIcon,
  Shield,
  Trash2 as TrashIcon,
  Webhook as WebhookIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCheckbox,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NLayoutContent,
  NPopconfirm,
  NScrollbar,
  NSwitch,
  NTag,
  NTooltip,
} from 'naive-ui'
import { computed, defineComponent, ref, watch, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { WebhookModel } from '~/api/webhooks'
import type { PropType, VNode } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { webhooksApi } from '~/api/webhooks'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { MasterDetailLayout, useMasterDetailLayout } from '~/components/layout'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/layouts/content'
import { EventScope } from '~/models/wehbook'

const getScopeText = (scope: number) => {
  const scopes: string[] = []
  if ((scope & EventScope.TO_VISITOR) === EventScope.TO_VISITOR)
    scopes.push('访客')
  if ((scope & EventScope.TO_ADMIN) === EventScope.TO_ADMIN)
    scopes.push('管理员')
  if ((scope & EventScope.TO_SYSTEM) === EventScope.TO_SYSTEM)
    scopes.push('系统')
  return scopes.join(', ') || '未指定'
}

const getEventColor = (event: string) => {
  if (event === 'all') return 'info' as const
  if (event.includes('create')) return 'success' as const
  if (event.includes('update')) return 'warning' as const
  if (event.includes('delete')) return 'error' as const
  return 'default' as const
}

export default defineComponent({
  setup() {
    const queryClient = useQueryClient()
    const { setActions } = useLayout()
    const { isMobile } = useMasterDetailLayout()

    const {
      data: webhooksData,
      isLoading,
      refetch,
    } = useQuery({
      queryKey: queryKeys.webhooks.list(),
      queryFn: () => webhooksApi.getList(),
    })

    const webhooks = computed(() => webhooksData.value ?? [])

    const selectedId = ref<string | null>(null)
    const showDetailOnMobile = ref(false)

    const selectedWebhook = computed(() =>
      webhooks.value.find((w) => w.id === selectedId.value),
    )

    const createMutation = useMutation({
      mutationFn: webhooksApi.create,
      onSuccess: () => {
        toast.success('Webhook 创建成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
        drawerVisible.value = false
        editingWebhook.value = undefined
      },
    })

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<WebhookModel> }) =>
        webhooksApi.update(id, data),
      onSuccess: () => {
        toast.success('Webhook 更新成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
        drawerVisible.value = false
        editingWebhook.value = undefined
      },
    })

    const deleteMutation = useMutation({
      mutationFn: webhooksApi.delete,
      onSuccess: () => {
        toast.success('Webhook 已删除')
        queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
      },
    })

    const testMutation = useMutation({
      mutationFn: ({ id, event }: { id: string; event: string }) =>
        webhooksApi.test(id, event),
      onSuccess: () => {
        toast.success('测试请求已发送')
      },
      onError: () => {
        toast.error('测试请求发送失败')
      },
    })

    const drawerVisible = ref(false)
    const editingWebhook = ref<WebhookModel | undefined>()

    const handleCreate = () => {
      editingWebhook.value = undefined
      drawerVisible.value = true
    }

    const handleEdit = (webhook: WebhookModel) => {
      editingWebhook.value = webhook
      drawerVisible.value = true
    }

    const handleSubmit = (data: Partial<WebhookModel>) => {
      if (editingWebhook.value?.id) {
        const submitData = { ...data }
        if (!submitData.secret) {
          delete submitData.secret
        }
        updateMutation.mutate({
          id: editingWebhook.value.id,
          data: submitData,
        })
      } else {
        createMutation.mutate(data as any)
      }
    }

    const handleDelete = (id: string) => {
      deleteMutation.mutate(id)
      if (selectedId.value === id) {
        selectedId.value = null
        showDetailOnMobile.value = false
      }
    }

    const handleTest = (id: string, event: string) => {
      testMutation.mutate({ id, event })
    }

    const handleSelect = (webhook: WebhookModel) => {
      selectedId.value = webhook.id
      if (isMobile.value) {
        showDetailOnMobile.value = true
      }
    }

    const handleBack = () => {
      showDetailOnMobile.value = false
    }

    watchEffect(() => {
      setActions(
        <>
          <HeaderActionButton
            icon={<RefreshIcon />}
            onClick={() => refetch()}
            name="刷新"
          />
          <HeaderActionButton
            icon={<PlusIcon />}
            onClick={handleCreate}
            name="添加 Webhook"
            variant="primary"
          />
        </>,
      )
    })

    return () => (
      <>
        <MasterDetailLayout
          showDetailOnMobile={showDetailOnMobile.value}
          defaultSize={0.35}
          min={0.25}
          max={0.45}
        >
          {{
            list: () => (
              <WebhookListPanel
                data={webhooks.value}
                loading={isLoading.value}
                selectedId={selectedId.value}
                onSelect={handleSelect}
                onCreate={handleCreate}
              />
            ),
            detail: () =>
              selectedWebhook.value ? (
                <WebhookDetailPanel
                  webhook={selectedWebhook.value}
                  isMobile={isMobile.value}
                  onBack={handleBack}
                  onEdit={() => handleEdit(selectedWebhook.value!)}
                  onDelete={() => handleDelete(selectedWebhook.value!.id)}
                  onTest={(event) =>
                    handleTest(selectedWebhook.value!.id, event)
                  }
                />
              ) : null,
            empty: () => <WebhookDetailEmptyState />,
          }}
        </MasterDetailLayout>

        <WebhookEditDrawer
          show={drawerVisible.value}
          formData={editingWebhook.value}
          onClose={() => {
            drawerVisible.value = false
            editingWebhook.value = undefined
          }}
          onSubmit={handleSubmit}
        />
      </>
    )
  },
})

const StatusIndicator = defineComponent({
  props: {
    enabled: { type: Boolean, required: true },
  },
  setup(props) {
    return () => (
      <div class="relative flex shrink-0 items-center justify-center">
        {props.enabled && (
          <span class="absolute inline-flex size-2 animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span
          class={[
            'relative inline-flex size-2 rounded-full',
            props.enabled ? 'bg-green-500' : 'bg-neutral-400',
          ]}
        />
      </div>
    )
  },
})

const WebhookListPanel = defineComponent({
  props: {
    data: { type: Array as PropType<WebhookModel[]>, required: true },
    loading: { type: Boolean, default: false },
    selectedId: { type: String as PropType<string | null>, default: null },
    onSelect: {
      type: Function as PropType<(webhook: WebhookModel) => void>,
      required: true,
    },
    onCreate: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const enabledCount = computed(
      () => props.data.filter((w) => w.enabled).length,
    )

    return () => (
      <div class="flex h-full flex-col">
        <div class="flex h-12 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Webhooks
          </span>
          <span class="text-xs text-neutral-400">
            {enabledCount.value}/{props.data.length} 启用
          </span>
        </div>

        <div class="min-h-0 flex-1">
          {props.loading ? (
            <div class="flex items-center justify-center py-24">
              <div class="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
            </div>
          ) : props.data.length === 0 ? (
            <WebhookListEmptyState onCreate={props.onCreate} />
          ) : (
            <NScrollbar class="h-full">
              {props.data.map((webhook) => (
                <div
                  key={webhook.id}
                  class={[
                    'flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3',
                    'transition-colors last:border-b-0 dark:border-neutral-800/50',
                    props.selectedId === webhook.id
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30',
                  ]}
                  onClick={() => props.onSelect(webhook)}
                >
                  <StatusIndicator enabled={webhook.enabled} />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {webhook.payloadUrl || webhook.url}
                    </div>
                    <div class="mt-0.5 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                      <span>{webhook.events.length} 个事件</span>
                      <span>·</span>
                      <span>{getScopeText(webhook.scope)}</span>
                    </div>
                  </div>
                  <NTag
                    size="small"
                    type={webhook.enabled ? 'success' : 'default'}
                    bordered={false}
                    round
                  >
                    {webhook.enabled ? '启用' : '禁用'}
                  </NTag>
                </div>
              ))}
            </NScrollbar>
          )}
        </div>
      </div>
    )
  },
})

const WebhookDetailPanel = defineComponent({
  props: {
    webhook: { type: Object as PropType<WebhookModel>, required: true },
    isMobile: { type: Boolean, default: false },
    onBack: { type: Function as PropType<() => void>, required: true },
    onEdit: { type: Function as PropType<() => void>, required: true },
    onDelete: { type: Function as PropType<() => void>, required: true },
    onTest: {
      type: Function as PropType<(event: string) => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex h-full flex-col bg-white dark:bg-black">
        {/* Header */}
        <div class="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div class="flex items-center gap-3">
            {props.isMobile && (
              <button
                onClick={props.onBack}
                class="-ml-2 flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ArrowLeft class="size-5" />
              </button>
            )}
            <h2 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Webhook 详情
            </h2>
          </div>
          <div class="flex items-center gap-1">
            <DetailActionButton
              icon={PencilIcon}
              label="编辑"
              onClick={props.onEdit}
            />
            <NPopconfirm
              positiveText="取消"
              negativeText="删除"
              onNegativeClick={props.onDelete}
            >
              {{
                trigger: () => (
                  <DetailActionButton icon={TrashIcon} label="删除" danger />
                ),
                default: () => (
                  <span class="max-w-48">确定要删除此 Webhook 吗？</span>
                ),
              }}
            </NPopconfirm>
          </div>
        </div>

        {/* Content */}
        <NScrollbar class="min-h-0 flex-1">
          <div class="mx-auto max-w-3xl space-y-6 p-6">
            {/* Webhook Header */}
            <div class="flex items-start gap-4">
              <div class="relative shrink-0">
                <div class="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                  <WebhookIcon class="size-7 text-neutral-500 dark:text-neutral-400" />
                </div>
                <div class="absolute -bottom-1 -right-1">
                  <div class="rounded-full border-2 border-white bg-white dark:border-black dark:bg-black">
                    <StatusIndicator enabled={props.webhook.enabled} />
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {props.webhook.payloadUrl || props.webhook.url}
                  </span>
                  <a
                    href={props.webhook.payloadUrl || props.webhook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    <ExternalLinkIcon class="size-4" />
                  </a>
                </div>
                <div class="mt-1 flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                  <NTag
                    size="small"
                    type={props.webhook.enabled ? 'success' : 'default'}
                    bordered={false}
                    round
                  >
                    {props.webhook.enabled ? '已启用' : '已禁用'}
                  </NTag>
                  <span>{getScopeText(props.webhook.scope)}</span>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div class="grid grid-cols-2 gap-4">
              <InfoCard
                icon={<Globe class="size-4" />}
                label="触发范围"
                value={getScopeText(props.webhook.scope)}
              />
              <InfoCard
                icon={<Shield class="size-4" />}
                label="Secret"
                value={props.webhook.secret ? '已配置' : '未配置'}
              />
              {props.webhook.created && (
                <InfoCard
                  icon={<Calendar class="size-4" />}
                  label="创建时间"
                  value={new Date(props.webhook.created).toLocaleString(
                    'zh-CN',
                  )}
                />
              )}
              {props.webhook.updated && (
                <InfoCard
                  icon={<RefreshIcon class="size-4" />}
                  label="更新时间"
                  value={new Date(props.webhook.updated).toLocaleString(
                    'zh-CN',
                  )}
                />
              )}
            </div>

            {/* Events */}
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                触发事件 ({props.webhook.events.length})
              </h4>
              <div class="flex flex-wrap gap-2">
                {props.webhook.events.map((event) => (
                  <NTag
                    key={event}
                    size="small"
                    type={getEventColor(event)}
                    round
                    bordered={false}
                  >
                    {event}
                  </NTag>
                ))}
              </div>
            </div>

            {/* Test */}
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                发送测试
              </h4>
              <div class="flex flex-wrap gap-2">
                {props.webhook.events.map((event) => (
                  <NButton
                    key={event}
                    size="small"
                    quaternary
                    onClick={() => props.onTest(event)}
                  >
                    {{
                      icon: () => <PlayIcon class="size-3.5" />,
                      default: () => event,
                    }}
                  </NButton>
                ))}
              </div>
            </div>
          </div>
        </NScrollbar>
      </div>
    )
  },
})

const InfoCard = defineComponent({
  props: {
    icon: { type: Object as PropType<VNode>, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () => (
      <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div class="mb-2 flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
          {props.icon}
          <span class="text-xs">{props.label}</span>
        </div>
        <div class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {props.value}
        </div>
      </div>
    )
  },
})

const DetailActionButton = defineComponent({
  props: {
    icon: { type: Object as PropType<any>, required: true },
    label: { type: String, required: true },
    danger: { type: Boolean, default: false },
    onClick: { type: Function as PropType<() => void> },
  },
  setup(props) {
    return () => (
      <NTooltip>
        {{
          trigger: () => (
            <button
              onClick={props.onClick}
              class={[
                'flex size-8 items-center justify-center rounded-md transition-colors',
                props.danger
                  ? 'text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-900/20 dark:hover:text-red-500'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
              ]}
            >
              <props.icon class="size-4" />
            </button>
          ),
          default: () => props.label,
        }}
      </NTooltip>
    )
  },
})

const WebhookDetailEmptyState = defineComponent({
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <WebhookIcon class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
          选择一个 Webhook
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          从左侧列表选择查看详情
        </p>
      </div>
    )
  },
})

const WebhookListEmptyState = defineComponent({
  props: {
    onCreate: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <WebhookIcon class="mb-4 size-10 text-neutral-300 dark:text-neutral-700" />
        <p class="text-sm text-neutral-500">暂无 Webhook</p>
        <p class="mb-4 mt-1 text-xs text-neutral-400">
          创建 Webhook 以接收事件推送
        </p>
        <NButton size="small" type="primary" onClick={props.onCreate}>
          {{
            icon: () => <PlusIcon class="size-3.5" />,
            default: () => '创建 Webhook',
          }}
        </NButton>
      </div>
    )
  },
})

const WebhookEditDrawer = defineComponent({
  props: {
    show: { type: Boolean, required: true },
    formData: { type: Object as PropType<Partial<WebhookModel>> },
    onClose: { type: Function as PropType<() => void>, required: true },
    onSubmit: {
      type: Function as PropType<(data: Partial<WebhookModel>) => void>,
      required: true,
    },
  },
  setup(props) {
    const isEdit = computed(() => !!props.formData?.id)

    const localFormData = ref<Partial<WebhookModel>>({
      events: [],
      enabled: true,
      scope: EventScope.TO_SYSTEM,
    })

    const { data: eventsData } = useQuery({
      queryKey: queryKeys.webhooks.events(),
      queryFn: () => webhooksApi.getEvents(),
    })

    const availableEvents = computed(() => eventsData.value ?? [])

    watch(
      () => props.formData,
      (newData) => {
        if (newData) {
          localFormData.value = cloneDeep(newData)
        } else {
          localFormData.value = {
            events: [],
            enabled: true,
            scope: EventScope.TO_SYSTEM,
          }
        }
      },
      { immediate: true },
    )

    const checkedEventsSet = computed(() => new Set(localFormData.value.events))

    const handleSubmit = () => {
      props.onSubmit(localFormData.value)
    }

    return () => (
      <NDrawer
        show={props.show}
        onUpdateShow={(show) => !show && props.onClose()}
        width={500}
        placement="right"
      >
        <NDrawerContent
          title={isEdit.value ? '编辑 Webhook' : '创建 Webhook'}
          closable
        >
          <div class="space-y-6">
            <NForm labelPlacement="top">
              <NFormItem label="Payload URL" required>
                <NInput
                  value={localFormData.value.payloadUrl}
                  onUpdateValue={(v) => (localFormData.value.payloadUrl = v)}
                  placeholder="https://example.com/webhook"
                />
              </NFormItem>

              <NFormItem label="Secret">
                <NInput
                  value={localFormData.value.secret}
                  onUpdateValue={(v) => (localFormData.value.secret = v)}
                  type="password"
                  showPasswordOn="click"
                  placeholder={isEdit.value ? '留空保持不变' : '可选的签名密钥'}
                />
              </NFormItem>

              <NFormItem label="触发事件" required>
                <NLayoutContent
                  nativeScrollbar={false}
                  class="!h-[300px] rounded-lg border border-neutral-200 !bg-neutral-50 p-3 dark:border-neutral-700 dark:!bg-neutral-800/50"
                >
                  <div class="mb-3 border-b border-neutral-200 pb-3 dark:border-neutral-700">
                    <NCheckbox
                      checked={checkedEventsSet.value.has('all')}
                      onUpdateChecked={(checked) => {
                        if (checked) {
                          localFormData.value.events = ['all']
                        } else {
                          localFormData.value.events = []
                        }
                      }}
                    >
                      <span class="font-medium">全部事件</span>
                    </NCheckbox>
                  </div>
                  <NGrid cols={2} xGap={12} yGap={8}>
                    {availableEvents.value.map((event) => (
                      <NGi key={event}>
                        <NCheckbox
                          checked={
                            checkedEventsSet.value.has(event) ||
                            checkedEventsSet.value.has('all')
                          }
                          disabled={checkedEventsSet.value.has('all')}
                          onUpdateChecked={(checked) => {
                            const events = localFormData.value.events || []
                            if (checked) {
                              localFormData.value.events = [...events, event]
                            } else {
                              localFormData.value.events = events.filter(
                                (e) => e !== event,
                              )
                            }
                          }}
                        >
                          <span class="text-sm">{event}</span>
                        </NCheckbox>
                      </NGi>
                    ))}
                  </NGrid>
                </NLayoutContent>
              </NFormItem>

              <NFormItem label="触发范围">
                <div class="flex flex-wrap gap-3">
                  {(
                    Object.keys(EventScope) as Array<keyof typeof EventScope>
                  ).map((key) => {
                    const scope = EventScope[key]
                    const value = localFormData.value.scope ?? 0
                    const scopeLabels: Record<string, string> = {
                      TO_VISITOR: '访客操作',
                      TO_ADMIN: '管理员操作',
                      TO_SYSTEM: '系统事件',
                      ALL: '全部',
                    }
                    return (
                      <NCheckbox
                        key={key}
                        checked={
                          (value & scope) === scope || value === EventScope.ALL
                        }
                        onUpdateChecked={(checked) => {
                          if (checked) {
                            localFormData.value.scope =
                              (localFormData.value.scope ?? 0) | scope
                          } else {
                            localFormData.value.scope =
                              (localFormData.value.scope ?? 0) & ~scope
                          }
                        }}
                      >
                        {scopeLabels[key] || key}
                      </NCheckbox>
                    )
                  })}
                </div>
              </NFormItem>

              <NFormItem label="启用状态">
                <div class="flex items-center gap-3">
                  <NSwitch
                    value={localFormData.value.enabled}
                    onUpdateValue={(v) => (localFormData.value.enabled = v)}
                  />
                </div>
              </NFormItem>
            </NForm>

            <div class="flex justify-end gap-3">
              <NButton onClick={props.onClose}>取消</NButton>
              <NButton type="primary" onClick={handleSubmit}>
                {isEdit.value ? '保存' : '创建'}
              </NButton>
            </div>
          </div>
        </NDrawerContent>
      </NDrawer>
    )
  },
})
