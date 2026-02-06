import {
  Download as DownloadIcon,
  Mail as MailIcon,
  MailX as MailXIcon,
  RefreshCw as RefreshIcon,
  Search as SearchIcon,
  Trash2 as TrashIcon,
  Users as UsersIcon,
} from 'lucide-vue-next'
import {
  NCheckbox,
  NEmpty,
  NInput,
  NPagination,
  NPopconfirm,
  NSkeleton,
  NSwitch,
} from 'naive-ui'
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import type { PropType, VNode } from 'vue'

import { useQuery } from '@tanstack/vue-query'

import { optionsApi } from '~/api/options'
import { subscribeApi } from '~/api/subscribe'
import { HeaderActionButton } from '~/components/button/header-action-button'
import { RelativeTime } from '~/components/time/relative-time'
import { useLayout } from '~/layouts/content'

import {
  SubscribeNoteCreateBit,
  SubscribePostCreateBit,
  SubscribeRecentCreateBit,
  SubscribeSayCreateBit,
} from './constants'

const SubscribeTags = defineComponent({
  props: {
    subscribe: { type: Number, required: true },
  },
  setup(props) {
    const bits = [
      { bit: SubscribePostCreateBit, label: '博文', color: 'blue' },
      { bit: SubscribeNoteCreateBit, label: '手记', color: 'green' },
      { bit: SubscribeRecentCreateBit, label: '速记', color: 'amber' },
      { bit: SubscribeSayCreateBit, label: '说说', color: 'purple' },
    ]

    const colorStyles: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      green:
        'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
      amber:
        'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      purple:
        'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    }

    return () => (
      <div class="flex items-center gap-1.5">
        {bits
          .filter(({ bit }) => bit & props.subscribe)
          .map(({ label, color }) => (
            <span
              class={[
                'rounded px-1.5 py-0.5 text-xs font-medium',
                colorStyles[color],
              ]}
            >
              {label}
            </span>
          ))}
      </div>
    )
  },
})

const SubscriberRow = defineComponent({
  props: {
    email: { type: String, required: true },
    subscribe: { type: Number, required: true },
    created: { type: String, required: true },
    selected: { type: Boolean, default: false },
    onSelect: { type: Function as PropType<(checked: boolean) => void> },
    onDelete: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div
        class={[
          'group relative flex cursor-default items-center gap-4 border-b border-neutral-100 px-4 py-3.5 transition-colors last:border-b-0 dark:border-neutral-800',
          props.selected
            ? 'bg-neutral-100 dark:bg-neutral-800'
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        ]}
        onClick={() => props.onSelect?.(!props.selected)}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <NCheckbox
            checked={props.selected}
            onUpdateChecked={(checked) => props.onSelect?.(checked)}
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm text-neutral-800 dark:text-neutral-100">
            {props.email}
          </div>
        </div>

        <div class="hidden shrink-0 sm:block">
          <SubscribeTags subscribe={props.subscribe} />
        </div>

        <div class="w-16 shrink-0 text-right text-sm tabular-nums text-neutral-400 transition-opacity group-hover:opacity-0">
          <RelativeTime time={props.created} />
        </div>

        <div class="absolute right-4 opacity-0 transition-opacity group-hover:opacity-100">
          <NPopconfirm
            positiveText="取消"
            negativeText="删除"
            onNegativeClick={props.onDelete}
          >
            {{
              trigger: () => (
                <button
                  class="flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-all hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TrashIcon class="size-4" />
                </button>
              ),
              default: () => <span>确定要移除该订阅者吗？</span>,
            }}
          </NPopconfirm>
        </div>
      </div>
    )
  },
})

const SubscriberSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="flex items-center gap-4 border-b border-neutral-100 px-4 py-4 last:border-b-0 dark:border-neutral-800">
        <NSkeleton circle width={20} height={20} />
        <div class="flex-1">
          <NSkeleton text width="45%" />
        </div>
        <div class="hidden gap-1.5 sm:flex">
          <NSkeleton text width={40} />
          <NSkeleton text width={40} />
        </div>
        <NSkeleton text width={70} />
        <div class="w-8" />
      </div>
    )
  },
})

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
    const bgStyles = {
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
          bgStyles[props.variant],
        ]}
      >
        <div class={['shrink-0 text-2xl', iconStyles[props.variant]]}>
          {props.icon}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-2xl font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
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

export default defineComponent({
  setup() {
    const { data: statusData, refetch: refetchStatus } = useQuery({
      queryKey: ['subscribe', 'status'],
      queryFn: () => subscribeApi.getStatus(),
    })

    const subscribeEnabled = computed(() => statusData.value?.enable ?? false)

    const page = ref(1)
    const pageSize = 50
    const searchQuery = ref('')

    const {
      data: listData,
      isLoading,
      refetch: refetchList,
    } = useQuery({
      queryKey: computed(() => ['subscribe', 'list', page.value]),
      queryFn: () => subscribeApi.getList({ page: page.value, size: pageSize }),
    })

    const subscribers = computed(() => listData.value?.data ?? [])
    const pagination = computed(() => listData.value?.pagination)
    const totalCount = computed(() => pagination.value?.total ?? 0)

    const filteredSubscribers = computed(() => {
      if (!searchQuery.value.trim()) return subscribers.value
      const query = searchQuery.value.toLowerCase()
      return subscribers.value.filter((s) =>
        s.email.toLowerCase().includes(query),
      )
    })

    const selectedIds = ref<Set<string>>(new Set())
    const isDeleting = ref(false)

    const isAllSelected = computed(() => {
      if (filteredSubscribers.value.length === 0) return false
      return filteredSubscribers.value.every((s) => selectedIds.value.has(s.id))
    })

    const isPartialSelected = computed(() => {
      if (selectedIds.value.size === 0) return false
      return !isAllSelected.value
    })

    const selectedCount = computed(() => selectedIds.value.size)

    const toggleSelect = (id: string, checked: boolean) => {
      if (checked) {
        selectedIds.value.add(id)
      } else {
        selectedIds.value.delete(id)
      }
      selectedIds.value = new Set(selectedIds.value)
    }

    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedIds.value = new Set()
      } else {
        selectedIds.value = new Set(filteredSubscribers.value.map((s) => s.id))
      }
    }

    const clearSelection = () => {
      selectedIds.value = new Set()
    }

    const toggleSubscribeEnable = async () => {
      await optionsApi.patch('featureList', {
        emailSubscribe: !subscribeEnabled.value,
      })
      refetchStatus()
    }

    const handleDelete = async (email: string) => {
      await subscribeApi.unsubscribe({ email })
      toast.success('已移除订阅者')
      refetchList()
    }

    const handleBatchDelete = async () => {
      const emails = subscribers.value
        .filter((s) => selectedIds.value.has(s.id))
        .map((s) => s.email)
      if (emails.length === 0) return

      isDeleting.value = true
      try {
        const { deletedCount } = await subscribeApi.unsubscribeBatch({ emails })
        toast.success(`已移除 ${deletedCount} 位订阅者`)
        clearSelection()
        refetchList()
      } catch {
        toast.error('批量删除失败')
      } finally {
        isDeleting.value = false
      }
    }

    const handleDeleteAll = async () => {
      isDeleting.value = true
      try {
        const { deletedCount } = await subscribeApi.unsubscribeBatch({
          all: true,
        })
        toast.success(`已移除全部 ${deletedCount} 位订阅者`)
        clearSelection()
        refetchList()
      } catch {
        toast.error('删除失败')
      } finally {
        isDeleting.value = false
      }
    }

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

    const handleRefresh = () => {
      refetchList()
      refetchStatus()
    }

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
            name="导出"
            variant="info"
          />
        </>,
      )
    })

    return () => (
      <div class="flex h-full flex-col gap-6">
        {/* 概览 */}
        <div class="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
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

        {/* 订阅者列表 */}
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          {/* 工具栏 */}
          <div class="flex shrink-0 items-center gap-4 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            {/* 全选 */}
            <NCheckbox
              checked={isAllSelected.value}
              indeterminate={isPartialSelected.value}
              onUpdateChecked={toggleSelectAll}
            />

            {/* 搜索框 */}
            <NInput
              value={searchQuery.value}
              onUpdateValue={(val) => (searchQuery.value = val)}
              placeholder="搜索订阅者..."
              clearable
              class="flex-1"
            >
              {{
                prefix: () => <SearchIcon class="size-4 text-neutral-400" />,
              }}
            </NInput>

            {/* 选中状态 & 操作 */}
            {selectedCount.value > 0 ? (
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  已选择 {selectedCount.value} 项
                </span>
                <div class="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
                <button
                  class="rounded-lg px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  onClick={clearSelection}
                >
                  取消选择
                </button>
                <NPopconfirm
                  positiveText="取消"
                  negativeText="删除"
                  onNegativeClick={handleBatchDelete}
                >
                  {{
                    trigger: () => (
                      <button
                        class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
                        disabled={isDeleting.value}
                      >
                        {isDeleting.value ? '删除中...' : '删除选中'}
                      </button>
                    ),
                    default: () => (
                      <span>
                        确定要删除选中的 {selectedCount.value} 位订阅者吗？
                      </span>
                    ),
                  }}
                </NPopconfirm>
                {isAllSelected.value && totalCount.value > 0 && (
                  <NPopconfirm
                    positiveText="取消"
                    negativeText="删除全部"
                    onNegativeClick={handleDeleteAll}
                  >
                    {{
                      trigger: () => (
                        <button
                          class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                          disabled={isDeleting.value}
                        >
                          删除全部 ({totalCount.value})
                        </button>
                      ),
                      default: () => (
                        <span>
                          确定要删除全部 {totalCount.value}{' '}
                          位订阅者吗？此操作不可撤销！
                        </span>
                      ),
                    }}
                  </NPopconfirm>
                )}
              </div>
            ) : (
              <span class="text-sm text-neutral-500">
                共 {totalCount.value} 位订阅者
              </span>
            )}
          </div>

          {/* 列表 */}
          <div class="min-h-0 flex-1 overflow-y-auto">
            {isLoading.value ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SubscriberSkeleton key={i} />
              ))
            ) : filteredSubscribers.value.length === 0 ? (
              <div class="py-16">
                <NEmpty
                  description={
                    searchQuery.value ? '未找到匹配的订阅者' : '暂无订阅者'
                  }
                >
                  {{
                    extra: () =>
                      !searchQuery.value && (
                        <p class="mt-2 text-sm text-neutral-400">
                          开启订阅功能后，访客可以订阅您的内容更新
                        </p>
                      ),
                  }}
                </NEmpty>
              </div>
            ) : (
              filteredSubscribers.value.map((subscriber) => (
                <SubscriberRow
                  key={subscriber.id}
                  email={subscriber.email}
                  subscribe={subscriber.subscribe}
                  created={subscriber.created}
                  selected={selectedIds.value.has(subscriber.id)}
                  onSelect={(checked: boolean) =>
                    toggleSelect(subscriber.id, checked)
                  }
                  onDelete={() => handleDelete(subscriber.email)}
                />
              ))
            )}
          </div>

          {/* 分页 */}
          {pagination.value && pagination.value.totalPage > 1 && (
            <div class="justify-right flex shrink-0 items-center border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <NPagination
                page={pagination.value.currentPage}
                pageCount={pagination.value.totalPage}
                onUpdatePage={(p) => (page.value = p)}
              />
            </div>
          )}
        </div>
      </div>
    )
  },
})
