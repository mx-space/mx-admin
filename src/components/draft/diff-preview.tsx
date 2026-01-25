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

import { FileDiff, preloadHighlighter } from '@pierre/diffs'

export interface DiffFile {
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

export const DiffPreview = defineComponent({
  name: 'DiffPreview',
  props: {
    oldFile: {
      type: Object as PropType<DiffFile>,
      required: true,
    },
    newFile: {
      type: Object as PropType<DiffFile>,
      required: true,
    },
  },
  setup(props) {
    const containerRef = ref<HTMLElement>()
    const diffInstance = shallowRef<FileDiff | null>(null)
    const isLoading = ref(true)

    const createDiff = async () => {
      if (!containerRef.value) return

      // Clean up existing instance
      if (diffInstance.value) {
        diffInstance.value.cleanUp()
        diffInstance.value = null
      }

      // Clear container
      containerRef.value.innerHTML = ''

      try {
        // Ensure highlighter is ready
        await ensureHighlighter()
        isLoading.value = false

        await nextTick()

        if (!containerRef.value) return

        diffInstance.value = new FileDiff({
          diffStyle: 'unified',
          diffIndicators: 'bars',
          themeType: 'system',
          disableFileHeader: true,
        })

        // Use containerWrapper to attach the diffs-container element
        diffInstance.value.render({
          oldFile: {
            name: props.oldFile.name,
            contents: props.oldFile.contents,
          },
          newFile: {
            name: props.newFile.name,
            contents: props.newFile.contents,
          },
          containerWrapper: containerRef.value,
        })
      } catch (error) {
        console.error('[DiffPreview] Failed to create diff:', error)
        isLoading.value = false
      }
    }

    onMounted(() => {
      createDiff()
    })

    watch(
      () => [props.oldFile.contents, props.newFile.contents],
      () => {
        createDiff()
      },
    )

    onUnmounted(() => {
      if (diffInstance.value) {
        diffInstance.value.cleanUp()
        diffInstance.value = null
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
