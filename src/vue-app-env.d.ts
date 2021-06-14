/*
 * @Author: Innei
 * @Date: 2021-03-21 21:23:31
 * @LastEditTime: 2021-03-22 11:52:22
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/vue-app-env.d.ts
 * Mark: Coding with Love
 */
declare namespace NodeJS {
  interface Process {
    env: ProcessEnv
  }
  interface ProcessEnv {
    /**
     * By default, there are two modes in Vite:
     *
     * * `development` is used by vite and vite serve
     * * `production` is used by vite build
     *
     * You can overwrite the default mode used for a command by passing the --mode option flag.
     *
     */
    readonly NODE_ENV: 'development' | 'production'
  }
}

declare var process: NodeJS.Process

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string }
  export default classes
}
declare module '*.vue' {
  import { App } from 'vue'
  export default App
}

interface MessageApiInjection {
  info: (content: string, options?: any) => any
  success: (content: string, options?: any) => any
  warning: (content: string, options?: any) => any
  error: (content: string, options?: any) => any
  loading: (content: string, options?: any) => any
}

declare interface Window {
  message: MessageApiInjection
}
