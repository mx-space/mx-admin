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
    const xtermHandler = (e) => {
      term?.write(e)
    }

    onMounted(() => {
      listen()

      bus.on(EventTypes.STDOUT, xtermHandler)
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

      bus.off(EventTypes.STDOUT, xtermHandler)
    })

    return () => (
      <Xterm
        onReady={(_term) => {
          term = _term
        }}
      />
    )
  },
})
