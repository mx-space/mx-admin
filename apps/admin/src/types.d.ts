import type { useDialog } from 'naive-ui'
import type { VNodeProps } from 'vue'

declare global {
  export interface Window {
    dialog: ReturnType<typeof useDialog>
    injectData: {
      BASE_API: null | string
      WEB_URL: null | string
      GATEWAY: null | string
      LOGIN_BG: null | string
      TITLE: null | string

      INIT: null | boolean

      PAGE_PROXY: boolean
    }

    [K: string]: any
  }

  export const dialog: ReturnType<typeof useDialog>

  export const Fragment: {
    new (): {
      $props: VNodeProps
    }
    __isFragment: true
  }

  export const __DEV__: boolean
  export type KV = Record<string, any>

  export type Class<T> = new (...args: any[]) => T
}

export {}
