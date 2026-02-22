import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { RichEditorVariant } from '@haklex/rich-editor'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type {
  Klass,
  LexicalEditor,
  LexicalNode,
  SerializedEditorState,
} from 'lexical'
import type { Root } from 'react-dom/client'
import type { PropType } from 'vue'

import { ShiroEditor } from '@haklex/rich-kit-shiro'
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'

import '@haklex/rich-kit-shiro/style.css'

import { useUIStore } from '~/stores/ui'

// React wrapper: syncs Vue-driven props and emits callbacks back
const ShiroEditorReact = (props: {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  onChange?: (value: SerializedEditorState) => void
  onSubmit?: () => void
  onEditorReady?: (editor: LexicalEditor | null) => void
}) => {
  return createElement(ShiroEditor, {
    ...props.editorProps,
    onChange: props.onChange,
    onSubmit: props.onSubmit,
    onEditorReady: props.onEditorReady,
  })
}

export const RichEditor = defineComponent({
  props: {
    initialValue: Object as PropType<SerializedEditorState>,
    theme: String as PropType<'dark' | 'light'>,
    placeholder: String,
    variant: String as PropType<RichEditorVariant>,
    autoFocus: { type: Boolean, default: undefined },
    className: String,
    contentClassName: String,
    debounceMs: Number,
    selfHostnames: Array as PropType<string[]>,
    extraNodes: Array as PropType<Array<Klass<LexicalNode>>>,
  },
  emits: {
    change: (_value: SerializedEditorState) => true,
    textChange: (_text: string) => true,
    submit: () => true,
    editorReady: (_editor: LexicalEditor | null) => true,
  },
  setup(props, { emit }) {
    const containerRef = ref<HTMLDivElement>()
    let root: Root | null = null
    let editorInstance: LexicalEditor | null = null

    const buildEditorProps = (
      resolvedTheme: 'dark' | 'light',
    ): Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'> => {
      const editorProps: Record<string, unknown> = { theme: resolvedTheme }
      if (props.initialValue !== undefined)
        editorProps.initialValue = props.initialValue
      if (props.placeholder !== undefined)
        editorProps.placeholder = props.placeholder
      if (props.variant !== undefined) editorProps.variant = props.variant
      if (props.autoFocus !== undefined) editorProps.autoFocus = props.autoFocus
      if (props.className !== undefined) editorProps.className = props.className
      if (props.contentClassName !== undefined)
        editorProps.contentClassName = props.contentClassName
      if (props.debounceMs !== undefined)
        editorProps.debounceMs = props.debounceMs
      if (props.selfHostnames !== undefined)
        editorProps.selfHostnames = props.selfHostnames
      if (props.extraNodes !== undefined)
        editorProps.extraNodes = props.extraNodes
      return editorProps as any
    }

    const renderReact = (resolvedTheme: 'dark' | 'light') => {
      if (!root) return
      root.render(
        createElement(ShiroEditorReact, {
          editorProps: buildEditorProps(resolvedTheme),
          onChange: (value: SerializedEditorState) => {
            emit('change', value)
            if (editorInstance) {
              editorInstance.read(() => {
                emit('textChange', $convertToMarkdownString(TRANSFORMERS))
              })
            }
          },
          onSubmit: () => emit('submit'),
          onEditorReady: (editor: LexicalEditor | null) => {
            editorInstance = editor
            emit('editorReady', editor)
            if (editor) {
              editor.read(() => {
                emit('textChange', $convertToMarkdownString(TRANSFORMERS))
              })
            }
          },
        }),
      )
    }

    onMounted(() => {
      root = createRoot(containerRef.value!)

      const uiStore = useUIStore()
      const resolveTheme = () =>
        props.theme ?? (uiStore.isDark ? 'dark' : 'light')

      renderReact(resolveTheme())

      watch(
        () => [
          props.theme,
          uiStore.isDark,
          props.initialValue,
          props.placeholder,
          props.variant,
          props.autoFocus,
          props.className,
          props.contentClassName,
          props.debounceMs,
          props.selfHostnames,
          props.extraNodes,
        ],
        () => renderReact(resolveTheme()),
      )
    })

    onBeforeUnmount(() => {
      root?.unmount()
      root = null
      editorInstance = null
    })

    return () => <div class="h-full w-full" ref={containerRef} />
  },
})
