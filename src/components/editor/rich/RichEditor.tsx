import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type { ChatBubble } from '@haklex/rich-agent-core'
import type { RichEditorVariant } from '@haklex/rich-editor'
import type { NestedDocDialogEditorProps } from '@haklex/rich-ext-nested-doc'
import type { ShiroEditorProps } from '@haklex/rich-kit-shiro'
import type {
  Klass,
  LexicalEditor,
  LexicalNode,
  SerializedEditorState,
} from 'lexical'
import type { Root } from 'react-dom/client'
import type { PropType } from 'vue'

import { DialogStackProvider } from '@haklex/rich-editor-ui'
import {
  NestedDocDialogEditorProvider,
  nestedDocEditNodes,
  NestedDocPlugin,
} from '@haklex/rich-ext-nested-doc'
import { ExcalidrawConfigProvider, ShiroEditor } from '@haklex/rich-kit-shiro'
import { ToolbarPlugin } from '@haklex/rich-plugin-toolbar'
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown'

import '@haklex/rich-ext-ai-agent/style.css'
import '@haklex/rich-kit-shiro/style.css'
import '@haklex/rich-plugin-toolbar/style.css'
import '@haklex/rich-ext-nested-doc/style.css'

import { filesApi } from '~/api/files'
import { API_URL } from '~/constants/env'
import { useUIStore } from '~/stores/ui'

import { RichEditorWithAgent } from './RichEditorWithAgent'

const saveExcalidrawSnapshot = async (
  snapshot: object,
  existingRef?: string,
): Promise<string> => {
  const blob = new Blob([JSON.stringify(snapshot)], {
    type: 'application/json',
  })
  const file = new File([blob], 'snapshot.excalidraw', {
    type: 'application/json',
  })

  // 已有文件则原地更新，否则创建新文件
  if (existingRef?.startsWith('ref:file/')) {
    const name = existingRef.slice(9)
    const result = await filesApi.update('file', name, file)
    return `ref:file/${result.name}`
  }

  const result = await filesApi.upload(file, 'file')
  return `ref:file/${result.name}`
}

function NestedDocDialogEditor({
  initialValue,
  onEditorReady,
}: NestedDocDialogEditorProps) {
  return createElement(ShiroEditor, {
    initialValue,
    onEditorReady,
    extraNodes: nestedDocEditNodes,
    header: createElement(ToolbarPlugin),
  })
}

// React wrapper: syncs Vue-driven props and emits callbacks back
const ShiroEditorReact = (props: {
  editorProps: Omit<ShiroEditorProps, 'onChange' | 'onSubmit' | 'onEditorReady'>
  onChange?: (value: SerializedEditorState) => void
  onSubmit?: () => void
  onEditorReady?: (editor: LexicalEditor | null) => void
}) => {
  return createElement(
    NestedDocDialogEditorProvider,
    { value: NestedDocDialogEditor },
    createElement(
      DialogStackProvider,
      null,
      createElement(
        ExcalidrawConfigProvider,
        {
          saveSnapshot: saveExcalidrawSnapshot,
          apiUrl: API_URL,
        },
        createElement(
          ShiroEditor,
          {
            ...props.editorProps,
            extraNodes: [
              ...(props.editorProps.extraNodes || []),
              ...nestedDocEditNodes,
            ],
            header: createElement(ToolbarPlugin),
            onChange: props.onChange,
            onSubmit: props.onSubmit,
            onEditorReady: props.onEditorReady,
          },
          createElement(NestedDocPlugin),
        ),
      ),
    ),
  )
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
    const containerRef = ref<HTMLDivElement>()
    const agentRef = ref<InstanceType<typeof RichEditorWithAgent>>()
    let root: Root | null = null
    let editorInstance: LexicalEditor | null = null
    let unmounting = false

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
      if (props.editorStyle !== undefined) editorProps.style = props.editorStyle
      if (props.imageUpload !== undefined)
        editorProps.imageUpload = props.imageUpload
      return editorProps as any
    }

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
      const editorProps = buildEditorProps(resolvedTheme)

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
          ;(agentRef.value as any)?.focus()
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
