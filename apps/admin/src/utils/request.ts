import { ofetch } from 'ofetch'
import { toast } from 'vue-sonner'
import type { FetchOptions } from 'ofetch'

import { API_URL } from '~/constants/env'

import { router } from '../router/router'
import { simpleCamelcaseKeys } from './camelcase-keys'
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
    public code?: string | number,
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
    const headers = new Headers(options.headers)
    headers.set('x-uuid', _uuid)
    headers.set('x-skip-translation', '1')

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
    if (!response) {
      toast.error('网络错误')
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
      toast.error('服务器错误，请稍后重试')
      throw new SystemError('服务器错误', status)
    }

    const data = response._data
    const message = data?.error?.message || data?.message || '请求失败'
    const code = data?.error?.code
    const displayMsg = Array.isArray(message) ? message.join(', ') : message
    toast.error(displayMsg)
    throw new BusinessError(message, status, data, code)
  },
})

export type RequestOptions<T = unknown> = Omit<FetchOptions<'json'>, 'body'> & {
  data?: T
  /** 跳过响应转换（camelCase 转换和数组解包） */
  bypassTransform?: boolean
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isResponseEnvelope(value: unknown): value is Record<string, unknown> {
  return (
    isPlainObject(value) &&
    'data' in value &&
    Object.keys(value).every((key) => key === 'data' || key === 'meta')
  )
}

function transformResponse<T>(data: unknown, bypass?: boolean): T {
  if (bypass || !data || typeof data !== 'object') {
    return data as T
  }

  const result = simpleCamelcaseKeys(data as Record<string, unknown>)

  if (isResponseEnvelope(result)) {
    const meta = (result as any).meta
    if (meta && isPlainObject(meta.pagination)) {
      return { data: (result as any).data, pagination: meta.pagination } as T
    }
    return (result as any).data as T
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
