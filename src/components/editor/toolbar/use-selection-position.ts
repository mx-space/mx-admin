import { onUnmounted, ref, watch } from 'vue'
import type { EditorView } from '@codemirror/view'
import type { Ref } from 'vue'

export interface SelectionPosition {
  x: number
  y: number
  above: boolean
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

export function useSelectionPosition(editorView: Ref<EditorView | undefined>) {
  const position = ref<SelectionPosition | null>(null)
  const hasSelection = ref(false)
  const selectionText = ref('')
  const scrollerRef = ref<HTMLElement | null>(null)

  let updateTimeout: ReturnType<typeof setTimeout> | null = null

  const updatePosition = () => {
    const view = editorView.value
    if (!view) {
      hasSelection.value = false
      position.value = null
      selectionText.value = ''
      return
    }

    const { from, to } = view.state.selection.main

    if (from === to) {
      hasSelection.value = false
      position.value = null
      selectionText.value = ''
      return
    }

    selectionText.value = view.state.sliceDoc(from, to)
    hasSelection.value = true

    const fromCoords = view.coordsAtPos(from)
    const toCoords = view.coordsAtPos(to)

    if (!fromCoords || !toCoords) {
      position.value = null
      return
    }

    const scroller = scrollerRef.value
    if (scroller) {
      const scrollerRect = scroller.getBoundingClientRect()
      const selectionTop = Math.min(fromCoords.top, toCoords.top)
      const selectionBottom = Math.max(fromCoords.bottom, toCoords.bottom)

      const isOutOfView =
        selectionBottom < scrollerRect.top || selectionTop > scrollerRect.bottom

      if (isOutOfView) {
        position.value = null
        return
      }
    }

    const selectionCenterX = (fromCoords.left + toCoords.right) / 2
    const selectionTop = Math.min(fromCoords.top, toCoords.top)
    const selectionBottom = Math.max(fromCoords.bottom, toCoords.bottom)

    const viewportTop = 120
    const above = selectionTop > viewportTop

    position.value = {
      x: selectionCenterX,
      y: above ? selectionTop : selectionBottom,
      above,
    }
  }

  const debouncedUpdate = () => {
    if (updateTimeout) clearTimeout(updateTimeout)
    updateTimeout = setTimeout(updatePosition, 50)
  }

  const handleMouseUp = () => debouncedUpdate()
  const handleKeyUp = (e: KeyboardEvent) => {
    if (
      e.key === 'Shift' ||
      e.key.startsWith('Arrow') ||
      e.ctrlKey ||
      e.metaKey
    ) {
      debouncedUpdate()
    }
  }

  const handleScroll = () => {
    if (hasSelection.value) {
      updatePosition()
    }
  }

  watch(
    editorView,
    (view, _, onCleanup) => {
      if (!view) return

      const scroller = findScrollableParent(view.dom) ?? view.scrollDOM
      scrollerRef.value = scroller

      view.dom.addEventListener('mouseup', handleMouseUp)
      view.dom.addEventListener('keyup', handleKeyUp)
      scroller.addEventListener('scroll', handleScroll, { passive: true })

      updatePosition()

      onCleanup(() => {
        view.dom.removeEventListener('mouseup', handleMouseUp)
        view.dom.removeEventListener('keyup', handleKeyUp)
        scroller.removeEventListener('scroll', handleScroll)
      })
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (updateTimeout) clearTimeout(updateTimeout)
  })

  const clearSelection = () => {
    hasSelection.value = false
    position.value = null
    selectionText.value = ''
  }

  return {
    position,
    hasSelection,
    selectionText,
    clearSelection,
    updatePosition,
  }
}
