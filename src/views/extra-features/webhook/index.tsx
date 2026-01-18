import { cloneDeep } from 'es-toolkit/compat'
import {
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  ExternalLink as ExternalLinkIcon,
  Pencil as PencilIcon,
  Play as PlayIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshIcon,
  Trash2 as TrashIcon,
  Webhook as WebhookIcon,
  X as XIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NCheckbox,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NLayoutContent,
  NPopconfirm,
  NSelect,
  NSkeleton,
  NSwitch,
  NTag,
} from 'naive-ui'
import type { WebhookModel } from '~/api/webhooks'
import type { PropType, VNode } from 'vue'

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { webhooksApi } from '~/api/webhooks'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { queryKeys } from '~/hooks/queries/keys'
import { useLayout } from '~/layouts/content'
import { EventScope } from '~/models/wehbook'

// 分区标题组件
const SectionTitle = defineComponent({
  props: {
    title: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () => (
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium text-neutral-700 dark:text-neutral-300">
            {props.title}
          </h3>
          {slots.extra?.()}
        </div>
        <div class="mt-2 h-px bg-neutral-200 dark:bg-neutral-700" />
      </div>
    )
  },
})

// 状态指示器
const StatusIndicator = defineComponent({
  props: {
    enabled: { type: Boolean, required: true },
    size: { type: String as PropType<'sm' | 'md'>, default: 'md' },
  },
  setup(props) {
    const sizeClasses = {
      sm: 'size-2',
      md: 'size-2.5',
    }
    return () => (
      <div class="relative flex shrink-0 items-center justify-center">
        {props.enabled && (
          <span
            class={[
              'absolute inline-flex animate-ping rounded-full bg-green-400 opacity-75',
              sizeClasses[props.size],
            ]}
          />
        )}
        <span
          class={[
            'relative inline-flex rounded-full',
            props.enabled ? 'bg-green-500' : 'bg-neutral-400',
            sizeClasses[props.size],
          ]}
        />
      </div>
    )
  },
})

// 统计卡片组件
const StatCard = defineComponent({
  props: {
    icon: { type: Object as PropType<VNode>, required: true },
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    variant: {
      type: String as PropType<'default' | 'success' | 'warning'>,
      default: 'default',
    },
  },
  setup(props) {
    const variantStyles = {
      default: 'bg-neutral-50 dark:bg-neutral-800/50',
      success: 'bg-green-50 dark:bg-green-950/30',
      warning: 'bg-amber-50 dark:bg-amber-950/30',
    }
    const iconStyles = {
      default: 'text-neutral-400',
      success: 'text-green-500',
      warning: 'text-amber-500',
    }
    return () => (
      <div
        class={[
          'flex items-center gap-4 rounded-lg p-4',
          variantStyles[props.variant],
        ]}
      >
        <div class={['shrink-0 text-2xl', iconStyles[props.variant]]}>
          {props.icon}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-2xl font-semibold tabular-nums">
            {typeof props.value === 'number'
              ? Intl.NumberFormat('zh-CN').format(props.value)
              : props.value}
          </div>
          <div class="text-xs text-neutral-500">{props.label}</div>
        </div>
      </div>
    )
  },
})

