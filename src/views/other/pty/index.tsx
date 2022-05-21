import { HeaderActionButton } from 'components/button/rounded-button'
import { RefreshIcon, StatusIcon } from 'components/icons'
import { IpInfoPopover } from 'components/ip-info'
import { Xterm } from 'components/xterm'
import { GATEWAY_URL } from 'constants/env'
import { useMountAndUnmount } from 'hooks/use-react'
import { ContentLayout } from 'layouts/content'
import { merge } from 'lodash-es'
import {
  NButton,
  NCard,
  NForm,
  NInput,
  NList,
  NListItem,
  useDialog,
  useMessage,
} from 'naive-ui'
import Io from 'socket.io-client'
import { EventTypes } from 'socket/types'
import { RESTManager, getToken, parseDate } from 'utils'
import { bus } from 'utils/event-bus'
import type { PropType } from 'vue'
import type { IDisposable, Terminal } from 'xterm'

export default defineComponent({
  name: 'PtyView',
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

    const socket = Io(`${GATEWAY_URL}/pty`, {
      timeout: 10000,
      transports: ['websocket'],
      forceNew: true,
      query: {
        token: getToken()!.replace(/^bearer\s/, ''),
      },
    })
    socket.on(
      'message',
      ({ code, data, type }: Record<'type' | 'data' | 'code', any>) => {
        bus.emit(type, data, code)
      },
    )

    useMountAndUnmount(() => {
      const handler = () => {
        term.writeln('PTY connection closed')
        message.warning('连接已断开', { closable: true })
      }
      socket.on('disconnect', handler)

      return () => {
        socket.off('disconnect', handler)
      }
    })

    onUnmounted(() => {
      socket.offAny()
      socket.disconnect()
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
                  socket.emit(
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
          socket.emit('pty', { cols: term.cols, rows: term.rows })

          termDisposer = term.onData((data) => {
            socket.emit('pty-input', data)
          })

          bus.on(EventTypes.PTY, writeHandler)
        }
      },
    )

    onUnmounted(() => {
      socket.emit('pty-exit')
      termDisposer?.dispose()

      bus.off(EventTypes.PTY, writeHandler)
    })

    const reconnection = () => {
      if (term) {
        term.reset()
      }

      if (socket.connected === false) {
        socket.io.connect()

        setTimeout(() => {
          if (socket.connected) {
            socket.emit(
              'pty',
              term ? { cols: term.cols, rows: term.rows } : undefined,
            )
          } else {
            message.error('重连 Socket 失败')
          }
        }, 1500)

        return
      }

      socket.emit('pty-exit')

      setTimeout(() => {
        socket.emit(
          'pty',
          term ? { cols: term.cols, rows: term.rows } : undefined,
        )
      }, 50)
    }
    const openConnectionStatus = () => {
      modal.create({
        title: '连接状态',
        content: () => <ConnectionStatus />,
      })
    }
    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              variant="info"
              icon={<StatusIcon />}
              name="连接状态"
              onClick={openConnectionStatus}
            ></HeaderActionButton>
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

const ConnectionStatus = defineComponent(() => {
  const list = ref([] as any[])
  onMounted(async () => {
    const data = await RESTManager.api.pty.record.get<{ data: any }>()
    list.value = data.data
  })
  return () => (
    <NCard bordered={false} class="max-h-[70vh] overflow-auto">
      <NList bordered={false} class="bg-transparent">
        {list.value.map((item) => {
          return (
            <NListItem key={item.startTime}>
              <div>
                开始于 {parseDate(item.startTime, 'yyyy年M月d日 HH:mm:ss')}
              </div>
              <div>
                IP:{' '}
                <IpInfoPopover
                  trigger="hover"
                  ip={item.ip}
                  triggerEl={<NButton text>{item.ip}</NButton>}
                ></IpInfoPopover>
              </div>
              <div>
                {item.endTime
                  ? `结束于 ${parseDate(item.endTime, 'yyyy年M月d日 HH:mm:ss')}`
                  : '没有结束'}
              </div>
              <div>
                {item.endTime &&
                  `时长：${
                    (Math.abs(
                      new Date(item.startTime).getTime() -
                        new Date(item.endTime).getTime(),
                    ) /
                      1000) |
                    0
                  }秒`}
              </div>
            </NListItem>
          )
        })}
      </NList>
    </NCard>
  )
})
