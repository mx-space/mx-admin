import { MessageApi, useNotification } from 'naive-ui'
import { VNodeProps } from 'vue'

declare global {
  export interface Window {
    message: MessageApi
    notification: ReturnType<typeof useNotification>

    [K: string]: any
  }

  export const message: MessageApi

  export const Fragment: {
    new (): {
      $props: VNodeProps
    }
    __isFragment: true
  }

  export const __DEV__: boolean
  export type KV = Record<string, any>
}

export {}
