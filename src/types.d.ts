import { MessageApi, useNotification, useDialog } from 'naive-ui'
import { VNodeProps } from 'vue'

declare global {
  export interface Window {
    message: MessageApi
    notification: ReturnType<typeof useNotification>
    dialog: ReturnType<typeof useDialog>
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
