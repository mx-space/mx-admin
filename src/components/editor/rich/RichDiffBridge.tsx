import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { SerializedEditorState } from 'lexical'
import type { Root } from 'react-dom/client'
import type { PropType } from 'vue'

import { RichDiff } from '@haklex/rich-diff'
import {
  codeSnippetNodes,
  embedNodes,
  enhancedRendererConfig,
  galleryNodes,
  TldrawNode,
} from '@haklex/rich-kit-shiro'

import '@haklex/rich-diff/style.css'

import { useUIStore } from '~/stores/ui'

const extraNodes = [TldrawNode, ...embedNodes, ...galleryNodes, ...codeSnippetNodes]

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
    const containerRef = ref<HTMLDivElement>()
    let root: Root | null = null

    const renderReact = (theme: 'dark' | 'light') => {
      if (!root) return
      root.render(
        createElement(RichDiff, {
          oldValue: props.oldValue,
          newValue: props.newValue,
          variant: props.variant,
          theme,
          className: props.className,
          extraNodes,
          rendererConfig: enhancedRendererConfig,
        }),
      )
    }

    onMounted(() => {
      root = createRoot(containerRef.value!)
      const uiStore = useUIStore()
      const resolveTheme = () => (uiStore.isDark ? 'dark' : 'light')

      renderReact(resolveTheme())

      watch(
        () => [
          props.oldValue,
          props.newValue,
          props.variant,
          props.className,
          uiStore.isDark,
        ],
        () => renderReact(resolveTheme()),
      )
    })

    onBeforeUnmount(() => {
      root?.unmount()
      root = null
    })

    return () => <div class="h-full w-full overflow-auto" ref={containerRef} />
  },
})
