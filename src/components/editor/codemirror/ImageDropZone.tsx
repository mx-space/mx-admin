import { Upload } from 'lucide-vue-next'
import { defineComponent, onBeforeUnmount, ref, Teleport, watch } from 'vue'
import type { EditorView } from '@codemirror/view'

import { useEditorStore } from './editor-store'

const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
  while (el) {
    if (el.classList.contains('n-scrollbar-container')) {
      return el
    }
    el = el.parentElement
  }
  return null
}

export const ImageDropZone = defineComponent({
  name: 'ImageDropZone',
  setup() {
    const editorStore = useEditorStore()
    const isDragging = ref(false)
    const teleportTarget = ref<HTMLElement | null>(null)
    let dragCounter = 0

    const hasImageFile = (dataTransfer: DataTransfer | null) => {
      if (!dataTransfer?.items) return false
      for (const item of dataTransfer.items) {
        if (item.type.startsWith('image/')) return true
      }
      return false
    }

    const handleDrop = (event: DragEvent) => {
      dragCounter = 0
      isDragging.value = false

      const files = event.dataTransfer?.files
      if (!files || files.length === 0) return

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/'),
      )

      if (imageFiles.length > 0) {
        const uploadFn = editorStore.uploadImageFile
        if (!uploadFn) return
        event.preventDefault()
        event.stopPropagation()
        imageFiles.forEach((file) => uploadFn(file))
      }
    }

    const handleDragOver = (event: DragEvent) => {
      if (hasImageFile(event.dataTransfer)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleDragEnter = (event: DragEvent) => {
      if (hasImageFile(event.dataTransfer)) {
        event.preventDefault()
        dragCounter++
        isDragging.value = true
      }
    }

    const handleDragLeave = () => {
      dragCounter--
      if (dragCounter === 0) {
        isDragging.value = false
      }
    }

    const bindEvents = (view: EditorView) => {
      view.dom.addEventListener('drop', handleDrop)
      view.dom.addEventListener('dragover', handleDragOver)
      view.dom.addEventListener('dragenter', handleDragEnter)
      view.dom.addEventListener('dragleave', handleDragLeave)
    }

    const unbindEvents = (view: EditorView) => {
      view.dom.removeEventListener('drop', handleDrop)
      view.dom.removeEventListener('dragover', handleDragOver)
      view.dom.removeEventListener('dragenter', handleDragEnter)
      view.dom.removeEventListener('dragleave', handleDragLeave)
    }

    let boundView: EditorView | null = null

    watch(
      () => editorStore.editorView,
      (newView, oldView) => {
        if (oldView) unbindEvents(oldView)
        if (newView) {
          bindEvents(newView)
          boundView = newView
          // 查找滚动容器作为 Teleport 目标
          const scrollContainer = findScrollableParent(
            newView.dom.closest(
              '.write-editor-scroll-container',
            ) as HTMLElement,
          )
          teleportTarget.value = scrollContainer
        }
      },
      { immediate: true },
    )

    onBeforeUnmount(() => {
      if (boundView) unbindEvents(boundView)
    })

    return () => {
      if (!isDragging.value || !teleportTarget.value) return null

      return (
        <Teleport to={teleportTarget.value}>
          <div class="z-100 pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md dark:bg-neutral-950/70">
            <div class="animate-in zoom-in-95 pointer-events-none flex flex-col items-center gap-6 rounded-2xl border border-neutral-200 bg-white px-16 py-12 shadow-2xl duration-150 dark:border-neutral-700 dark:bg-neutral-800">
              <Upload
                size={48}
                strokeWidth={1.5}
                class="text-neutral-400 dark:text-neutral-500"
              />
              <span class="text-lg font-medium text-neutral-600 dark:text-neutral-300">
                松开以上传图片
              </span>
            </div>
          </div>
        </Teleport>
      )
    }
  },
})
