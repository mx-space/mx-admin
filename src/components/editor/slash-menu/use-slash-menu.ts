import Fuse from 'fuse.js'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { EditorView } from '@codemirror/view'
import type { Ref } from 'vue'
import type { SlashMenuGroup, SlashMenuItemWithGroup } from './slash-menu-items'

import {
  closeSlashMenuEffect,
  slashMenuCommandAnnotation,
  slashMenuStateField,
} from './slash-menu-extension'
import { slashMenuGroups, slashMenuItems } from './slash-menu-items'

interface SlashMenuPosition {
  x: number
  y: number
}

const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
  while (el) {
    if (el.classList.contains('n-scrollbar-container')) {
      return el
    }
    const style = getComputedStyle(el)
    const overflowY = style.overflowY
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight
    ) {
      return el
    }
    el = el.parentElement
  }
  return null
}

export function useSlashMenu(editorView: Ref<EditorView | undefined>) {
  const isOpen = ref(false)
  const position = ref<SlashMenuPosition | null>(null)
  const query = ref('')
  const activeIndex = ref(0)
  const isKeyboardNav = ref(false)
  const scrollerRef = ref<HTMLElement | null>(null)

  const fuse = new Fuse(slashMenuItems, {
    keys: ['label', 'description', 'keywords'],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
  })

  const filteredItems = computed<SlashMenuItemWithGroup[]>(() => {
    const q = query.value.trim()
    if (!q) return slashMenuItems
    return fuse.search(q).map((result) => result.item)
  })

  const groupedItems = computed<
    Array<Omit<SlashMenuGroup, 'items'> & { items: SlashMenuItemWithGroup[] }>
  >(() => {
    const available = new Map<string, SlashMenuItemWithGroup[]>()
    for (const item of filteredItems.value) {
      const list = available.get(item.groupId) ?? []
      list.push(item)
      available.set(item.groupId, list)
    }

    return slashMenuGroups
      .map((group) => ({
        ...group,
        items: available.get(group.id) ?? [],
      }))
      .filter((group) => group.items.length > 0)
  })

  const flatItems = computed(() => filteredItems.value)

  const syncFromEditor = () => {
    const view = editorView.value
    if (!view) {
      isOpen.value = false
      position.value = null
      query.value = ''
      return
    }

    const state = view.state.field(slashMenuStateField, false)
    if (!state?.active || state.triggerPos == null) {
      isOpen.value = false
      position.value = null
      query.value = state?.query ?? ''
      return
    }

    const coords = view.coordsAtPos(state.triggerPos)
    if (!coords) {
      isOpen.value = false
      position.value = null
      query.value = state.query
      return
    }

    const scroller = scrollerRef.value ?? view.scrollDOM
    const scrollerRect = scroller.getBoundingClientRect()
    const isOutOfView =
      coords.bottom < scrollerRect.top || coords.top > scrollerRect.bottom

    if (isOutOfView) {
      isOpen.value = false
      position.value = null
      query.value = state.query
      return
    }

    // 计算弹窗位置，避免超出视口
    const menuHeight = 380 // max-h-[380px]
    const menuWidth = 320 // max-w-[320px]
    const padding = 8
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // 默认显示在光标下方
    let x = coords.left
    let y = coords.bottom + 4

    // 检查是否超出右边界，如果超出则靠右对齐
    if (x + menuWidth > viewportWidth - padding) {
      x = viewportWidth - menuWidth - padding
    }

    // 检查是否超出底部，如果超出则显示在光标上方
    if (y + menuHeight > viewportHeight - padding) {
      y = coords.top - menuHeight - 4
      // 如果上方空间也不够，则尽量靠上显示
      if (y < padding) {
        y = padding
      }
    }

    isOpen.value = true
    position.value = { x, y }
    query.value = state.query
  }

  const closeMenu = () => {
    const view = editorView.value
    if (!view) return
    view.dispatch({
      effects: closeSlashMenuEffect.of(undefined),
      annotations: slashMenuCommandAnnotation.of(true),
    })
    syncFromEditor()
  }

  const executeItem = (item: SlashMenuItemWithGroup) => {
    const view = editorView.value
    if (!view) return

    const state = view.state.field(slashMenuStateField, false)
    if (!state?.active || state.triggerPos == null) return

    const head = view.state.selection.main.head

    view.dispatch({
      changes: { from: state.triggerPos, to: head, insert: '' },
      selection: { anchor: state.triggerPos },
      annotations: slashMenuCommandAnnotation.of(true),
    })

    item.command(view)
    closeMenu()
    view.focus()
  }

  const selectActiveItem = () => {
    const items = flatItems.value
    if (items.length === 0) return
    const index = Math.min(activeIndex.value, items.length - 1)
    executeItem(items[index])
  }

  const moveActive = (delta: number) => {
    const items = flatItems.value
    if (items.length === 0) return
    const total = items.length
    const next = (activeIndex.value + delta + total) % total
    isKeyboardNav.value = true
    activeIndex.value = next
  }

  watch([isOpen, flatItems], ([open, items]) => {
    if (!open || items.length === 0) {
      activeIndex.value = 0
      return
    }
    if (activeIndex.value >= items.length) {
      activeIndex.value = 0
    }
  })

  watch(query, () => {
    activeIndex.value = 0
  })

  watch(
    editorView,
    (view, _prev, onCleanup) => {
      if (!view) return

      const handleInput = () => syncFromEditor()
      const handleKeydown = (event: KeyboardEvent) => {
        if (!isOpen.value) return

        if (event.key === 'ArrowDown') {
          event.preventDefault()
          event.stopPropagation()
          moveActive(1)
          return
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()
          event.stopPropagation()
          moveActive(-1)
          return
        }

        if (event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          selectActiveItem()
          return
        }

        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          closeMenu()
        }
      }

      const handleScroll = () => {
        if (isOpen.value) {
          syncFromEditor()
        }
      }

      const scroller = findScrollableParent(view.dom) ?? view.scrollDOM
      scrollerRef.value = scroller

      view.dom.addEventListener('input', handleInput)
      view.dom.addEventListener('keyup', handleInput)
      view.dom.addEventListener('mouseup', handleInput)
      view.dom.addEventListener('compositionend', handleInput)
      view.dom.addEventListener('keydown', handleKeydown, { capture: true })
      scroller.addEventListener('scroll', handleScroll, { passive: true })

      syncFromEditor()

      onCleanup(() => {
        view.dom.removeEventListener('input', handleInput)
        view.dom.removeEventListener('keyup', handleInput)
        view.dom.removeEventListener('mouseup', handleInput)
        view.dom.removeEventListener('compositionend', handleInput)
        view.dom.removeEventListener('keydown', handleKeydown, {
          capture: true,
        })
        scroller.removeEventListener('scroll', handleScroll)
      })
    },
    { immediate: true },
  )

  onMounted(() => {
    syncFromEditor()
  })

  onUnmounted(() => {
    position.value = null
  })

  return {
    isOpen,
    position,
    query,
    groupedItems,
    flatItems,
    activeIndex,
    isKeyboardNav,
    moveActive,
    executeItem,
    selectActiveItem,
    closeMenu,
    syncFromEditor,
  }
}
