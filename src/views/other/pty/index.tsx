import { HeaderActionButton } from 'components/button/rounded-button'
import { RefreshIcon } from 'components/icons'
import { Xterm } from 'components/xterm'
import { ContentLayout } from 'layouts/content'
import { socket } from 'socket'
import { EventTypes } from 'socket/types'
import { bus } from 'utils/event-bus'
import { IDisposable, Terminal } from 'xterm'

export default defineComponent({
  name: 'pty-view',
  setup() {
    let term: Terminal

    const ready = ref(false)

    let termDisposer: IDisposable

    const writeHandler = (data) => {
      term.write(data)
    }

    const cleaner = watch(
      () => ready.value,
      (isReady) => {
        if (isReady) {
          cleaner()
          socket.socket.emit('pty', { cols: term.cols, rows: term.rows })

          termDisposer = term.onData((data) => {
            socket.socket.emit('pty-input', data)
          })

          bus.on(EventTypes.PTY, writeHandler)
        }
      },
    )

    onUnmounted(() => {
      termDisposer?.dispose()

      socket.socket.emit('pty-exit')
      bus.off(EventTypes.PTY, writeHandler)
    })

    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              icon={<RefreshIcon />}
              name="重新连接"
              onClick={() => {
                if (term) {
                  term.clear()
                }

                socket.socket.emit('pty-exit')

                setTimeout(() => {
                  socket.socket.emit(
                    'pty',
                    term ? { cols: term.cols, rows: term.rows } : undefined,
                  )
                }, 50)
              }}
            ></HeaderActionButton>
          </>
        }
      >
        <Xterm
          darkMode
          terminalOptions={{
            disableStdin: false,
          }}
          onReady={(_term) => {
            ready.value = true
            term = _term
          }}
        />
      </ContentLayout>
    )
  },
})
