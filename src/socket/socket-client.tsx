/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GATEWAY_URL } from 'constants/env'
import { NButton, NSpace } from 'naive-ui'
import { router } from 'router'
import io from 'socket.io-client'
import { getToken } from 'utils/auth'
import { bus } from 'utils/event-bus'
import { BrowserNotification } from 'utils/notification'

import { configs } from '../configs'
import type { NotificationTypes } from './types';
import { EventTypes } from './types'

const Notification = {
  get warning() {
    return window.notification.warning
  },
  get warn() {
    return window.notification.warning
  },
  get success() {
    return window.notification.success
  },
  get error() {
    return window.notification.error
  },
  get info() {
    return window.notification.info
  },
}
export class SocketClient {
  private _socket!: ReturnType<typeof io>

  get socket() {
    return this._socket
  }

  #title = configs.title
  #notice = new BrowserNotification()

  private isInit = false
  initIO() {
    if (this.isInit) {
      return
    }
    this.destory()
    const token = getToken()
    if (!token) {
      return
    }
    this._socket = io(`${GATEWAY_URL}/admin`, {
      timeout: 10000,
      transports: ['websocket'],
      forceNew: true,
      query: {
        token: token.replace(/^bearer\s/, ''),
      },
    })

    this.socket.on(
      'message',
      (payload: string | Record<'type' | 'data' | 'code', any>) => {
        if (typeof payload !== 'string') {
          return this.handleEvent(payload.type, payload.data, payload.code)
        }
        const { data, type, code } = JSON.parse(payload) as {
          data: any
          type: EventTypes
          code?: number
        }
        this.handleEvent(type, data, code)
      },
    )
    this.socket.on('connect_error', () => {
      if (__DEV__) {
        window.message.error('Socket 连接异常')
      }
    })

    this.socket.io.on('error', () => {
      if (__DEV__) {
        window.message.error('Socket 连接异常')
      }
    })
    this.socket.io.on('reconnect', () => {
      if (__DEV__) {
        window.message.info('Socket 重连成功')
      }
    })
    this.socket.io.on('reconnect_attempt', () => {
      if (__DEV__) {
        window.message.info('Socket 重连中')
      }
    })
    this.socket.io.on('reconnect_failed', () => {
      if (__DEV__) {
        window.message.info('Socket 重连失败')
      }
    })

    this.socket.on('disconnect', () => {
      const tryReconnect = () => {
        if (this.socket.connected === false) {
          this.socket.io.connect()
        } else {
          timer = clearInterval(timer)
        }
      }
      let timer: any = setInterval(tryReconnect, 2000)
    })

    this.isInit = true
  }

  handleEvent(type: EventTypes, payload: any, code?: number) {
    switch (type) {
      case EventTypes.GATEWAY_CONNECT: {
        break
      }
      case EventTypes.GATEWAY_DISCONNECT: {
        Notification.warning(payload)
        break
      }
      case EventTypes.AUTH_FAILED: {
        console.log('等待登陆中...')
        this.socket.close()
        break
      }
      case EventTypes.COMMENT_CREATE: {
        const body = `${payload.author}: ${payload.text}`
        const handler = () => {
          router.push({ name: 'comment' })
          notice.destroy()
        }
        const notice = Notification.success({
          title: '新的评论',
          content: body,
          action() {
            return (
              <NSpace justify="end">
                <NButton onClick={handler} type="primary" round ghost>
                  查看
                </NButton>
              </NSpace>
            )
          },
        })

        this.#notice.notice(`${this.#title} 收到新的评论`, body).then((no) => {
          if (!no) {
            return
          }
          no.onclick = () => {
            if (document.hasFocus()) {
              handler()
            } else {
              window.open(router.resolve({ name: 'comment' }).href)
            }
          }
        })
        break
      }
      case EventTypes.ADMIN_NOTIFICATION: {
        const { type, message } = payload as {
          type: NotificationTypes
          message: string
        }

        Notification[type]({ content: message })
        break
      }
      case EventTypes.CONTENT_REFRESH: {
        Notification.warning({ content: '数据库有变动, 将在 1 秒后重载页面' })
        setTimeout(() => {
          location.reload()
        }, 1000)
        break
      }
      case EventTypes.LINK_APPLY: {
        const sitename = payload.name

        const handler = () => {
          router.push({ name: 'friends' })
          notice.destroy()
        }
        const notice = Notification.success({
          title: '新的友链申请',
          content: sitename,
          action() {
            return (
              <NSpace justify="end">
                <NButton onClick={handler} type="primary" round ghost>
                  查看
                </NButton>
              </NSpace>
            )
          },
        })
        this.#notice
          .notice(`${this.#title} 收到新的友链申请`, sitename)
          .then((n) => {
            if (!n) {
              return
            }

            n.onclick = () => {
              if (document.hasFocus()) {
                handler()
              } else {
                // TODO
                window.open('/')
              }
            }
          })
        break
      }
      default: {
        if (__DEV__) {
          console.log(type, payload, code)
        }
      }
    }

    bus.emit(type, payload, code)
  }

  destory() {
    if (!this.socket) {
      return
    }
    this.socket.disconnect()
    this.socket.off('message')
    this.socket.offAny()

    this._socket = null!

    this.isInit = false
  }
}
