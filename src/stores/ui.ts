/*
 * @Author: Innei
 * @Date: 2021-03-22 11:41:32
 * @LastEditTime: 2021-03-22 11:41:32
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/stores/ui.ts
 * Mark: Coding with Love
 */

import { reactive, ref } from 'vue'
import { onMounted } from 'vue'
import { throttle } from 'lodash-es'
import { computed } from 'vue'

export interface ViewportRecord {
  w: number
  h: number
  mobile: boolean
  pad: boolean
  hpad: boolean
  wider: boolean
  widest: boolean
}

export function UIStore() {
  const viewport = ref<ViewportRecord>({} as any)
  const sidebarWidth = ref(250)
  const sidebarCollapse = ref(viewport.value.mobile ? true : false)
  onMounted(() => {
    const resizeHandler = throttle(() => {
      updateViewport()
    }, 300)
    window.onresize = resizeHandler
    updateViewport()
  })
  const updateViewport = () => {
    const innerHeight = window.innerHeight
    const width = document.documentElement.getBoundingClientRect().width
    const { hpad, pad, mobile } = viewport.value

    // 忽略移动端浏览器 上下滚动 导致的视图大小变化
    if (
      viewport.value.h &&
      // chrome mobile delta == 56
      Math.abs(innerHeight - viewport.value.h) < 80 &&
      width === viewport.value.w &&
      (hpad || pad || mobile)
    ) {
      return
    }
    viewport.value = {
      w: width,
      h: innerHeight,
      mobile: window.screen.width <= 568 || window.innerWidth <= 568,
      pad: window.innerWidth <= 768 && window.innerWidth > 568,
      hpad: window.innerWidth <= 1024 && window.innerWidth > 768,
      wider: window.innerWidth > 1024 && window.innerWidth < 1920,
      widest: window.innerWidth >= 1920,
    }
  }

  const contentWidth = computed(
    () =>
      viewport.value.w -
      sidebarWidth.value +
      (sidebarCollapse.value ? (viewport.value.mobile ? 50 : 100) : 0),
  )

  const contentInsetWidth = computed(
    () =>
      contentWidth.value -
      parseInt(getComputedStyle(document.documentElement).fontSize) * 6,
  )
  return {
    viewport,
    contentWidth,
    sidebarWidth,
    contentInsetWidth,
    sidebarCollapse,
  }
}
