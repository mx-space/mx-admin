import { CloudIcon, LoaderIcon } from 'lucide-vue-next'
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue'
import type { ComputedRef, PropType } from 'vue'

/**
 * 格式化相对时间
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 5) {
    return '刚刚'
  }
  if (seconds < 60) {
    return `${seconds} 秒前`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }

  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

/**
 * 草稿保存状态指示器
 * 显示"已保存草稿"以及动态更新的相对时间
 */
export const DraftSaveIndicator = defineComponent({
  name: 'DraftSaveIndicator',
  props: {
    isSaving: {
      type: Object as PropType<ComputedRef<boolean>>,
      required: true,
    },
    lastSavedTime: {
      type: Object as PropType<ComputedRef<Date | null>>,
      required: true,
    },
  },
  setup(props) {
    const relativeTimeText = ref('')
    let intervalId: ReturnType<typeof setInterval> | null = null

    // 更新相对时间文本
    const updateRelativeTime = () => {
      const time = props.lastSavedTime.value
      if (time) {
        relativeTimeText.value = formatRelativeTime(time)
      }
    }

    // 监听 lastSavedTime 变化，立即更新并启动定时器
    watch(
      () => props.lastSavedTime.value,
      (newTime) => {
        if (newTime) {
          updateRelativeTime()

          // 清除之前的定时器
          if (intervalId) {
            clearInterval(intervalId)
          }

          // 每秒更新一次相对时间（前60秒），之后每分钟更新
          intervalId = setInterval(() => {
            updateRelativeTime()
          }, 1000)
        }
      },
      { immediate: true },
    )

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    })

    const showIndicator = computed(() => {
      return props.isSaving.value || props.lastSavedTime.value
    })

    return () => {
      if (!showIndicator.value) {
        return null
      }

      const isSaving = props.isSaving.value

      return (
        <div class="flex items-center gap-1.5 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
          {isSaving ? (
            <>
              <LoaderIcon size={14} class="animate-spin" />
              <span>保存中...</span>
            </>
          ) : (
            <>
              <CloudIcon size={14} class="text-green-500" />
              <span>已保存草稿</span>
              {relativeTimeText.value && (
                <span class="text-neutral-400 dark:text-neutral-500">
                  · {relativeTimeText.value}
                </span>
              )}
            </>
          )}
        </div>
      )
    }
  },
})
