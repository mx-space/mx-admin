import { FileText, RefreshCw, Trash2 } from 'lucide-vue-next'
import { NCard, NModal, NSelect, NSpin, useDialog, useMessage } from 'naive-ui'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { Xterm } from '~/components/xterm'
import { RESTManager } from '~/utils'

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
        const { data: data$ } = await RESTManager.api.health.log
          .list(logType.value)
          .get<{ data: LogFile[] }>()
        data.value = data$
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
      const text = await RESTManager.api.health.log(logType.value).get<string>({
        params: { filename: item.filename },
      })
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
          await RESTManager.api.health.log(logType.value).delete({
            params: { filename: item.filename },
          })
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
          <NCard
            title={viewingFilename.value || '查看日志'}
            class="modal-card !bg-neutral-900"
            bordered={false}
            closable
            onClose={() => (showLog.value = false)}
          >
            <LogDisplay data={logData.value} />
          </NCard>
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
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.value.map((item) => (
                    <LogFileCard
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

const LogFileCard = defineComponent({
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
        <div
          class={[
            'group relative rounded-xl border p-4',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200 dark:border-neutral-800',
            'transition-all duration-150',
            'hover:border-neutral-300 dark:hover:border-neutral-700',
            'hover:shadow-sm',
          ]}
        >
          {/* Header */}
          <div class="mb-3 flex items-start justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <div
                class={[
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  isError
                    ? 'bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
                ]}
              >
                <FileText class="size-4" />
              </div>
              <span
                class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100"
                title={item.filename}
              >
                {item.filename}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div class="mb-4 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <span class="tabular-nums">{item.size}</span>
            <span
              class={[
                'rounded-full px-2 py-0.5',
                isError
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
              ]}
            >
              {item.type}
            </span>
          </div>

          {/* Actions */}
          <div class="flex items-center gap-2">
            <button
              onClick={props.onView}
              class={[
                'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium',
                'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
                'hover:bg-neutral-800 dark:hover:bg-neutral-100',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900',
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
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-red-400 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-red-500 dark:focus-visible:ring-offset-neutral-900',
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

const LogEmptyState = defineComponent({
  setup() {
    return () => (
      <div class="flex h-[300px] flex-col items-center justify-center text-neutral-400">
        <FileText class="mb-4 size-12 text-neutral-300 dark:text-neutral-600" />
        <p class="mb-2 text-lg font-medium text-neutral-600 dark:text-neutral-300">
          暂无日志文件
        </p>
        <p class="text-sm">当前没有可用的日志文件</p>
      </div>
    )
  },
})

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
      }, 500)
    })

    return () => (
      <div class="relative flex h-[60vh] max-h-[600px] min-h-[300px] overflow-hidden rounded-lg">
        {wait.value ? (
          <div class="flex h-full w-full items-center justify-center">
            <NSpin show strokeWidth={14} />
          </div>
        ) : (
          <Xterm
            class="w-full flex-grow"
            onReady={(term) => {
              term.write(props.data)
            }}
          />
        )}
      </div>
    )
  },
})
