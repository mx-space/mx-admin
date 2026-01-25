import { AlertCircle, CheckCircle2, Loader2, Upload, X } from 'lucide-vue-next'
import { NCard } from 'naive-ui'
import { defineComponent, Transition, TransitionGroup } from 'vue'
import type { UploadTask } from './types'

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

    return () => (
      <div class="flex items-center gap-2 py-1">
        {getStatusIcon()}
        <span
          class={[
            'flex-1 truncate text-sm',
            props.task.status === 'error'
              ? 'text-red-500'
              : 'text-neutral-600 dark:text-neutral-300',
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
      <Transition
        enterActiveClass="transition-all duration-300 ease-out"
        enterFromClass="opacity-0 translate-y-4"
        enterToClass="opacity-100 translate-y-0"
        leaveActiveClass="transition-all duration-200 ease-in"
        leaveFromClass="opacity-100 translate-y-0"
        leaveToClass="opacity-0 translate-y-4"
      >
        {queue.visible.value && queue.tasks.value.length > 0 && (
          <div class="fixed bottom-4 right-4 z-50 w-80">
            <NCard
              size="small"
              class="shadow-lg"
              contentClass="!p-3"
              headerClass="!py-2 !px-3"
            >
              {{
                header: () => (
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Upload class="size-4" />
                      <span class="text-sm font-medium">
                        上传图片 {queue.progress.value.completed}/
                        {queue.progress.value.total}
                      </span>
                    </div>
                    {!queue.isProcessing.value && (
                      <button
                        class="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                        onClick={handleClose}
                      >
                        <X class="size-4" />
                      </button>
                    )}
                  </div>
                ),
                default: () => (
                  <div class="max-h-48 space-y-1 overflow-y-auto">
                    <TransitionGroup
                      moveClass="transition-all duration-200"
                      enterActiveClass="transition-all duration-200"
                      enterFromClass="opacity-0 -translate-x-2"
                      enterToClass="opacity-100 translate-x-0"
                    >
                      {queue.tasks.value.map((task) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </TransitionGroup>
                    {!queue.isProcessing.value &&
                      queue.tasks.value.length > 0 && (
                        <div class="mt-2 border-t border-neutral-100 pt-2 text-xs text-neutral-400 dark:border-neutral-700">
                          {queue.successCount.value > 0 && (
                            <span class="text-green-500">
                              {queue.successCount.value} 成功
                            </span>
                          )}
                          {queue.errorCount.value > 0 && (
                            <span class="ml-2 text-red-500">
                              {queue.errorCount.value} 失败
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                ),
              }}
            </NCard>
          </div>
        )}
      </Transition>
    )
  },
})
