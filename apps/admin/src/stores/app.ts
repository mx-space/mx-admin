import { defineStore } from 'pinia'
import { onMounted, ref } from 'vue'
import type { AppInfo } from '~/models/system'

import { systemApi } from '~/api/system'

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

export const useAppStore = defineStore('app', () => {
  const app = ref<AppInfo>()
  onMounted(() => {
    systemApi.getAppInfo().then((res) => {
      app.value = res
    })
  })
  return {
    app,
  }
})

export { useAppStore as AppStore }
