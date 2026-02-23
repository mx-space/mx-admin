/**
 * WriteEditor facade
 * 根据 contentFormat 分发至 MarkdownWriteEditor 或 RichWriteEditor
 */
import { defineComponent } from 'vue'
import type { ContentFormat } from '~/shared/types/base'
import type { SerializedEditorState } from 'lexical'
import type { PropType, VNode } from 'vue'
import type { WriteEditorVariant } from './types'

import { editorBaseProps } from '../universal/props'
import { MarkdownWriteEditor } from './MarkdownWriteEditor'
import { RichWriteEditor } from './RichWriteEditor'

export { MarkdownWriteEditor } from './MarkdownWriteEditor'
export { RichWriteEditor } from './RichWriteEditor'
export { WriteEditorBase } from './WriteEditorBase'
export type { WriteEditorVariant } from './types'

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
    variant: {
      type: String as PropType<WriteEditorVariant>,
      default: 'post',
    },
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
            onTextChange={props.onChange}
            saveConfirmFn={props.saveConfirmFn}
            variant={props.variant}
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
