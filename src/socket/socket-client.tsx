/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NButton, NSpace } from 'naive-ui'
import { router } from 'router'
import io from 'socket.io-client'
import { getToken } from 'utils/auth'
import { bus } from 'utils/event-bus'
import { BrowserNotification } from 'utils/notification'
import { configs } from '../configs'
import { EventTypes, NotificationTypes } from './types'

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
  public socket!: ReturnType<typeof io>

  #title = configs.title
  #notice = new BrowserNotification()
  constructor() {
    this.initIO()
  }

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
    this.socket = io(
      window.injectData.GATEWAY ||
        (import.meta.env.VITE_APP_GATEWAY || 'http://localhost:2333') +
          '/admin',
      {
        timeout: 10000,
        reconnectionDelay: 3000,
        autoConnect: false,
        reconnectionAttempts: 3,
        transports: ['websocket'],
        query: {
          token,
        },
      },
    )

    this.socket.open()
    this.socket.on(
      'message',
      (payload: string | Record<'type' | 'data', any>) => {
        if (typeof payload !== 'string') {
          return this.handleEvent(payload.type, payload.data)
        }
        const { data, type } = JSON.parse(payload) as {
          data: any
          type: EventTypes
        }
        this.handleEvent(type, data)
      },
    )

    this.isInit = true
  }

  handleEvent(type: EventTypes, payload: any) {
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
        const body = payload.author + ': ' + payload.text
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

        this.#notice.notice(this.#title + ' 收到新的评论', body).then((no) => {
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
          .notice(this.#title + ' 收到新的友链申请', sitename)
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
        console.log(type, payload)
      }
    }

    bus.emit(type, payload)
  }

  destory() {
    if (!this.socket) {
      return
    }
    this.socket.disconnect()
    this.socket.off('message')

    this.isInit = false
  }
}
