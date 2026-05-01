import { mountRichEditor } from '@mx-admin/rich-react'
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type { ChatBubble } from '@haklex/rich-agent-core'
import type { RichEditorVariant } from '@haklex/rich-editor'
import type { ImageUpload, RichEditorHandle } from '@mx-admin/rich-react'
import type {
  Klass,
  LexicalEditor,
  LexicalNode,
  SerializedEditorState,
} from 'lexical'
import type { PropType } from 'vue'
import type { MetaFieldsSchema } from './agent-chat/composables/use-meta-tools'

import { filesApi } from '~/api/files'
import { API_URL } from '~/constants/env'
import { useUIStore } from '~/stores/ui'

import { RichEditorWithAgent } from './RichEditorWithAgent'

async function saveExcalidrawSnapshot(
  snapshot: object,
  existingRef?: string,
): Promise<string> {
  const blob = new Blob([JSON.stringify(snapshot)], {
    type: 'application/json',
  })
  const file = new File([blob], 'snapshot.excalidraw', {
    type: 'application/json',
  })

  if (existingRef?.startsWith('ref:file/')) {
    const name = existingRef.slice(9)
    const result = await filesApi.update('file', name, file)
    return `ref:file/${result.name}`
  }

  const result = await filesApi.upload(file, 'file')
  return `ref:file/${result.name}`
}

type FocusableEditorHandle = { focus: () => void }

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
    imageUpload: Function as PropType<ImageUpload>,
    agentEnabled: { type: Boolean, default: false },
    agentVisible: { type: Boolean, default: false },
    providerGroups: Array as PropType<ProviderGroup[]>,
    selectedModel: Object as PropType<SelectedModel | null>,
    onSelectModel: Function as PropType<(model: SelectedModel) => void>,
    initialBubbles: Array as PropType<ChatBubble[]>,
    refId: String,
    refType: String as PropType<'post' | 'note' | 'page'>,
    metaFieldsSchema: Object as PropType<MetaFieldsSchema>,
    getMetaFields: Function as PropType<() => Record<string, unknown>>,
    onMetaFieldsUpdate: Function as PropType<
      (updates: Record<string, unknown>) => void | Promise<void>
    >,
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
    let handle: RichEditorHandle | null = null
    let editorInstance: LexicalEditor | null = null

    const buildOptions = (resolvedTheme: 'dark' | 'light') => ({
      theme: resolvedTheme,
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
      saveExcalidrawSnapshot,
      apiUrl: API_URL,
      onChange: (v: SerializedEditorState) => emit('change', v),
      onSubmit: () => emit('submit'),
      onEditorReady: (editor: LexicalEditor | null) => {
        editorInstance = editor
        emit('editorReady', editor)
      },
      onTextChange: (text: string) => emit('textChange', text),
    })

    onMounted(() => {
      if (props.agentEnabled || !containerRef.value) return

      const uiStore = useUIStore()
      const resolveTheme = () =>
        props.theme ?? (uiStore.isDark ? 'dark' : 'light')

      handle = mountRichEditor(containerRef.value, buildOptions(resolveTheme()))

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
        () => handle?.update(buildOptions(resolveTheme())),
      )
    })

    onBeforeUnmount(() => {
      handle?.unmount()
      handle = null
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
          metaFieldsSchema={props.metaFieldsSchema}
          getMetaFields={props.getMetaFields}
          onMetaFieldsUpdate={props.onMetaFieldsUpdate}
          onChange={(v: SerializedEditorState) => emit('change', v)}
          onSubmit={() => emit('submit')}
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
