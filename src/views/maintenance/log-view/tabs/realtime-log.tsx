import { Pause, Play, RotateCcw, Trash2 } from 'lucide-vue-next'
import type { Terminal } from '@xterm/xterm'

import { HeaderActionButton } from '~/components/button/rounded-button'
import { Xterm } from '~/components/xterm'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { socket } from '~/socket'
import { EventTypes } from '~/socket/types'
import { bus } from '~/utils/event-bus'

export const RealtimeLogPipeline = defineComponent({
  setup() {
    const isPaused = ref(false)
    const hasContent = ref(false)
    let term: Terminal | null = null
    const messageQueue: string[] = []
    const pausedMessages: string[] = []

    const listen = (prevLog = true) => {
      socket.socket.emit('log', { prevLog })
    }

    const logHandler = (e: string) => {
      hasContent.value = true

      if (isPaused.value) {
        pausedMessages.push(e)
        return
      }

      if (!term) {
        messageQueue.push(e)
      } else {
        if (messageQueue.length > 0) {
          emptyQueue(term)
        }
        term.write(e)
      }
    }

    const emptyQueue = (terminal: Terminal) => {
      while (messageQueue.length) {
        const message = messageQueue.shift()
        terminal.write(message!)
      }
    }

    const handleClear = () => {
      term?.clear()
      hasContent.value = false
    }

    const handleTogglePause = () => {
      isPaused.value = !isPaused.value

      // Resume: flush paused messages
      if (!isPaused.value && term && pausedMessages.length > 0) {
        while (pausedMessages.length) {
          const message = pausedMessages.shift()
          term.write(message!)
        }
      }
    }

    const handleReconnect = () => {
      listen(true)
    }

    tryOnMounted(() => {
      listen()
      bus.on(EventTypes.STDOUT, logHandler)
    })

    useMountAndUnmount(() => {
      const handler = () => {
        listen(false)
      }
      socket.socket.io.on('open', handler)

      return () => {
        socket.socket.io.off('open', handler)
      }
    })

    onBeforeUnmount(() => {
      socket.socket.emit('unlog')
      bus.off(EventTypes.STDOUT, logHandler)
    })

    return () => (
      <div class="flex h-full flex-col">
        {/* Toolbar */}
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class={[
                'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                isPaused.value
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
              ]}
            >
              <span
                class={[
                  'size-2 rounded-full',
                  isPaused.value
                    ? 'bg-amber-500'
                    : 'animate-pulse bg-green-500',
                ]}
              />
              {isPaused.value ? '已暂停' : '实时接收中'}
              {isPaused.value && pausedMessages.length > 0 && (
                <span class="ml-1 tabular-nums">
                  ({pausedMessages.length} 条待处理)
                </span>
              )}
            </div>
          </div>

          <div class="flex items-center gap-1">
            <HeaderActionButton
              icon={isPaused.value ? <Play /> : <Pause />}
              name={isPaused.value ? '恢复' : '暂停'}
              onClick={handleTogglePause}
            />
            <HeaderActionButton
              icon={<Trash2 />}
              name="清空"
              onClick={handleClear}
              disabled={!hasContent.value}
            />
            <HeaderActionButton
              icon={<RotateCcw />}
              name="重新连接"
              onClick={handleReconnect}
            />
          </div>
        </div>

        {/* Terminal */}
        <div
          class={[
            'flex-1 overflow-hidden rounded-xl border',
            'border-neutral-200 dark:border-neutral-800',
            'bg-neutral-900',
          ]}
        >
          <Xterm
            darkMode
            class="h-full w-full"
            onReady={(_term) => {
              term = _term
              emptyQueue(term)
            }}
          />
        </div>
      </div>
    )
  },
})
