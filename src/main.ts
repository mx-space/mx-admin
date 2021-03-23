/*
 * @Author: Innei
 * @Date: 2021-03-21 21:23:31
 * @LastEditTime: 2021-03-22 11:23:50
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/main.ts
 * Mark: Coding with Love
 */

import { createApp } from 'vue'
import App from './App'
import './index.css'
import { router } from './router'
// @ts-ignore
import PrimeVue from 'primevue/config'

import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import Toast from 'vue-toastification'
// Import the CSS or use your own!
import 'vue-toastification/dist/index.css'
// import { RESTManager } from './utils/rest'
import { __DEV__ } from './utils'
import { RESTManager } from './utils/rest'
const app = createApp(App)
app.use(PrimeVue)
app.use(router)

app.use(Toast, {})
RESTManager.api
// app.provide(Symbol('rest'), RESTManager)
app.mount('#app')

if (__DEV__) {
  // @ts-ignore
  window.app = app
}