// Webhook 卡片组件
const WebhookCard = defineComponent({
  props: {
    webhook: { type: Object as PropType<WebhookModel>, required: true },
    onEdit: { type: Function as PropType<() => void>, required: true },
    onDelete: { type: Function as PropType<() => void>, required: true },
    onTest: {
      type: Function as PropType<(event: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const isExpanded = ref(false)

    // 事件标签颜色映射
    const getEventColor = (event: string) => {
      if (event === 'all') return 'info'
      if (event.includes('create')) return 'success'
      if (event.includes('update')) return 'warning'
      if (event.includes('delete')) return 'error'
      return 'default'
    }

    // Scope 文本映射
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

    return () => (
      <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-600">
        {/* 主要内容区 */}
        <div class="p-4">
          <div class="flex items-start gap-4">
            {/* 状态和图标 */}
            <div class="relative mt-1 flex shrink-0 items-center justify-center">
              <div class="flex size-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-700">
                <WebhookIcon class="size-5 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div class="absolute -bottom-1 -right-1">
                <StatusIndicator enabled={props.webhook.enabled} size="sm" />
              </div>
            </div>

            {/* 信息区 */}
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate font-medium text-neutral-800 dark:text-neutral-200">
                  {props.webhook.payloadUrl || props.webhook.url}
                </span>
                <a
                  href={props.webhook.payloadUrl || props.webhook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="在新标签页打开"
                >
                  <ExternalLinkIcon class="size-4" />
                </a>
              </div>

              {/* 事件标签 */}
              <div class="mt-2 flex flex-wrap gap-1.5">
                {props.webhook.events.slice(0, 5).map((event) => (
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
                {props.webhook.events.length > 5 && (
                  <NTag size="small" round bordered={false}>
                    +{props.webhook.events.length - 5}
                  </NTag>
                )}
              </div>

              {/* 元信息 */}
              <div class="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                <span>Scope: {getScopeText(props.webhook.scope)}</span>
                <span>
                  状态:{' '}
                  <span
                    class={
                      props.webhook.enabled
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-neutral-500'
                    }
                  >
                    {props.webhook.enabled ? '启用' : '禁用'}
                  </span>
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div class="flex shrink-0 items-center gap-1">
              <button
                class="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-950/50"
                onClick={props.onEdit}
                aria-label="编辑"
              >
                <PencilIcon class="size-4" />
              </button>
              <NPopconfirm
                positiveText="取消"
                negativeText="删除"
                onNegativeClick={props.onDelete}
              >
                {{
                  trigger: () => (
                    <button
                      class="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"
                      aria-label="删除"
                    >
                      <TrashIcon class="size-4" />
                    </button>
                  ),
                  default: () => (
                    <span class="max-w-48">确定要删除此 Webhook 吗？</span>
                  ),
                }}
              </NPopconfirm>
            </div>
          </div>
        </div>

        {/* 展开/测试区 */}
        <div class="border-t border-neutral-100 bg-neutral-50/50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800/30">
          <div class="flex items-center justify-between">
            <button
              class="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              onClick={() => (isExpanded.value = !isExpanded.value)}
            >
              <ChevronRightIcon
                class={[
                  'size-4 transition-transform',
                  isExpanded.value && 'rotate-90',
                ]}
              />
              {isExpanded.value ? '收起详情' : '展开详情'}
            </button>
            <NSelect
              size="tiny"
              placeholder="选择事件测试"
              options={props.webhook.events.map((e) => ({
                label: e,
                value: e,
              }))}
              style={{ width: '150px' }}
              onUpdateValue={(event: string) => props.onTest(event)}
              v-slots={{
                action: () => (
                  <div class="flex items-center gap-1 text-xs text-neutral-500">
                    <PlayIcon class="size-3" />
                    发送测试
                  </div>
                ),
              }}
            />
          </div>

          {/* 展开的详细信息 */}
          {isExpanded.value && (
            <div class="mt-3 space-y-2 text-xs">
              <div class="flex gap-2">
                <span class="shrink-0 text-neutral-500">全部事件:</span>
                <div class="flex flex-wrap gap-1">
                  {props.webhook.events.map((event) => (
                    <span
                      key={event}
                      class="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-700"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
              {props.webhook.created && (
                <div class="text-neutral-500">
                  创建时间:{' '}
                  {new Date(props.webhook.created).toLocaleString('zh-CN')}
                </div>
              )}
              {props.webhook.updated && (
                <div class="text-neutral-500">
                  更新时间:{' '}
                  {new Date(props.webhook.updated).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  },
})

// Webhook 编辑表单
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

    // 获取可用事件列表
    const { data: eventsData } = useQuery({
      queryKey: queryKeys.webhooks.events(),
      queryFn: () => webhooksApi.getEvents(),
    })

    const availableEvents = computed(() => eventsData.value?.data ?? [])

    // 当表单数据变化时同步
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
              {/* Payload URL */}
              <NFormItem label="Payload URL" required>
                <NInput
                  value={localFormData.value.payloadUrl}
                  onUpdateValue={(v) => (localFormData.value.payloadUrl = v)}
                  placeholder="https://example.com/webhook"
                />
              </NFormItem>

              {/* Secret */}
              <NFormItem label="Secret">
                <NInput
                  value={localFormData.value.secret}
                  onUpdateValue={(v) => (localFormData.value.secret = v)}
                  type="password"
                  showPasswordOn="click"
                  placeholder={isEdit.value ? '留空保持不变' : '可选的签名密钥'}
                />
              </NFormItem>

              {/* Events */}
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

              {/* Scope */}
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

              {/* Enabled */}
              <NFormItem label="启用状态">
                <div class="flex items-center gap-3">
                  <NSwitch
                    value={localFormData.value.enabled}
                    onUpdateValue={(v) => (localFormData.value.enabled = v)}
                  />
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {localFormData.value.enabled
                      ? '已启用，将接收事件推送'
                      : '已禁用，暂停接收事件'}
                  </span>
                </div>
              </NFormItem>
            </NForm>

            {/* 提交按钮 */}
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

// 骨架屏
const WebhookSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <div class="flex items-start gap-4">
          <NSkeleton width={40} height={40} />
          <div class="flex-1 space-y-3">
            <NSkeleton text width="70%" />
            <div class="flex gap-2">
              <NSkeleton text width={60} />
              <NSkeleton text width={60} />
              <NSkeleton text width={60} />
            </div>
            <NSkeleton text width="40%" />
          </div>
        </div>
      </div>
    )
  },
})

export default defineComponent({
  setup() {
    const queryClient = useQueryClient()

    // 获取 Webhook 列表
    const {
      data: webhooksData,
      isLoading,
      refetch,
    } = useQuery({
      queryKey: queryKeys.webhooks.list(),
      queryFn: () => webhooksApi.getList(),
    })

    const webhooks = computed(() => webhooksData.value?.data ?? [])
    const enabledCount = computed(
      () => webhooks.value.filter((w) => w.enabled).length,
    )

    // 创建 Webhook
    const createMutation = useMutation({
      mutationFn: webhooksApi.create,
      onSuccess: () => {
        message.success('Webhook 创建成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
        drawerVisible.value = false
        editingWebhook.value = undefined
      },
    })

    // 更新 Webhook
    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<WebhookModel> }) =>
        webhooksApi.update(id, data),
      onSuccess: () => {
        message.success('Webhook 更新成功')
        queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
        drawerVisible.value = false
        editingWebhook.value = undefined
      },
    })

    // 删除 Webhook
    const deleteMutation = useMutation({
      mutationFn: webhooksApi.delete,
      onSuccess: () => {
        message.success('Webhook 已删除')
        queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all })
      },
    })

    // 测试 Webhook
    const testMutation = useMutation({
      mutationFn: ({ id, event }: { id: string; event: string }) =>
        webhooksApi.test(id, event),
      onSuccess: () => {
        message.success('测试请求已发送')
      },
      onError: () => {
        message.error('测试请求发送失败')
      },
    })

    // Drawer 状态
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
        updateMutation.mutate({ id: editingWebhook.value.id, data: submitData })
      } else {
        createMutation.mutate(data as any)
      }
    }

    const handleDelete = (id: string) => {
      deleteMutation.mutate(id)
    }

    const handleTest = (id: string, event: string) => {
      testMutation.mutate({ id, event })
    }

    // 设置头部操作按钮
    const { setActions } = useLayout()
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
      <div class="space-y-8">
        {/* 概览统计 */}
        <section>
          <SectionTitle title="概览" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<WebhookIcon />}
              label="总 Webhook 数"
              value={webhooks.value.length}
              variant="default"
            />
            <StatCard
              icon={<CheckIcon />}
              label="已启用"
              value={enabledCount.value}
              variant="success"
            />
            <StatCard
              icon={<XIcon />}
              label="已禁用"
              value={webhooks.value.length - enabledCount.value}
              variant={
                webhooks.value.length - enabledCount.value > 0
                  ? 'warning'
                  : 'default'
              }
            />
          </div>
        </section>

        {/* Webhook 列表 */}
        <section>
          <SectionTitle title="Webhook 列表">
            {{
              extra: () => (
                <span class="text-sm text-neutral-500">
                  共 {webhooks.value.length} 个 Webhook
                </span>
              ),
            }}
          </SectionTitle>

          {isLoading.value ? (
            <div class="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <WebhookSkeleton key={i} />
              ))}
            </div>
          ) : webhooks.value.length === 0 ? (
            <div class="rounded-lg border border-dashed border-neutral-200 py-16 dark:border-neutral-700">
              <NEmpty description="暂无 Webhook">
                {{
                  extra: () => (
                    <div class="mt-4">
                      <NButton type="primary" onClick={handleCreate}>
                        <PlusIcon class="mr-2 size-4" />
                        创建第一个 Webhook
                      </NButton>
                    </div>
                  ),
                }}
              </NEmpty>
            </div>
          ) : (
            <div class="space-y-3">
              {webhooks.value.map((webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  onEdit={() => handleEdit(webhook)}
                  onDelete={() => handleDelete(webhook.id)}
                  onTest={(event) => handleTest(webhook.id, event)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 编辑 Drawer */}
        <WebhookEditDrawer
          show={drawerVisible.value}
          formData={editingWebhook.value}
          onClose={() => {
            drawerVisible.value = false
            editingWebhook.value = undefined
          }}
          onSubmit={handleSubmit}
        />
      </div>
    )
  },
})
