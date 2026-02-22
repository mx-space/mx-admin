import { computed, defineComponent } from 'vue'
import type { ContentFormat } from '~/shared/types/base'
import type { SerializedEditorState } from 'lexical'
import type { PropType, VNode } from 'vue'

import { RichEditor } from '../rich/RichEditor'
import { WriteEditorBase } from './WriteEditorBase'

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
    onTextChange: {
      type: Function as PropType<(value: string) => void>,
    },
    saveConfirmFn: {
      type: Function as PropType<() => boolean>,
    },
  },
  setup(props) {
    const hasContent = computed(() => !!props.richContent)

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
      >
        <RichEditor
          class="h-full w-full"
          initialValue={props.richContent}
          variant="article"
          autoFocus={props.autoFocus === 'content'}
          onChange={(value: SerializedEditorState) => {
            props.onRichContentChange?.(value)
          }}
          onTextChange={(text: string) => {
            props.onTextChange?.(text)
          }}
        />
      </WriteEditorBase>
    )
  },
})
