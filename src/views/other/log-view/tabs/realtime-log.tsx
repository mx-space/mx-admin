import { Xterm } from 'components/xterm'
import { useMountAndUnmount } from 'hooks/use-react'
import { socket } from 'socket'
import { EventTypes } from 'socket/types'
import { bus } from 'utils/event-bus'
import type { Terminal } from 'xterm'

export const RealtimeLogPipeline = defineComponent({
  setup() {
    const listen = (prevLog = true) => {
      socket.socket.emit('log', { prevLog })
    }

    let term: Terminal
    const messageQueue: string[] = []
    const logHandler = (e) => {
      if (!term) {
        messageQueue.push(e)
      } else {
        if (messageQueue.length > 0) {
          emptyQueue(term)
        }
        term.write(e)
      }
    }

    const emptyQueue = (term: Terminal) => {
      while (messageQueue.length) {
        const message = messageQueue.shift()

        term.write(message!)
      }
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

    onUnmounted(() => {
      socket.socket.emit('unlog')

      bus.off(EventTypes.STDOUT, logHandler)
    })

    return () => (
      <Xterm
        darkMode
        onReady={(_term) => {
          term = _term

          emptyQueue(term)
        }}
      />
    )
  },
})
