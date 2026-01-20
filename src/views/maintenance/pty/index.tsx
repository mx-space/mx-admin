import { merge } from 'es-toolkit/compat'
import { RefreshCw as RefreshIcon } from 'lucide-vue-next'
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
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { IDisposable, Terminal } from '@xterm/xterm'
import type { PropType } from 'vue'

import { systemApi } from '~/api/system'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { IpInfoPopover } from '~/components/ip-info'
import { Xterm } from '~/components/xterm'
import { GATEWAY_URL } from '~/constants/env'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { useLayout } from '~/layouts/content'
import { EventTypes } from '~/socket/types'
import { getToken, parseDate } from '~/utils'
import { bus } from '~/utils/event-bus'

const StatusIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24">
    <path
      d="M16.5 11L13 7.5l1.4-1.4l2.1 2.1L20.7 4l1.4 1.4l-5.6 5.6M11 7H2v2h9V7m10 6.4L19.6 12L17 14.6L14.4 12L13 13.4l2.6 2.6l-2.6 2.6l1.4 1.4l2.6-2.6l2.6 2.6l1.4-1.4l-2.6-2.6l2.6-2.6M11 15H2v2h9v-2z"
      fill="currentColor"
    />
  </svg>
)

export default defineComponent({
  name: 'PtyView',
  setup() {
    const { setActions } = useLayout()
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

    onBeforeUnmount(() => {
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
                  $modal.destroy()

                  requestAnimationFrame(() => {
                    socket.emit(
                      'pty',
                      merge(
                        term ? { cols: term.cols, rows: term.rows } : undefined,
                        { password: pwd },
                      ),
                    )
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

    onBeforeUnmount(() => {
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
    // 设置 header actions
    setActions(
      <>
        <HeaderActionButton
          variant="info"
          icon={<StatusIcon />}
          name="连接状态"
          onClick={openConnectionStatus}
        />
        <HeaderActionButton
          icon={<RefreshIcon />}
          name="重新连接"
          onClick={reconnection}
        />
      </>,
    )

    return () => (
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

    onMounted(() => {
      requestAnimationFrame(() => {
        inputRef.value.focus()
      })
    })
    // FUCK VUE ALWAYS ANY
    const inputRef = ref()
    return () => (
      <NForm onSubmit={submit} class="mt-6 space-y-6">
        <NInput
          ref={inputRef}
          showPasswordOn="mousedown"
          type="password"
          inputProps={{
            name: 'note-password',
            autocapitalize: 'off',
            autocomplete: 'new-password',
          }}
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
    const data = await systemApi.getPtyRecords()
    list.value = data
  })
  return () => (
    <NCard bordered={false} class="max-h-[70vh] overflow-auto">
      <NList bordered={false} class="bg-transparent">
        {list.value.map((item) => {
          return (
            <NListItem key={item.startTime}>
              <div>
                开始于 {parseDate(item.startTime, 'yyyy 年 M 月 d 日 HH:mm:ss')}
              </div>
              <div>
                IP:{' '}
                <IpInfoPopover
                  trigger="hover"
                  ip={item.ip}
                  triggerEl={<NButton quaternary>{item.ip}</NButton>}
                />
              </div>
              <div>
                {item.endTime
                  ? `结束于 ${parseDate(
                      item.endTime,
                      'yyyy 年 M 月 d 日 HH:mm:ss',
                    )}`
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
