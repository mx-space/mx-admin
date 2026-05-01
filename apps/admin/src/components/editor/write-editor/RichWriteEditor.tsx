import { computed, defineComponent, ref, watch } from 'vue'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type { ChatBubble } from '@haklex/rich-agent-core'
import type { ContentFormat } from '~/shared/types/base'
import type { LexicalEditor, SerializedEditorState } from 'lexical'
import type { PropType, VNode } from 'vue'
import type { MetaFieldsSchema } from '../rich/agent-chat/composables/use-meta-tools'
import type { WriteEditorVariant } from './types'

import { createThemeStyle } from '@haklex/rich-style-token'

import { filesApi } from '~/api/files'

import { RichEditor } from '../rich/RichEditor'
import { WriteEditorBase } from './WriteEditorBase'

const imageUpload = async (file: File) => {
  const result = await filesApi.upload(file, 'image')
  return { src: result.url }
}

const editorStyleOverride = createThemeStyle({
  layout: { maxWidth: '100%' },
  typography: {
    fontMono:
      '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", SFMono-Regular, ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace',
  },
})

export const RichWriteEditor = defineComponent({
  name: 'RichWriteEditor',
  props: {
    loading: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    onTitleChange: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    titlePlaceholder: {
      type: String,
      default: '输入标题...',
    },
    subtitleSlot: {
      type: [Object, Function] as PropType<VNode | (() => VNode)>,
    },
    autoFocus: {
      type: [String, Boolean] as PropType<'title' | 'content' | false>,
      default: false,
    },
    contentFormat: {
      type: String as PropType<ContentFormat>,
      default: 'lexical',
    },
    onContentFormatChange: {
      type: Function as PropType<(value: ContentFormat) => void>,
    },
    richContent: {
      type: Object as PropType<SerializedEditorState>,
    },
    onRichContentChange: {
      type: Function as PropType<(value: SerializedEditorState) => void>,
    },
    onRichEditorReady: {
      type: Function as PropType<(editor: LexicalEditor | null) => void>,
    },
    onTextChange: {
      type: Function as PropType<(value: string) => void>,
    },
    saveConfirmFn: {
      type: Function as PropType<() => boolean>,
    },
    variant: {
      type: String as PropType<WriteEditorVariant>,
      default: 'post',
    },
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
  setup(props) {
    const richEditorRef = ref<{ focus: () => void }>()
    const currentText = ref('')
    const hasContent = computed(() => currentText.value.trim().length > 0)

    const editorKey = ref(0)
    let lastEmittedJson = props.richContent
      ? JSON.stringify(props.richContent)
      : ''

    watch(
      () => props.richContent,
      (val) => {
        const json = val ? JSON.stringify(val) : ''
        if (json !== lastEmittedJson) {
          lastEmittedJson = json
          editorKey.value++
        }
      },
    )

    return () => (
      <WriteEditorBase
        loading={props.loading}
        title={props.title}
        onTitleChange={props.onTitleChange}
        titlePlaceholder={props.titlePlaceholder}
        subtitleSlot={props.subtitleSlot}
        autoFocus={props.autoFocus}
        contentFormat={props.contentFormat}
        onContentFormatChange={props.onContentFormatChange}
        hasContent={hasContent.value}
        onAutoFocusContent={() => richEditorRef.value?.focus()}
        agentVisible={props.agentVisible}
      >
        <RichEditor
          ref={richEditorRef}
          key={editorKey.value}
          class="mt-8 h-full w-full"
          editorStyle={editorStyleOverride as Record<string, string | number>}
          initialValue={props.richContent}
          variant={props.variant === 'note' ? 'note' : 'article'}
          autoFocus={props.autoFocus === 'content'}
          imageUpload={imageUpload}
          agentEnabled={props.agentEnabled}
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
          onChange={(value: SerializedEditorState) => {
            lastEmittedJson = JSON.stringify(value)
            props.onRichContentChange?.(value)
          }}
          onEditorReady={(editor: LexicalEditor | null) => {
            props.onRichEditorReady?.(editor)
          }}
          onTextChange={(text: string) => {
            currentText.value = text
            props.onTextChange?.(text)
          }}
        />
      </WriteEditorBase>
    )
  },
})
