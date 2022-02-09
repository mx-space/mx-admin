import { Xterm } from 'components/xterm'
import { useMountAndUnmount } from 'hooks/use-react'
import { socket } from 'socket'
import { EventTypes } from 'socket/types'
import { bus } from 'utils/event-bus'
import { Terminal } from 'xterm'

export const RealtimeLogPipeline = defineComponent({
  setup() {
    const listen = () => {
      socket.socket.emit('log')
    }

    let term: Terminal
    let messageQueue: string[] = []
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

    onMounted(() => {
      listen()

      bus.on(EventTypes.STDOUT, logHandler)
    })

    useMountAndUnmount(() => {
      const handler = () => {
        listen()
      }
      socket.socket.on('reconnect', handler)

      return () => {
        socket.socket.off('reconnect', handler)
      }
    })

    onUnmounted(() => {
      socket.socket.emit('unlog')

      bus.off(EventTypes.STDOUT, logHandler)
    })

    return () => (
      <Xterm
        onReady={(_term) => {
          term = _term

          emptyQueue(term)
        }}
      />
    )
  },
})
