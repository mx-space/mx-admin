/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/*
 * @Author: Innei
 * @Date: 2020-05-23 14:31:11
 * @LastEditTime: 2021-01-09 12:37:37
 * @LastEditors: Innei
 * @FilePath: /web/utils/observable.ts
 * @MIT
 */
import type { EventTypes } from 'socket/types'

type IDisposable = () => void
export class EventBus {
  private observers: Record<string, Function[]> = {}

  on(event: EventTypes, handler: any): IDisposable
  on(event: string, handler: any): IDisposable
  on(event: string, handler: (...rest: any) => void): IDisposable {
    const queue = this.observers[event]

    const disposer = () => {
      this.off(event, handler)
    }
    if (!queue) {
      this.observers[event] = [handler]
      return disposer
    }
    const isExist = queue.some((func) => {
      return func === handler
    })
    if (!isExist) {
      this.observers[event].push(handler)
    }

    return disposer
  }

  emit(event: string, payload?: any, ...args: any[]): void
  emit(event: EventTypes, payload?: any, ...args: any[]): void
  emit(event: EventTypes, payload?: any, ...args: any[]) {
    const queue = this.observers[event]
    if (!queue) {
      return
    }
    for (const func of queue) {
      func.call(this, payload, ...args)
    }
  }

  off(event: string, handler?: (...rest: any) => void) {
    const queue = this.observers[event]
    if (!queue) {
      return
    }

    if (handler) {
      const index = queue.findIndex((func) => {
        return func === handler
      })
      if (index !== -1) {
        queue.splice(index, 1)
      }
    } else {
      queue.length = 0
    }
  }
}
export const bus = new EventBus()
