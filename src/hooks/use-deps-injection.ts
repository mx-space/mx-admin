import { camelCase } from 'lodash-es'
import { provide, inject } from 'vue'
//定义一个用于状态共享的hook函数的标准接口
export interface FunctionalStore<T extends object> {
  (...args: any[]): T
  token?: symbol
  root?: T
}

//对原生provide进行封装

//由于inject函数只会从父组件开始查找，所以useProvider默认返回hook函数的调用结果，以防同组件层级需要使用
export function useProvider<T extends object>(func: FunctionalStore<T>): T {
  !func.token && (func.token = Symbol('functional store'))
  const depends = func()
  provide(func.token, depends)
  return depends
}

// 可以一次传入多个hook函数， 统一管理
export function useProviders(...funcs: FunctionalStore<any>[]) {
  const stores = {} as any
  funcs.forEach((func) => {
    const deps = useProvider(func)
    stores[camelCase(func.name)] = deps
  })
  return stores
}

//对原生inject进行封装

type InjectType = 'root' | 'optional'

//接收第二个参数，'root'表示直接全局使用；optional表示可选注入，防止父组件的provide并未传入相关hook
export function useInjector<T extends object>(
  func: FunctionalStore<T>,
  type: 'optional',
): T | null
export function useInjector<T extends object>(
  func: FunctionalStore<T>,
  type: 'root',
): T
export function useInjector<T extends object>(func: FunctionalStore<T>): T
export function useInjector<T extends object>(
  func: FunctionalStore<T>,
  type?: InjectType,
) {
  const token = func.token as any
  const root = func.root

  switch (type) {
    case 'optional':
      return inject<T>(token) || func.root || null
    case 'root':
      if (!func.root) func.root = func()
      return func.root
    default:
      if (inject(token)) {
        return inject<T>(token)
      }
      if (root) return func.root
      if (__DEV__) {
        // vite reload bug
        console.debug(
          `状态钩子函数${func.name}未在上层组件通过调用useProvider提供`,
        )
        setTimeout(() => {
          location.reload()
        }, 50)
      } else {
        throw new Error(
          `状态钩子函数${func.name}未在上层组件通过调用useProvider提供`,
        )
      }
  }
}
