import { onUnmounted, ref, watch } from 'vue'
import type { EditorView } from '@codemirror/view'
import type { Ref } from 'vue'

export interface SelectionPosition {
  x: number
  y: number
  above: boolean
}

export function useSelectionPosition(editorView: Ref<EditorView | undefined>) {
  const position = ref<SelectionPosition | null>(null)
  const hasSelection = ref(false)
  const selectionText = ref('')

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

    // No selection (cursor only)
    if (from === to) {
      hasSelection.value = false
      position.value = null
      selectionText.value = ''
      return
    }

    // Get selected text
    selectionText.value = view.state.sliceDoc(from, to)
    hasSelection.value = true

    // Get coordinates
    const fromCoords = view.coordsAtPos(from)
    const toCoords = view.coordsAtPos(to)

    if (!fromCoords || !toCoords) {
      position.value = null
      return
    }

    // Calculate center position of selection
    const selectionCenterX = (fromCoords.left + toCoords.right) / 2
    const selectionTop = Math.min(fromCoords.top, toCoords.top)
    const selectionBottom = Math.max(fromCoords.bottom, toCoords.bottom)

    // Determine placement (above/below based on available space)
    const viewportTop = 120 // Header height consideration
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

  // Event handlers
  const handleMouseUp = () => debouncedUpdate()
  const handleKeyUp = (e: KeyboardEvent) => {
    // Only update on selection-related keys
    if (
      e.key === 'Shift' ||
      e.key.startsWith('Arrow') ||
      e.ctrlKey ||
      e.metaKey
    ) {
      debouncedUpdate()
    }
  }

  // Watch for editor changes
  watch(
    editorView,
    (view, _, onCleanup) => {
      if (!view) return

      view.dom.addEventListener('mouseup', handleMouseUp)
      view.dom.addEventListener('keyup', handleKeyUp)

      // Initial check
      updatePosition()

      onCleanup(() => {
        view.dom.removeEventListener('mouseup', handleMouseUp)
        view.dom.removeEventListener('keyup', handleKeyUp)
      })
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (updateTimeout) clearTimeout(updateTimeout)
  })

  // Method to manually clear selection state (useful when toolbar action is taken)
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
