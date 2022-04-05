/*
 * @Author: Innei
 * @Date: 2021-03-22 11:41:32
 * @LastEditTime: 2021-03-22 11:41:32
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/stores/ui.ts
 * Mark: Coding with Love
 */
import { RESTManager } from 'utils'
import { onMounted, ref } from 'vue'

export interface ViewportRecord {
  w: number
  h: number
  mobile: boolean
  pad: boolean
  hpad: boolean
  wider: boolean
  widest: boolean
  phone: boolean
}

export function AppStore() {
  const app = ref<AppInfo>()
  onMounted(() => {
    RESTManager.api.get<AppInfo>().then((res) => {
      app.value = res
    })
  })
  return {
    app,
  }
}
