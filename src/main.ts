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

const app = createApp(App)

app.use(router)
app.mount('#app')

if (__DEV__) {
  // @ts-ignore
  window.app = app
}
