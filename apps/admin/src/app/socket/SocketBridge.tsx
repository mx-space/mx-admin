import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { io } from 'socket.io-client'
import { toast } from 'sonner'
import type { NavigateFunction } from 'react-router'
import type { Socket } from 'socket.io-client'
import type { NotificationTypes } from './types'

import { GATEWAY_URL } from '../constants/env'
import { EventTypes } from './types'

interface GatewayMessage {
  code?: number
  data?: unknown
  type: EventTypes
}

export function SocketBridge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!GATEWAY_URL) return

    let disposed = false
    let reconnectTimer: null | number = null
    const socket = io(`${GATEWAY_URL}/admin`, {
      forceNew: true,
      timeout: 10000,
      transports: ['websocket'],
      withCredentials: true,
    })

    const handleEvent = (type: EventTypes, payload: unknown, code?: number) => {
      window.dispatchEvent(
        new CustomEvent('mx-admin:socket-event', {
          detail: { code, payload, type },
        }),
      )

      switch (type) {
        case EventTypes.AUTH_FAILED: {
          socket.close()
          break
        }
        case EventTypes.GATEWAY_DISCONNECT: {
          toast.warning(readPayloadMessage(payload, 'Gateway disconnected'))
          break
        }
        case EventTypes.COMMENT_CREATE: {
          void queryClient.invalidateQueries({ queryKey: ['comments'] })
          void queryClient.invalidateQueries({ queryKey: ['aggregate'] })
          notifyNewComment(payload, navigate)
          break
        }
        case EventTypes.LINK_APPLY: {
          void queryClient.invalidateQueries({ queryKey: ['links'] })
          notifyLinkApply(payload, navigate)
          break
        }
        case EventTypes.ADMIN_NOTIFICATION: {
          notifyAdmin(payload)
          break
        }
        case EventTypes.CONTENT_REFRESH: {
          toast.warning('数据库有变动，将在 1 秒后重载页面')
          window.setTimeout(() => {
            window.location.reload()
          }, 1000)
          break
        }
        case EventTypes.POST_CREATE:
        case EventTypes.POST_UPDATE:
        case EventTypes.POST_DELETE: {
          void queryClient.invalidateQueries({ queryKey: ['posts'] })
          void queryClient.invalidateQueries({ queryKey: ['aggregate'] })
          break
        }
        case EventTypes.NOTE_CREATE:
        case EventTypes.NOTE_UPDATE:
        case EventTypes.NOTE_DELETE: {
          void queryClient.invalidateQueries({ queryKey: ['notes'] })
          void queryClient.invalidateQueries({ queryKey: ['aggregate'] })
          break
        }
        case EventTypes.PAGE_UPDATED: {
          void queryClient.invalidateQueries({ queryKey: ['pages'] })
          void queryClient.invalidateQueries({ queryKey: ['aggregate'] })
          break
        }
        case EventTypes.SAY_CREATE:
        case EventTypes.SAY_UPDATE:
        case EventTypes.SAY_DELETE: {
          void queryClient.invalidateQueries({ queryKey: ['says'] })
          void queryClient.invalidateQueries({ queryKey: ['aggregate'] })
          break
        }
        case EventTypes.IMAGE_FETCH:
        case EventTypes.IMAGE_REFRESH: {
          void queryClient.invalidateQueries({ queryKey: ['files'] })
          break
        }
        default: {
          if (import.meta.env.DEV) {
            console.debug('[socket]', type, payload, code)
          }
        }
      }
    }

    socket.on('message', (message: string | GatewayMessage) => {
      const parsed = parseGatewayMessage(message)
      if (!parsed) return

      handleEvent(parsed.type, parsed.data, parsed.code)
    })

    socket.on('connect_error', () => {
      if (import.meta.env.DEV) toast.error('Socket 连接异常')
    })
    socket.io.on('error', () => {
      if (import.meta.env.DEV) toast.error('Socket 连接异常')
    })
    socket.io.on('reconnect', () => {
      if (import.meta.env.DEV) toast.info('Socket 重连成功')
    })
    socket.io.on('reconnect_attempt', () => {
      if (import.meta.env.DEV) toast.info('Socket 重连中')
    })
    socket.io.on('reconnect_failed', () => {
      if (import.meta.env.DEV) toast.info('Socket 重连失败')
    })
    socket.on('disconnect', () => {
      if (disposed || reconnectTimer) return
      reconnectTimer = reconnectUntilConnected(socket, () => disposed)
    })

    return () => {
      disposed = true
      if (reconnectTimer) window.clearInterval(reconnectTimer)
      socket.disconnect()
      socket.off('message')
      socket.offAny()
    }
  }, [navigate, queryClient])

  return null
}

function parseGatewayMessage(message: string | GatewayMessage) {
  if (typeof message !== 'string') return message

  try {
    return JSON.parse(message) as GatewayMessage
  } catch {
    return null
  }
}

function reconnectUntilConnected(socket: Socket, isDisposed: () => boolean) {
  const timer = window.setInterval(() => {
    if (isDisposed() || socket.connected) {
      window.clearInterval(timer)
      return
    }

    socket.io.connect()
  }, 2000)

  return timer
}

function notifyNewComment(payload: unknown, navigate: NavigateFunction) {
  const comment = asRecord(payload)
  const author = readString(comment.author) || '匿名'
  const text = readString(comment.text)
  const body = text ? `${author}: ${text}` : author
  const toastId = toast.success('新的评论', {
    action: {
      label: '查看',
      onClick: () => {
        navigate('/comments?state=0')
        toast.dismiss(toastId)
      },
    },
    description: body,
    duration: 10000,
  })

  void showBrowserNotification('Mx Space Admin 收到新的评论', body, () => {
    if (document.hasFocus()) {
      navigate('/comments?state=0')
    } else {
      window.open(
        `${window.location.origin}${window.location.pathname}#/comments?state=0`,
      )
    }
  })
}

function notifyLinkApply(payload: unknown, navigate: NavigateFunction) {
  const sitename = readString(asRecord(payload).name) || '新的友链申请'
  const toastId = toast.success('新的友链申请', {
    action: {
      label: '查看',
      onClick: () => {
        navigate('/friends?state=1')
        toast.dismiss(toastId)
      },
    },
    description: sitename,
    duration: 10000,
  })

  void showBrowserNotification(
    'Mx Space Admin 收到新的友链申请',
    sitename,
    () => {
      if (document.hasFocus()) {
        navigate('/friends?state=1')
      } else {
        window.open(
          `${window.location.origin}${window.location.pathname}#/friends?state=1`,
        )
      }
    },
  )
}

function notifyAdmin(payload: unknown) {
  const notification = asRecord(payload)
  const type = readString(notification.type) as NotificationTypes | ''
  const message = readString(notification.message)

  if (!message) return

  notifyByType(type, message)
}

function notifyByType(type: NotificationTypes | '', message: string) {
  switch (type) {
    case 'error':
      toast.error(message)
      break
    case 'success':
      toast.success(message)
      break
    case 'warn':
      toast.warning(message)
      break
    case 'info':
    default:
      toast.info(message)
  }
}

async function showBrowserNotification(
  title: string,
  body: string,
  onClick: () => void,
) {
  if (!('Notification' in window) || document.hasFocus()) return

  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission

  if (permission !== 'granted') return

  const notification = new Notification(title, { body })
  notification.addEventListener('click', onClick)
}

function readPayloadMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string') return payload
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}
