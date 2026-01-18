/*
 * @Author: Innei
 * @Date: 2021-03-22 11:41:32
 * @LastEditTime: 2021-03-22 11:41:32
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/stores/ui.ts
 * Mark: Coding with Love
 */
import { debounce } from 'es-toolkit/compat'
import { computed, onMounted, ref, watch } from 'vue'

import { usePreferredDark, useStorage } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark' | 'system'

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

export const useUIStore = defineStore('ui', () => {
  const viewport = ref<ViewportRecord>({} as any)
  const sidebarCollapse = ref(viewport.value.mobile ? true : false)

  // Three-state theme: light, dark, system
  const themeMode = useStorage<ThemeMode>('theme-mode', 'system')
  const prefersDark = usePreferredDark()

  // Computed: actual dark state based on mode
  const isDark = computed(() => {
    if (themeMode.value === 'system') {
      return prefersDark.value
    }
    return themeMode.value === 'dark'
  })

  // Cycle through theme modes: light -> dark -> system -> light
  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    themeMode.value = modes[nextIndex]
  }

  // Set specific theme mode
  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
  }

  // Legacy toggle (for backward compatibility)
  const toggleDark = () => {
    if (isDark.value) {
      themeMode.value = 'light'
    } else {
      themeMode.value = 'dark'
    }
  }

  onMounted(() => {
    const resizeHandler = debounce(updateViewport, 500, { trailing: true })
    window.addEventListener('resize', resizeHandler)
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

      phone: window.innerWidth <= 768,
    }
  }

  const contentWidth = computed(() => {
    if (sidebarCollapse.value) {
      // 折叠时内容区域占满整个屏幕宽度
      return viewport.value.w
    }
    // 展开时减去 Sidebar 宽度
    const sidebarWidthValue = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--sidebar-width',
      ),
    )
    return viewport.value.w - sidebarWidthValue
  })

  const contentInsetWidth = computed(
    () =>
      contentWidth.value -
      Number.parseInt(getComputedStyle(document.documentElement).fontSize) * 6,
  )

  watch(
    () => isDark.value,
    (isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    { immediate: true },
  )

  const naiveUIDark = ref(false)
  return {
    viewport,
    contentWidth,
    contentInsetWidth,
    sidebarCollapse,

    isDark,
    toggleDark,
    themeMode,
    cycleTheme,
    setThemeMode,

    naiveUIDark,
    onlyToggleNaiveUIDark: (dark?: boolean) => {
      naiveUIDark.value = dark ?? !naiveUIDark.value
    },
  }
})

export { useUIStore as UIStore }
