import { computed, defineComponent, ref } from 'vue'
import type { ContentFormat } from '~/shared/types/base'
import type { PropType, VNode } from 'vue'

import { CodemirrorEditor } from '../codemirror/codemirror'
import { useEditorStore } from '../codemirror/editor-store'
import { ImageDropZone } from '../codemirror/ImageDropZone'
import { editorBaseProps } from '../universal/props'
import { useEditorConfig } from '../universal/use-editor-setting'
import { WriteEditorBase } from './WriteEditorBase'

export const MarkdownWriteEditor = defineComponent({
  name: 'MarkdownWriteEditor',
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
  },
  expose: ['setValue'],
  setup(props, { expose }) {
    const editorStore = useEditorStore()
    const { general } = useEditorConfig()
    const titleInputRef = ref<{ focus: () => void }>()

    const hasContent = computed(() => !!props.text)

    expose({
      setValue: (value: string) => {
        editorStore.setValue(value)
      },
      focusTitle: () => {
        titleInputRef.value?.focus()
      },
      focusContent: () => {
        editorStore.focus()
      },
    })

    return () => {
      const { setting: generalSetting } = general
      const resolvedRenderMode =
        props.renderMode ?? generalSetting.renderMode ?? 'plain'

      return (
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
          onArrowDownFromTitle={() => editorStore.focus()}
          onAutoFocusContent={() => editorStore.focus()}
        >
          <CodemirrorEditor
            text={props.text}
            onChange={props.onChange}
            unSaveConfirm={props.unSaveConfirm}
            saveConfirmFn={props.saveConfirmFn}
            renderMode={resolvedRenderMode}
            onArrowUpAtFirstLine={() => titleInputRef.value?.focus()}
          />
          <ImageDropZone />
        </WriteEditorBase>
      )
    }
  },
})
