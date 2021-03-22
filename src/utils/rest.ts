/*
 * @Author: Innei
 * @Date: 2020-08-16 19:50:57
 * @LastEditTime: 2021-03-22 11:33:40
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/utils/rest.ts
 * @Coding with Love
 */

import { extend } from 'umi-request'
import type { RequestMethod, RequestOptionsWithResponse } from 'umi-request'
import { getToken } from './auth'

import { useToast } from 'vue-toastification'
import { router } from '../router'

import { __DEV__ } from '.'

const Message = useToast()

class RESTManagerStatic {
  #instance: RequestMethod = null!
  get instance() {
    return this.#instance
  }
  constructor() {
    this.#instance = extend({
      // @ts-ignore
      prefix: import.meta.env.VITE_APP_BASE_API,
      timeout: 10000,
      errorHandler: (error) => {
        if (error.request && !error.response) {
        }

        if (error.response) {
          if (process.env.NODE_ENV === 'development') {
            console.log(error.response)
          }
          try {
            Message.error('')
          } catch {
            Message.error('出错了, 请查看控制台')
          }

          if (error?.response?.status === 401) {
            router.push('/login')
          }
          return Promise.reject(error)
        }
      },
    })
  }
  request(method: Method, route: string, options: RequestOptionsWithResponse) {
    return this.#instance[method](route, options)
  }

  get api() {
    return buildRoute(this)
  }
}

const noop = () => {}
const methods = ['get', 'post', 'delete', 'patch', 'put']
const reflectors = [
  'toString',
  'valueOf',
  'inspect',
  'constructor',
  Symbol.toPrimitive,
  Symbol.for('util.inspect.custom'),
]

function buildRoute(manager: RESTManagerStatic): IRequestHandler {
  const route = ['']
  const handler: any = {
    get(target: any, name: Method) {
      if (reflectors.includes(name)) return () => route.join('/')
      if (methods.includes(name)) {
        return async (options: RequestOptionsWithResponse) =>
          await manager.request(name, route.join('/'), {
            ...options,
          })
      }
      route.push(name)
      return new Proxy(noop, handler)
    },
    // @ts-ignore
    apply(target: any, _, args) {
      route.push(...args.filter((x: string) => x != null)) // eslint-disable-line eqeqeq
      return new Proxy(noop, handler)
    },
  }
  // @ts-ignore
  return new Proxy(noop, handler)
}

export const RESTManager = new RESTManagerStatic()

if (__DEV__) {
  Object.defineProperty(window, 'api', {
    get() {
      return RESTManager.api
    },
  })
}

export const useRest = () => {
  return RESTManager.api
}

RESTManager.instance.interceptors.request.use((url, options) => {
  const token = getToken()

  if (token) {
    // @ts-ignore
    options.headers.Authorization = 'bearer ' + token
  }
  return {
    url: url + '?timestamp=' + new Date().getTime(),
    options: {
      ...options,
      // ...(token
      //   ? {
      //       headers: {
      //         Authorization: token,
      //       },
      //     }
      //   : {}),
      interceptors: true,
    },
  }
}, {})

interface IRequestHandler<T = RequestOptionsWithResponse> {
  (id?: string): IRequestHandler
  // @ts-ignore
  get<P = unknown>(options?: T): Promise<P>
  // @ts-ignore
  post<P = unknown>(options?: T): Promise<P>
  // @ts-ignore
  patch<P = unknown>(options?: T): Promise<P>
  // @ts-ignore
  delete<P = unknown>(options?: T): Promise<P>
  // @ts-ignore
  put<P = unknown>(options?: T): Promise<P>
  [key: string]: IRequestHandler
}
export type Method = 'get' | 'delete' | 'post' | 'put' | 'patch'
