import {
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-vue-next'
import { NDrawer, NDrawerContent, NPagination, NScrollbar } from 'naive-ui'
import { computed, defineComponent, ref, watch } from 'vue'
import type { ServerlessLogEntry } from '~/api/serverless'
import type { PropType } from 'vue'

import { useQuery } from '@tanstack/vue-query'

import { serverlessApi } from '~/api/serverless'
import { RelativeTime } from '~/components/time/relative-time'
import { queryKeys } from '~/hooks/queries/keys'

type StatusFilter = 'all' | 'success' | 'error'

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '成功', value: 'success' },
  { label: '错误', value: 'error' },
]

export const FnLogDrawer = defineComponent({
  props: {
    show: { type: Boolean, required: true },
    id: { type: String, required: true },
    onClose: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const page = ref(1)
    const statusFilter = ref<StatusFilter>('all')
    const expandedId = ref<string | null>(null)

    const queryParams = computed(() => ({
      page: page.value,
      size: 20,
      ...(statusFilter.value !== 'all' && { status: statusFilter.value }),
    }))

    const { data: logsData, isLoading } = useQuery({
      queryKey: computed(() =>
        queryKeys.serverless.logs(props.id, queryParams.value),
      ),
      queryFn: () =>
        serverlessApi.getInvocationLogs(props.id, queryParams.value),
      enabled: computed(() => props.show && !!props.id),
    })

    const logs = computed(() => logsData.value?.data ?? [])
    const pagination = computed(() => logsData.value?.pagination)

    watch(
      () => statusFilter.value,
      () => {
        page.value = 1
        expandedId.value = null
      },
    )

    watch(
      () => props.show,
      (show) => {
        if (!show) {
          expandedId.value = null
          page.value = 1
          statusFilter.value = 'all'
        }
      },
    )

    const toggleExpand = (id: string) => {
      expandedId.value = expandedId.value === id ? null : id
    }

    return () => (
      <NDrawer
        show={props.show}
        onUpdateShow={(show) => !show && props.onClose()}
        width={600}
        placement="right"
      >
        <NDrawerContent title="函数调用日志" closable>
          <div class="flex h-full flex-col gap-3">
            {/* Status filter */}
            <div class="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  class={[
                    'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    statusFilter.value === f.value
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                  ]}
                  onClick={() => (statusFilter.value = f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Log list */}
            <div class="min-h-0 flex-1">
              {isLoading.value ? (
                <div class="flex items-center justify-center py-24">
                  <div class="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
                </div>
              ) : logs.value.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-24 text-center">
                  <p class="text-sm text-neutral-400">暂无调用记录</p>
                </div>
              ) : (
                <NScrollbar class="h-full">
                  <div class="space-y-1">
                    {logs.value.map((log) => (
                      <LogItem
                        key={log.id}
                        log={log}
                        expanded={expandedId.value === log.id}
                        onToggle={() => toggleExpand(log.id)}
                      />
                    ))}
                  </div>
                </NScrollbar>
              )}
            </div>

            {/* Pagination */}
            {pagination.value && pagination.value.totalPage > 1 && (
              <div class="flex shrink-0 justify-center border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <NPagination
                  page={page.value}
                  onUpdatePage={(p) => (page.value = p)}
                  pageCount={pagination.value.totalPage}
                  pageSize={20}
                />
              </div>
            )}
          </div>
        </NDrawerContent>
      </NDrawer>
    )
  },
})

const LogItem = defineComponent({
  props: {
    log: { type: Object as PropType<ServerlessLogEntry>, required: true },
    expanded: { type: Boolean, required: true },
    onToggle: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <button
          class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          onClick={props.onToggle}
        >
          {/* Expand icon */}
          {props.expanded ? (
            <ChevronDownIcon class="size-3.5 shrink-0 text-neutral-400" />
          ) : (
            <ChevronRightIcon class="size-3.5 shrink-0 text-neutral-400" />
          )}

          {/* Status dot */}
          <span
            class={[
              'inline-block size-2 shrink-0 rounded-full',
              props.log.status === 'success' ? 'bg-green-500' : 'bg-red-500',
            ]}
          />

          {/* Method badge */}
          <span
            class={[
              'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
              props.log.status === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            ]}
          >
            {props.log.method}
          </span>

          {/* Execution time */}
          <span class="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
            {props.log.executionTime}ms
          </span>

          {/* Spacer */}
          <span class="flex-1" />

          {/* IP */}
          <span class="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
            {props.log.ip}
          </span>

          {/* Time */}
          <span class="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
            <RelativeTime time={props.log.created} />
          </span>
        </button>

        {props.expanded && <LogDetail id={props.log.id} />}
      </div>
    )
  },
})

const LogDetail = defineComponent({
  props: {
    id: { type: String, required: true },
  },
  setup(props) {
    const { data: detail, isLoading } = useQuery({
      queryKey: computed(() => queryKeys.serverless.logDetail(props.id)),
      queryFn: () => serverlessApi.getInvocationLogDetail(props.id),
      staleTime: 5 * 60 * 1000,
    })

    return () => (
      <div class="border-t border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
        {isLoading.value ? (
          <div class="flex items-center justify-center py-4">
            <div class="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
          </div>
        ) : !detail.value ? (
          <p class="text-xs text-neutral-400">无法加载详情</p>
        ) : (
          <div class="space-y-3">
            {/* Console logs */}
            {detail.value.logs && detail.value.logs.length > 0 && (
              <div>
                <h4 class="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Console
                </h4>
                <div class="rounded-lg bg-neutral-100 p-3 font-mono text-xs text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                  {detail.value.logs.map((entry, i) => (
                    <div
                      key={i}
                      class={[
                        'whitespace-pre-wrap break-all',
                        logLevelColor(entry.level),
                      ]}
                    >
                      <span class="mr-2 select-none text-neutral-500 dark:text-neutral-400">
                        [{entry.level}]
                      </span>
                      {formatLogArgs(entry.args)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {detail.value.error && (
              <div>
                <h4 class="mb-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  Error
                </h4>
                <div class="rounded-lg bg-red-100 p-3 font-mono text-xs text-red-900 dark:bg-red-950/90 dark:text-red-100">
                  <div class="font-semibold">
                    {detail.value.error.name}: {detail.value.error.message}
                  </div>
                  {detail.value.error.stack && (
                    <pre class="mt-2 whitespace-pre-wrap break-all dark:text-red-200">
                      {detail.value.error.stack}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Empty detail */}
            {(!detail.value.logs || detail.value.logs.length === 0) &&
              !detail.value.error && (
                <p class="text-xs text-neutral-400">无输出</p>
              )}
          </div>
        )}
      </div>
    )
  },
})

function logLevelColor(level: string): string {
  switch (level) {
    case 'warn':
      return 'text-amber-700 dark:text-amber-400'
    case 'error':
      return 'text-red-700 dark:text-red-400'
    case 'info':
      return 'text-blue-700 dark:text-blue-400'
    case 'debug':
      return 'text-neutral-600 dark:text-neutral-400'
    default:
      return 'text-neutral-700 dark:text-neutral-300'
  }
}

function formatLogArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg
      try {
        return JSON.stringify(arg, null, 2)
      } catch {
        return String(arg)
      }
    })
    .join(' ')
}
