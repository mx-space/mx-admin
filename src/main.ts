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

import ElementPlus from 'element-plus'
import 'element-plus/lib/theme-chalk/index.css'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { __DEV__ } from './utils'

const app = createApp(App)

app.use(router)
app.use(ElementPlus)
app.use(Toast, {})

// app.provide(Symbol('rest'), RESTManager)
app.mount('#app')

if (__DEV__) {
  // @ts-ignore
  window.app = app
}
