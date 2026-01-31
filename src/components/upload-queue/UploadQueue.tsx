import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-vue-next'
import { defineComponent } from 'vue'
import type { UploadTask } from './types'

import { TaskQueuePanel } from '~/components/task-queue-panel'

import { useUploadQueue } from './use-upload-queue'

const TaskItem = defineComponent({
  props: {
    task: {
      type: Object as () => UploadTask,
      required: true,
    },
  },
  setup(props) {
    const getStatusIcon = () => {
      switch (props.task.status) {
        case 'pending':
          return <Upload class="size-4 text-neutral-400" />
        case 'uploading':
          return <Loader2 class="size-4 animate-spin text-blue-500" />
        case 'success':
          return <CheckCircle2 class="size-4 text-green-500" />
        case 'error':
          return <AlertCircle class="size-4 text-red-500" />
      }
    }

    const isError = props.task.status === 'error'

    return () => (
      <div class="flex items-center gap-2.5 py-2">
        {getStatusIcon()}
        <span
          class={[
            'flex-1 truncate text-sm',
            isError
              ? 'text-red-600 dark:text-red-400'
              : 'text-neutral-700 dark:text-neutral-200',
          ]}
          title={props.task.error || props.task.fileName}
        >
          {props.task.fileName}
        </span>
      </div>
    )
  },
})

export const UploadQueue = defineComponent({
  name: 'UploadQueue',
  setup() {
    const queue = useUploadQueue()

    const handleClose = () => {
      if (!queue.isProcessing.value) {
        queue.clearTasks()
      }
    }

    return () => (
      <TaskQueuePanel
        visible={queue.visible.value}
        isProcessing={queue.isProcessing.value}
        tasks={queue.tasks.value}
        onClose={handleClose}
      >
        {{
          icon: () => (
            <Upload class="size-3.5 text-neutral-600 dark:text-neutral-300" />
          ),
          title: () => (
            <>
              上传图片
              <span class="ml-1.5 text-neutral-400">
                {queue.progress.value.completed}/{queue.progress.value.total}
              </span>
            </>
          ),
          item: ({ task }: { task: UploadTask }) => <TaskItem task={task} />,
          footer: () =>
            !queue.isProcessing.value && queue.tasks.value.length > 0 ? (
              <div class="border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-400 dark:border-neutral-800">
                {queue.successCount.value > 0 && (
                  <span class="text-green-600 dark:text-green-400">
                    {queue.successCount.value} 成功
                  </span>
                )}
                {queue.errorCount.value > 0 && (
                  <span class="ml-2 text-red-600 dark:text-red-400">
                    {queue.errorCount.value} 失败
                  </span>
                )}
              </div>
            ) : null,
        }}
      </TaskQueuePanel>
    )
  },
})
