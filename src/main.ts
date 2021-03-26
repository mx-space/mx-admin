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

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { __DEV__ } from './utils'
import PrimeVue from 'primevue/config/config.esm'
// start

import 'primevue/resources/primevue.min.css'
import 'primevue/resources/themes/saga-blue/theme.css'
import { ElMessage } from 'element-plus'
import 'element-plus/lib/theme-chalk/el-message.css'
import 'element-plus/lib/theme-chalk/base.css'
import 'primeicons/primeicons.css'
// end

const app = createApp(App)

app.use(router)
app.use(Toast, {})
app.use(PrimeVue, { ripple: true })
app.use(ElMessage)
app.mount('#app')

if (__DEV__) {
  // @ts-ignore
  window.app = app
}
