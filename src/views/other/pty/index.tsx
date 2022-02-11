import { HeaderActionButton } from 'components/button/rounded-button'
import { RefreshIcon } from 'components/icons'
import { Xterm } from 'components/xterm'
import { useMountAndUnmount } from 'hooks/use-react'
import { ContentLayout } from 'layouts/content'
import { merge } from 'lodash-es'
import { NButton, NForm, NInput, useDialog, useMessage } from 'naive-ui'
import { socket } from 'socket'
import { EventTypes } from 'socket/types'
import { bus } from 'utils/event-bus'
import { PropType } from 'vue'
import { IDisposable, Terminal } from 'xterm'

export default defineComponent({
  name: 'pty-view',
  setup() {
    let term: Terminal

    const ready = ref(false)

    let termDisposer: IDisposable

    const writeHandler = (data) => {
      term.write(data)

      term.focus()
    }
    const message = useMessage()
    const modal = useDialog()

    useMountAndUnmount(() => {
      const handler = () => {
        message.error('连接已断开', { closable: true })
        term.writeln('PTY connection closed')
      }
      socket.socket.on('disconnect', handler)

      return () => {
        socket.socket.off('disconnect', handler)
      }
    })

    useMountAndUnmount(() => {
      const dispose = bus.on(EventTypes.PTY_MESSAGE, (data, code) => {
        if (code === 10000 || code === 10001) {
          const $modal = modal.create({
            title: '验证密码',
            closable: true,
            content: () => (
              <PasswordConfirmDialog
                onConfirm={(pwd) => {
                  socket.socket.emit(
                    'pty',
                    merge(
                      term ? { cols: term.cols, rows: term.rows } : undefined,
                      { password: pwd },
                    ),
                  )
                  requestAnimationFrame(() => {
                    $modal.destroy()
                  })
                }}
              />
            ),
          })
        }
        message.info(data)
      })

      return () => {
        dispose()
      }
    })

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

    const reconnection = () => {
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
    }
    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              icon={<RefreshIcon />}
              name="重新连接"
              onClick={reconnection}
            ></HeaderActionButton>
          </>
        }
      >
        <Xterm
          class="!max-h-[calc(100vh-10.5rem)]"
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

const PasswordConfirmDialog = defineComponent({
  props: {
    onConfirm: Function as PropType<(password: string) => void>,
  },
  setup(props) {
    const password = ref('')
    const submit = (e: Event) => {
      e.preventDefault()
      props.onConfirm?.(password.value)
    }
    return () => (
      <NForm onSubmit={submit} class="space-y-6 mt-6">
        <NInput
          showPasswordOn="mousedown"
          type="password"
          value={password.value}
          placeholder="请输入密码"
          onUpdateValue={(val) => {
            password.value = val
          }}
        />
        <div class="flex justify-center">
          <NButton round type="primary" onClick={submit}>
            确认
          </NButton>
        </div>
      </NForm>
    )
  },
})
