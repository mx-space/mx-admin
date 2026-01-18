/**
 * Log List View
 * 日志文件列表 - 列表形式
 */
import { FileText, RefreshCw, Trash2, X } from 'lucide-vue-next'
import { NModal, NSelect, NSpin, useDialog, useMessage } from 'naive-ui'
import type { PropType } from 'vue'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { Xterm } from '~/components/xterm'
import { healthApi } from '~/api/health'

interface LogFile {
  filename: string
  size: string
  type: string
}

export const LogListView = defineComponent({
  setup() {
    const data = ref<LogFile[]>([])
    const loading = ref(false)
    const logType = ref<'native' | 'pm2'>('native')
    const dialog = useDialog()
    const message = useMessage()

    const fetchDataFn = async () => {
      loading.value = true
      try {
        const response = await healthApi.getLogList()
        data.value = response.data
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchDataFn()
    })

    const logData = ref('')
    const showLog = ref(false)
    const viewingFilename = ref('')

    const handleView = async (item: LogFile) => {
      const text = await healthApi.getLogContent(item.filename)
      logData.value = text
      viewingFilename.value = item.filename
      showLog.value = true
    }

    const handleDelete = (item: LogFile) => {
      dialog.warning({
        title: '确认删除',
        content: `确定要删除日志文件「${item.filename}」吗？此操作不可恢复。`,
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          await healthApi.deleteLog(item.filename)
          data.value = data.value.filter((i) => i.filename !== item.filename)
          message.success('删除成功')
        },
      })
    }

    return () => (
      <>
        {/* Log Viewer Modal */}
        <NModal
          transformOrigin="center"
          show={showLog.value}
          onUpdateShow={(s) => (showLog.value = s)}
        >
          <div class="w-full max-w-4xl rounded-xl bg-neutral-900 shadow-2xl">
            {/* Modal Header */}
            <div class="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
              <div class="flex items-center gap-3">
                <div class="flex size-8 items-center justify-center rounded-lg bg-neutral-800">
                  <FileText class="size-4 text-neutral-400" />
                </div>
                <h2 class="text-base font-medium text-white">
                  {viewingFilename.value || '查看日志'}
                </h2>
              </div>
              <button
                type="button"
                class="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                onClick={() => (showLog.value = false)}
                aria-label="关闭"
              >
                <X class="size-5" />
              </button>
            </div>
            {/* Modal Body */}
            <div class="p-4">
              <LogDisplay data={logData.value} />
            </div>
          </div>
        </NModal>

        {/* Main Content */}
        <div class="space-y-4">
          {/* Header */}
          <div class="flex items-center justify-between">
            <NSelect
              class="w-36"
              value={logType.value}
              onUpdateValue={(v) => {
                logType.value = v
                fetchDataFn()
              }}
              options={[
                { label: 'PM2 日志', value: 'pm2' },
                { label: '系统日志', value: 'native' },
              ]}
              aria-label="选择日志类型"
            />
            <HeaderActionButton
              icon={<RefreshCw />}
              name="刷新"
              onClick={fetchDataFn}
              disabled={loading.value}
            />
          </div>

          {/* Content */}
          <NSpin show={loading.value}>
            <div class="min-h-[300px]">
              {data.value.length === 0 && !loading.value ? (
                <LogEmptyState />
              ) : (
                <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  {data.value.map((item) => (
                    <LogFileListItem
                      key={item.filename}
                      item={item}
                      onView={() => handleView(item)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </NSpin>
        </div>
      </>
    )
  },
})

/**
 * Log File List Item
 */
const LogFileListItem = defineComponent({
  props: {
    item: {
      type: Object as PropType<LogFile>,
      required: true,
    },
    onView: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const { item } = props
      const isError = item.type === 'error' || item.filename.includes('error')

      return (
        <div class="group flex items-center gap-4 border-b border-neutral-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
          {/* Icon */}
          <div
            class={[
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              isError
                ? 'bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
            ]}
          >
            <FileText class="size-5" />
          </div>

          {/* Content */}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span
                class="truncate text-base font-medium text-neutral-900 dark:text-neutral-100"
                title={item.filename}
              >
                {item.filename}
              </span>
              <span
                class={[
                  'shrink-0 rounded-full px-2 py-0.5 text-xs',
                  isError
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
                ]}
              >
                {item.type}
              </span>
            </div>
            <div class="mt-0.5 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
              {item.size}
            </div>
          </div>

          {/* Actions */}
          <div class="flex shrink-0 items-center gap-2">
            <button
              onClick={props.onView}
              class={[
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
                'hover:bg-neutral-800 dark:hover:bg-neutral-100',
                'transition-colors duration-150',
              ]}
            >
              查看
            </button>
            <button
              onClick={props.onDelete}
              aria-label={`删除 ${item.filename}`}
              class={[
                'flex size-8 items-center justify-center rounded-lg',
                'text-neutral-400 hover:text-red-500',
                'hover:bg-red-50 dark:hover:bg-red-950/50',
                'transition-colors duration-150',
              ]}
            >
              <Trash2 class="size-4" />
            </button>
          </div>
        </div>
      )
    }
  },
})

/**
 * Empty State
 */
const LogEmptyState = defineComponent({
  setup() {
    return () => (
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <FileText class="size-8 text-neutral-400" />
        </div>
        <h3 class="mb-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">
          暂无日志文件
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          当前没有可用的日志文件
        </p>
      </div>
    )
  },
})

/**
 * Log Display with Terminal
 */
const LogDisplay = defineComponent({
  props: {
    data: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const wait = ref(true)

    onMounted(() => {
      setTimeout(() => {
        wait.value = false
      }, 300)
    })

    return () => (
      <div class="relative flex h-[60vh] max-h-[600px] min-h-[300px] overflow-hidden rounded-lg">
        {wait.value ? (
          <div class="flex h-full w-full items-center justify-center">
            <NSpin show strokeWidth={14} />
          </div>
        ) : (
          <Xterm
            darkMode
            class="h-full w-full"
            onReady={(term) => {
              term.write(props.data)
            }}
          />
        )}
      </div>
    )
  },
})
