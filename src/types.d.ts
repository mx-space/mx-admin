import { MessageApi, useDialog, useNotification } from 'naive-ui'
import { VNodeProps } from 'vue'

declare global {
  export interface Window {
    message: MessageApi
    notification: ReturnType<typeof useNotification>
    dialog: ReturnType<typeof useDialog>
    injectData: {
      BASE_API: null | string
      WEB_URL: null | string
      GATEWAY: null | string
      LOGIN_BG: null | string
      TITLE: null | string

      INIT: null | boolean
    }

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
