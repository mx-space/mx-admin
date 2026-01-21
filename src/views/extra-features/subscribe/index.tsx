import {
  Download as DownloadIcon,
  Mail as MailIcon,
  MailX as MailXIcon,
  RefreshCw as RefreshIcon,
  Trash2 as TrashIcon,
  Users as UsersIcon,
} from 'lucide-vue-next'
import {
  NButton,
  NEmpty,
  NPopconfirm,
  NSkeleton,
  NSwitch,
  NTag,
} from 'naive-ui'
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { PropType, VNode } from 'vue'

import { useQuery } from '@tanstack/vue-query'

import { optionsApi } from '~/api/options'
import { subscribeApi } from '~/api/subscribe'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { RelativeTime } from '~/components/time/relative-time'
import { useLayout } from '~/layouts/content'

import { SubscribeBit2TextMap } from './constants'

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

// 统计卡片组件
const StatCard = defineComponent({
  props: {
    icon: { type: Object as PropType<VNode>, required: true },
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    description: { type: String },
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
          {props.description && (
            <div class="mt-1 text-xs text-neutral-400">{props.description}</div>
          )}
        </div>
      </div>
    )
  },
})

// 订阅者卡片组件
const SubscriberCard = defineComponent({
  props: {
    email: { type: String, required: true },
    subscribe: { type: Number, required: true },
    created: { type: String, required: true },
    onDelete: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const tagElements = computed(() => {
      const elements: VNode[] = []
      for (const [bit, text] of SubscribeBit2TextMap.entries()) {
        if (bit & props.subscribe) {
          elements.push(
            <NTag
              size="small"
              round
              bordered={false}
              class="!bg-neutral-100 !text-neutral-600 dark:!bg-neutral-700 dark:!text-neutral-300"
            >
              {text}
            </NTag>,
          )
        }
      }
      return elements
    })

    return () => (
      <div class="group flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-neutral-600">
        {/* 头像/图标 */}
        <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
          <MailIcon class="size-5 text-neutral-500 dark:text-neutral-400" />
        </div>

        {/* 邮箱和订阅内容 */}
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium text-neutral-800 dark:text-neutral-200">
            {props.email}
          </div>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            {tagElements.value}
          </div>
        </div>

        {/* 时间和操作 */}
        <div class="flex shrink-0 items-center gap-3">
          <div class="text-right">
            <div class="text-xs text-neutral-400">订阅于</div>
            <div class="text-sm text-neutral-500">
              <RelativeTime time={props.created} />
            </div>
          </div>
          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={props.onDelete}
          >
            {{
              trigger: () => (
                <button
                  class="rounded-lg p-2 text-neutral-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/50"
                  aria-label="删除订阅者"
                >
                  <TrashIcon class="size-4" />
                </button>
              ),
              default: () => (
                <span class="max-w-48">确定要移除该订阅者吗？</span>
              ),
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

// 加载骨架屏
const SubscriberSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
        <NSkeleton circle width={40} height={40} />
        <div class="flex-1 space-y-2">
          <NSkeleton text width="60%" />
          <NSkeleton text width="40%" />
        </div>
        <div class="space-y-1 text-right">
          <NSkeleton text width={60} />
          <NSkeleton text width={80} />
        </div>
      </div>
    )
  },
})

export default defineComponent({
  setup() {
    // 获取订阅功能状态
    const { data: statusData, refetch: refetchStatus } = useQuery({
      queryKey: ['subscribe', 'status'],
      queryFn: () => subscribeApi.getStatus(),
    })

    const subscribeEnabled = computed(() => statusData.value?.enabled ?? false)

    // 获取订阅列表
    const page = ref(1)
    const pageSize = 20

    const {
      data: listData,
      isLoading,
      refetch: refetchList,
    } = useQuery({
      queryKey: computed(() => ['subscribe', 'list', page.value]),
      queryFn: () =>
        subscribeApi.getList({
          page: page.value,
          size: pageSize,
        }),
    })

    const subscribers = computed(() => listData.value?.data ?? [])
    const pagination = computed(() => listData.value?.pagination)
    const totalCount = computed(() => pagination.value?.total ?? 0)

    // 切换订阅功能
    const toggleSubscribeEnable = async () => {
      await optionsApi.patch('featureList', {
        emailSubscribe: !subscribeEnabled.value,
      })
      refetchStatus()
    }

    // 删除订阅者
    const handleDelete = async (email: string) => {
      await subscribeApi.unsubscribe({ email })
      toast.success('已移除订阅者')
      refetchList()
    }

    // 导出订阅列表
    const handleExport = async () => {
      try {
        const blob = await subscribeApi.export()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('导出成功')
      } catch {
        toast.error('导出失败')
      }
    }

    // 刷新数据
    const handleRefresh = () => {
      refetchList()
      refetchStatus()
    }

    // 设置头部操作按钮
    const { setActions } = useLayout()
    watchEffect(() => {
      setActions(
        <>
          <HeaderActionButton
            icon={<RefreshIcon />}
            onClick={handleRefresh}
            name="刷新"
          />
          <HeaderActionButton
            icon={<DownloadIcon />}
            onClick={handleExport}
            name="导出订阅者"
            variant="info"
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
              icon={<UsersIcon />}
              label="总订阅者"
              value={totalCount.value}
              variant="default"
            />
            <StatCard
              icon={subscribeEnabled.value ? <MailIcon /> : <MailXIcon />}
              label="订阅功能"
              value={subscribeEnabled.value ? '已启用' : '已禁用'}
              variant={subscribeEnabled.value ? 'success' : 'warning'}
            />
            <div class="flex items-center justify-between rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div>
                <div class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  启用邮件订阅
                </div>
                <div class="mt-1 text-xs text-neutral-500">
                  允许访客订阅新内容通知
                </div>
              </div>
              <NSwitch
                value={subscribeEnabled.value}
                onUpdateValue={toggleSubscribeEnable}
              />
            </div>
          </div>
        </section>

        {/* 订阅者列表 */}
        <section>
          <SectionTitle title="订阅者列表">
            {{
              extra: () =>
                pagination.value && (
                  <span class="text-sm text-neutral-500">
                    共 {pagination.value.total} 位订阅者
                  </span>
                ),
            }}
          </SectionTitle>

          {isLoading.value ? (
            <div class="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SubscriberSkeleton key={i} />
              ))}
            </div>
          ) : subscribers.value.length === 0 ? (
            <div class="rounded-lg border border-dashed border-neutral-200 py-16 dark:border-neutral-700">
              <NEmpty description="暂无订阅者">
                {{
                  extra: () => (
                    <div class="mt-2 text-sm text-neutral-500">
                      开启订阅功能后，访客可以订阅您的内容更新
                    </div>
                  ),
                }}
              </NEmpty>
            </div>
          ) : (
            <div class="space-y-3">
              {subscribers.value.map((subscriber) => (
                <SubscriberCard
                  key={subscriber.id}
                  email={subscriber.email}
                  subscribe={subscriber.subscribe}
                  created={subscriber.created}
                  onDelete={() => handleDelete(subscriber.email)}
                />
              ))}
            </div>
          )}

          {/* 分页 */}
          {pagination.value && pagination.value.totalPage > 1 && (
            <div class="mt-6 flex items-center justify-center gap-2">
              <NButton
                size="small"
                disabled={!pagination.value.hasPrevPage}
                onClick={() => (page.value = page.value - 1)}
              >
                上一页
              </NButton>
              <span class="px-4 text-sm text-neutral-500">
                {pagination.value.currentPage} / {pagination.value.totalPage}
              </span>
              <NButton
                size="small"
                disabled={!pagination.value.hasNextPage}
                onClick={() => (page.value = page.value + 1)}
              >
                下一页
              </NButton>
            </div>
          )}
        </section>
      </div>
    )
  },
})
