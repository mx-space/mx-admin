import {
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import type { PropType } from 'vue'

import { File as FileRenderer, preloadHighlighter } from '@pierre/diffs'

export interface PreviewFile {
  name: string
  contents: string
}

// Preload highlighter once
let highlighterReady = false
const ensureHighlighter = async () => {
  if (highlighterReady) return
  await preloadHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['markdown', 'typescript', 'javascript', 'json', 'html', 'css'],
  })
  highlighterReady = true
}

export const FilePreview = defineComponent({
  name: 'FilePreview',
  props: {
    file: {
      type: Object as PropType<PreviewFile>,
      required: true,
    },
  },
  setup(props) {
    const containerRef = ref<HTMLElement>()
    const fileInstance = shallowRef<FileRenderer | null>(null)
    const isLoading = ref(true)

    const createPreview = async () => {
      if (!containerRef.value) return

      // Clean up existing instance
      if (fileInstance.value) {
        fileInstance.value.cleanUp()
        fileInstance.value = null
      }

      // Clear container
      containerRef.value.innerHTML = ''

      try {
        // Ensure highlighter is ready
        await ensureHighlighter()
        isLoading.value = false

        await nextTick()

        if (!containerRef.value) return

        fileInstance.value = new FileRenderer({
          themeType: 'system',
          disableFileHeader: true,
        })

        // Use containerWrapper to attach the diffs-container element
        fileInstance.value.render({
          file: {
            name: props.file.name,
            contents: props.file.contents,
          },
          containerWrapper: containerRef.value,
        })
      } catch (error) {
        console.error('[FilePreview] Failed to create preview:', error)
        isLoading.value = false
      }
    }

    onMounted(() => {
      createPreview()
    })

    watch(
      () => props.file.contents,
      () => {
        createPreview()
      },
    )

    onUnmounted(() => {
      if (fileInstance.value) {
        fileInstance.value.cleanUp()
        fileInstance.value = null
      }
    })

    return () => (
      <div
        ref={containerRef}
        class="h-full overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
      >
        {isLoading.value && (
          <div class="flex h-full items-center justify-center text-neutral-400">
            加载中...
          </div>
        )}
      </div>
    )
  },
})
