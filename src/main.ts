import './monaco'
import 'reflect-metadata'

import { piniaStore } from '~/stores'
import { bus } from '~/utils/event-bus'

import 'virtual:windi.css'

import { createApp } from 'vue'

import App from './App'

import './index.css'

import { router } from './router'
import { attachTokenFromQuery } from './utils'

attachTokenFromQuery()

const app = createApp(App)

app.use(router)
app.use(piniaStore)
app.mount('#app')

if (__DEV__) {
  window.app = app
  window.bus = bus
}

// cjs webpack compatibility
// @ts-ignore
window.global = window
// @ts-ignore
window.process = {
  env: {},
}
// @ts-ignore
window.module = {
  exports: {},
}

declare global {
  interface JSON {
    safeParse: typeof JSON.parse
  }
}
JSON.safeParse = (...rest) => {
  try {
    return JSON.parse(...rest)
  } catch {
    return null
  }
}
