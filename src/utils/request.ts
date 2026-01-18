import { ofetch, type FetchOptions } from 'ofetch'

import { simpleCamelcaseKeys } from '@mx-space/api-client'

import { API_URL } from '~/constants/env'

import { router } from '../router/router'
import { getToken } from './auth'
import { uuid } from './index'

// 系统错误类型（ofetch 层处理）
export class SystemError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = 'SystemError'
  }
}

// 业务错误类型（上层处理）
export class BusinessError extends Error {
  constructor(
    message: string | string[],
    public statusCode: number,
    public data?: unknown,
  ) {
    super(Array.isArray(message) ? message.join(', ') : message)
    this.name = 'BusinessError'
  }
}

const _uuid = uuid()

// 基础 ofetch 实例
export const $api = ofetch.create({
  baseURL: API_URL,
  timeout: 10000,
  credentials: 'include',

  // 请求拦截
  onRequest({ options }) {
    const token = getToken()
    const headers = new Headers(options.headers)

    if (token) {
      headers.set('Authorization', token)
    }
    headers.set('x-uuid', _uuid)

    // GET 请求添加时间戳防缓存
    if (options.method?.toUpperCase() === 'GET') {
      options.query = {
        ...options.query,
        t: Date.now(),
      }
    }

    options.headers = headers
  },

  // 响应拦截：camelCase 转换
  onResponse({ response }) {
    if (response._data && typeof response._data === 'object') {
      response._data = simpleCamelcaseKeys(response._data)
    }
  },

  // 错误处理：仅处理系统错误
  onResponseError({ response }) {
    const Message = window.message

    // 网络错误
    if (!response) {
      Message.error('网络错误')
      throw new SystemError('网络错误')
    }

    const status = response.status

    // 401 未授权 - 系统级错误
    if (status === 401) {
      router.push(
        `/login?from=${encodeURIComponent(router.currentRoute.value.fullPath)}`,
      )
      throw new SystemError('未授权，请重新登录', 401)
    }

    // 5xx 服务器错误 - 系统级错误
    if (status >= 500) {
      Message.error('服务器错误，请稍后重试')
      throw new SystemError('服务器错误', status)
    }

    // 4xx 业务错误 - 不处理，抛给上层
    const data = response._data
    const message = data?.message || '请求失败'
    throw new BusinessError(message, status, data)
  },
})

// 类型安全的请求方法
export type RequestOptions<T = unknown> = Omit<FetchOptions<'json'>, 'body'> & {
  data?: T
  transform?: boolean
}

export const request = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return $api<T>(url, { method: 'GET', ...options })
  },

  post<T, D = unknown>(url: string, options?: RequestOptions<D>): Promise<T> {
    const { data, ...rest } = options || {}
    return $api<T>(url, { method: 'POST', body: data as BodyInit, ...rest })
  },

  put<T, D = unknown>(url: string, options?: RequestOptions<D>): Promise<T> {
    const { data, ...rest } = options || {}
    return $api<T>(url, { method: 'PUT', body: data as BodyInit, ...rest })
  },

  patch<T, D = unknown>(url: string, options?: RequestOptions<D>): Promise<T> {
    const { data, ...rest } = options || {}
    return $api<T>(url, { method: 'PATCH', body: data as BodyInit, ...rest })
  },

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return $api<T>(url, { method: 'DELETE', ...options })
  },
}

// Alias for compatibility
export const apiClient = request
