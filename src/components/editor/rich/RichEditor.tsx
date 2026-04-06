import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type { ChatBubble } from '@haklex/rich-agent-core'
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

import { NestedDocPlugin } from '@haklex/rich-ext-nested-doc'
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'

import '@haklex/rich-ext-ai-agent/style.css'
import '@haklex/rich-kit-shiro/style.css'
import '@haklex/rich-plugin-toolbar/style.css'
import '@haklex/rich-ext-nested-doc/style.css'

import { useUIStore } from '~/stores/ui'

import { buildShiroEditorProps } from './build-shiro-editor-props'
import { RichEditorWithAgent } from './RichEditorWithAgent'
import { createShiroEditorBridgeElement } from './shiro-editor-bridge'

type FocusableEditorHandle = { focus: () => void }

// React wrapper: syncs Vue-driven props and emits callbacks back
const ShiroEditorReact = (props: {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  onChange?: (value: SerializedEditorState) => void
  onSubmit?: () => void
  onEditorReady?: (editor: LexicalEditor | null) => void
}) => {
  return createShiroEditorBridgeElement({
    editorProps: props.editorProps,
    onChange: props.onChange,
    onSubmit: props.onSubmit,
    onEditorReady: props.onEditorReady,
    children: [createElement(NestedDocPlugin)],
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
    editorStyle: Object as PropType<Record<string, string | number>>,
    imageUpload: Function as PropType<ShiroEditorProps['imageUpload']>,
    agentEnabled: { type: Boolean, default: false },
    agentVisible: { type: Boolean, default: false },
    providerGroups: Array as PropType<ProviderGroup[]>,
    selectedModel: Object as PropType<SelectedModel | null>,
    onSelectModel: Function as PropType<(model: SelectedModel) => void>,
    initialBubbles: Array as PropType<ChatBubble[]>,
    refId: String,
    refType: String as PropType<'post' | 'note' | 'page'>,
  },
  emits: {
    change: (_value: SerializedEditorState) => true,
    textChange: (_text: string) => true,
    submit: () => true,
    editorReady: (_editor: LexicalEditor | null) => true,
  },
  setup(props, { emit, expose }) {
    const containerRef = ref<HTMLDivElement | null>(null)
    const agentRef = ref<FocusableEditorHandle | null>(null)
    let root: Root | null = null
    let editorInstance: LexicalEditor | null = null
    let unmounting = false

    const handleChange = (value: SerializedEditorState) => {
      if (unmounting) return
      emit('change', value)
      if (editorInstance) {
        editorInstance.read(() => {
          emit('textChange', $convertToMarkdownString(TRANSFORMERS))
        })
      }
    }

    const handleSubmit = () => emit('submit')

    const handleEditorReady = (editor: LexicalEditor | null) => {
      editorInstance = editor
      emit('editorReady', editor)
      if (editor) {
        editor.read(() => {
          emit('textChange', $convertToMarkdownString(TRANSFORMERS))
        })
      }
    }

    const renderReact = (resolvedTheme: 'dark' | 'light') => {
      if (!root) return
      const editorProps = buildShiroEditorProps(resolvedTheme, {
        initialValue: props.initialValue,
        placeholder: props.placeholder,
        variant: props.variant,
        autoFocus: props.autoFocus,
        className: props.className,
        contentClassName: props.contentClassName,
        debounceMs: props.debounceMs,
        selfHostnames: props.selfHostnames,
        extraNodes: props.extraNodes,
        editorStyle: props.editorStyle,
        imageUpload: props.imageUpload,
      })

      root.render(
        createElement(ShiroEditorReact, {
          editorProps,
          onChange: handleChange,
          onSubmit: handleSubmit,
          onEditorReady: handleEditorReady,
        }),
      )
    }

    onMounted(() => {
      if (props.agentEnabled) return

      root = createRoot(containerRef.value!)

      const uiStore = useUIStore()
      const resolveTheme = () =>
        props.theme ?? (uiStore.isDark ? 'dark' : 'light')

      renderReact(resolveTheme())

      watch(
        () => [
          props.theme,
          uiStore.isDark,
          props.placeholder,
          props.variant,
          props.autoFocus,
          props.className,
          props.contentClassName,
          props.debounceMs,
          props.selfHostnames,
          props.extraNodes,
          props.editorStyle,
          props.imageUpload,
        ],
        () => renderReact(resolveTheme()),
      )
    })

    onBeforeUnmount(() => {
      unmounting = true
      root?.unmount()
      root = null
      editorInstance = null
    })

    expose({
      focus: () => {
        if (props.agentEnabled) {
          agentRef.value?.focus()
        } else {
          editorInstance?.focus()
        }
      },
    })

    if (props.agentEnabled) {
      return () => (
        <RichEditorWithAgent
          ref={agentRef}
          initialValue={props.initialValue}
          theme={props.theme}
          placeholder={props.placeholder}
          variant={props.variant}
          autoFocus={props.autoFocus}
          className={props.className}
          contentClassName={props.contentClassName}
          debounceMs={props.debounceMs}
          selfHostnames={props.selfHostnames}
          extraNodes={props.extraNodes}
          editorStyle={props.editorStyle}
          imageUpload={props.imageUpload}
          agentVisible={props.agentVisible}
          providerGroups={props.providerGroups}
          selectedModel={props.selectedModel}
          onSelectModel={props.onSelectModel}
          initialBubbles={props.initialBubbles}
          refId={props.refId}
          refType={props.refType}
          onChange={(v: SerializedEditorState) => emit('change', v)}
          onSubmit={handleSubmit}
          onEditorReady={(e: LexicalEditor | null) => {
            editorInstance = e
            emit('editorReady', e)
          }}
          onTextChange={(text: string) => emit('textChange', text)}
        />
      )
    }

    return () => <div class="h-full w-full" ref={containerRef} />
  },
})
