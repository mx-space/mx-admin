import { computed, defineComponent, ref, watch } from 'vue'
import type { ContentFormat } from '~/shared/types/base'
import type { SerializedEditorState } from 'lexical'
import type { PropType, VNode } from 'vue'
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
  },
  setup(props) {
    const currentText = ref('')
    const hasContent = computed(() => currentText.value.trim().length > 0)

    const editorKey = ref(0)
    let lastEmittedJson = ''

    watch(
      () => props.richContent,
      (val) => {
        const json = val ? JSON.stringify(val) : ''
        if (json !== lastEmittedJson) {
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
      >
        <RichEditor
          key={editorKey.value}
          class="h-full w-full"
          editorStyle={editorStyleOverride}
          initialValue={props.richContent}
          variant={props.variant === 'note' ? 'note' : 'article'}
          autoFocus={props.autoFocus === 'content'}
          imageUpload={imageUpload}
          onChange={(value: SerializedEditorState) => {
            lastEmittedJson = JSON.stringify(value)
            props.onRichContentChange?.(value)
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
