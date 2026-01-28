import { ofetch } from 'ofetch'
import type { FetchOptions } from 'ofetch'

import { simpleCamelcaseKeys } from '@mx-space/api-client'

import { API_URL } from '~/constants/env'

import { router } from '../router/router'
import { getToken } from './auth'
import { uuid } from './index'

export class SystemError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message)
    this.name = 'SystemError'
  }
}

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

export const $api = ofetch.create({
  baseURL: API_URL,
  timeout: 60_000,
  credentials: 'include',

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

  onResponseError({ response }) {
    const Message = window.message

    if (!response) {
      Message.error('网络错误')
      throw new SystemError('网络错误')
    }

    const status = response.status

    if (status === 401) {
      router.push(
        `/login?from=${encodeURIComponent(router.currentRoute.value.fullPath)}`,
      )
      throw new SystemError('未授权，请重新登录', 401)
    }

    if (status >= 500) {
      Message.error('服务器错误，请稍后重试')
      throw new SystemError('服务器错误', status)
    }

    const data = response._data
    const message = data?.message || '请求失败'
    throw new BusinessError(message, status, data)
  },
})

export type RequestOptions<T = unknown> = Omit<FetchOptions<'json'>, 'body'> & {
  data?: T
  /** 跳过响应转换（camelCase 转换和数组解包） */
  bypassTransform?: boolean
}

/**
 * 转换响应数据
 * 1. camelCase 转换
 * 2. 解包后端包装的数组响应 { data: [...] } -> [...]
 */
function transformResponse<T>(data: unknown, bypass?: boolean): T {
  if (bypass || !data || typeof data !== 'object') {
    return data as T
  }

  let result = simpleCamelcaseKeys(data as Record<string, unknown>)

  if (
    result &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    'data' in result &&
    Array.isArray(result.data) &&
    Object.keys(result).length === 1
  ) {
    result = result.data
  }

  return result as T
}

export const request = {
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const { bypassTransform, ...rest } = options || {}
    const result = await $api<unknown>(url, { method: 'GET', ...rest })
    return transformResponse<T>(result, bypassTransform)
  },

  async post<T, D = unknown>(
    url: string,
    options?: RequestOptions<D>,
  ): Promise<T> {
    const { data, bypassTransform, ...rest } = options || {}
    const result = await $api<unknown>(url, {
      method: 'POST',
      body: data as BodyInit,
      ...rest,
    })
    return transformResponse<T>(result, bypassTransform)
  },

  async put<T, D = unknown>(
    url: string,
    options?: RequestOptions<D>,
  ): Promise<T> {
    const { data, bypassTransform, ...rest } = options || {}
    const result = await $api<unknown>(url, {
      method: 'PUT',
      body: data as BodyInit,
      ...rest,
    })
    return transformResponse<T>(result, bypassTransform)
  },

  async patch<T, D = unknown>(
    url: string,
    options?: RequestOptions<D>,
  ): Promise<T> {
    const { data, bypassTransform, ...rest } = options || {}
    const result = await $api<unknown>(url, {
      method: 'PATCH',
      body: data as BodyInit,
      ...rest,
    })
    return transformResponse<T>(result, bypassTransform)
  },

  async delete<T, D = unknown>(
    url: string,
    options?: RequestOptions<D>,
  ): Promise<T> {
    const { data, bypassTransform, ...rest } = options || {}
    const result = await $api<unknown>(url, {
      method: 'DELETE',
      body: data as BodyInit,
      ...rest,
    })
    return transformResponse<T>(result, bypassTransform)
  },
}

// Alias for compatibility
export const apiClient = request
