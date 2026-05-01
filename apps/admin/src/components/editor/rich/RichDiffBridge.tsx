import { mountRichDiff } from '@mx-admin/rich-react'
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { RichDiffHandle } from '@mx-admin/rich-react'
import type { SerializedEditorState } from 'lexical'
import type { PropType } from 'vue'

import { useUIStore } from '~/stores/ui'

export const RichDiffBridge = defineComponent({
  props: {
    oldValue: {
      type: Object as PropType<SerializedEditorState>,
      required: true,
    },
    newValue: {
      type: Object as PropType<SerializedEditorState>,
      required: true,
    },
    variant: String as PropType<'article' | 'comment' | 'note'>,
    className: String,
  },
  setup(props) {
    const containerRef = ref<HTMLDivElement | null>(null)
    let handle: RichDiffHandle | null = null

    onMounted(() => {
      if (!containerRef.value) return
      const uiStore = useUIStore()
      const resolveTheme = () => (uiStore.isDark ? 'dark' : 'light')

      handle = mountRichDiff(containerRef.value, {
        oldValue: props.oldValue,
        newValue: props.newValue,
        variant: props.variant,
        className: props.className,
        theme: resolveTheme(),
      })

      watch(
        () => [
          props.oldValue,
          props.newValue,
          props.variant,
          props.className,
          uiStore.isDark,
        ],
        () =>
          handle?.update({
            oldValue: props.oldValue,
            newValue: props.newValue,
            variant: props.variant,
            className: props.className,
            theme: resolveTheme(),
          }),
      )
    })

    onBeforeUnmount(() => {
      handle?.unmount()
      handle = null
    })

    return () => <div class="h-full w-full overflow-auto" ref={containerRef} />
  },
})
