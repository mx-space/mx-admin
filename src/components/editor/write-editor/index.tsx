/**
 * WriteEditor facade
 * 根据 contentFormat 分发至 MarkdownWriteEditor 或 RichWriteEditor
 */
import { defineComponent } from 'vue'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type { ChatBubble } from '@haklex/rich-agent-core'
import type { ContentFormat } from '~/shared/types/base'
import type { LexicalEditor, SerializedEditorState } from 'lexical'
import type { PropType, VNode } from 'vue'
import type { MetaFieldsSchema } from '../rich/agent-chat/composables/use-meta-tools'
import type { WriteEditorVariant } from './types'

import { editorBaseProps } from '../universal/props'
import { MarkdownWriteEditor } from './MarkdownWriteEditor'
import { RichWriteEditor } from './RichWriteEditor'

export { MarkdownWriteEditor } from './MarkdownWriteEditor'
export { RichWriteEditor } from './RichWriteEditor'
export { WriteEditorBase } from './WriteEditorBase'
export type { WriteEditorVariant } from './types'
export type {
  MetaFieldDescriptor,
  MetaFieldsSchema,
} from '../rich/agent-chat/composables/use-meta-tools'

export const WriteEditor = defineComponent({
  name: 'WriteEditor',
  props: {
    ...editorBaseProps,
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
      default: 'markdown',
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
    return () => {
      if (props.contentFormat === 'lexical') {
        return (
          <RichWriteEditor
            loading={props.loading}
            title={props.title}
            onTitleChange={props.onTitleChange}
            titlePlaceholder={props.titlePlaceholder}
            subtitleSlot={props.subtitleSlot}
            autoFocus={props.autoFocus}
            contentFormat={props.contentFormat}
            onContentFormatChange={props.onContentFormatChange}
            richContent={props.richContent}
            onRichContentChange={props.onRichContentChange}
            onRichEditorReady={props.onRichEditorReady}
            onTextChange={props.onChange}
            saveConfirmFn={props.saveConfirmFn}
            variant={props.variant}
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
          />
        )
      }

      return (
        <MarkdownWriteEditor
          loading={props.loading}
          title={props.title}
          onTitleChange={props.onTitleChange}
          titlePlaceholder={props.titlePlaceholder}
          subtitleSlot={props.subtitleSlot}
          autoFocus={props.autoFocus}
          text={props.text}
          onChange={props.onChange}
          renderMode={props.renderMode}
          unSaveConfirm={props.unSaveConfirm}
          saveConfirmFn={props.saveConfirmFn}
          contentFormat={props.contentFormat}
          onContentFormatChange={props.onContentFormatChange}
        />
      )
    }
  },
})
