/**
 * 写作编辑器基准组件
 * 提供 Title、Subtitle slot、字体设置、滚动容器
 * 具体编辑器内容由 default slot 传入
 */
import { NElement, NTooltip } from 'naive-ui'
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import type { ContentFormat } from '~/shared/types/base'
import type { PropType, VNode } from 'vue'

import { GhostInput } from '~/components/input/ghost-input'

import { useEditorConfig } from '../universal/use-editor-setting'

import './index.css'

export const WriteEditorBase = defineComponent({
  name: 'WriteEditorBase',
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
      default: 'markdown',
    },
    onContentFormatChange: {
      type: Function as PropType<(value: ContentFormat) => void>,
    },
    hasContent: {
      type: Boolean,
      default: false,
    },
    onArrowDownFromTitle: {
      type: Function as PropType<() => void>,
    },
    onAutoFocusContent: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props, { slots }) {
    const scrollContainerRef = ref<HTMLElement>()
    const { general, destory } = useEditorConfig()
    const titleInputRef = ref<{ focus: () => void }>()

    onUnmounted(() => {
      destory()
    })

    const isRichMode = computed(() => props.contentFormat === 'lexical')

    const handleAutoFocus = () => {
      if (!props.autoFocus) return
      nextTick(() => {
        if (props.autoFocus === 'title') {
          titleInputRef.value?.focus()
        } else if (props.autoFocus === 'content') {
          props.onAutoFocusContent?.()
        }
      })
    }

    watch(
      () => props.loading,
      (loading, prevLoading) => {
        if (prevLoading && !loading) {
          handleAutoFocus()
        }
      },
    )

    onMounted(() => {
      if (!props.loading) {
        handleAutoFocus()
      }
    })

    const subtitleContent = computed(() => {
      if (typeof props.subtitleSlot === 'function') {
        return props.subtitleSlot()
      }
      return props.subtitleSlot || slots.subtitle?.()
    })

    const handleToggleFormat = () => {
      if (props.hasContent || !props.onContentFormatChange) return
      props.onContentFormatChange(isRichMode.value ? 'markdown' : 'lexical')
    }

    return () => {
      const { setting: generalSetting } = general
      return (
        <NElement
          tag="div"
          style={
            {
              '--editor-font-size': generalSetting.fontSize
                ? `${generalSetting.fontSize / 14}rem`
                : '',
              '--editor-font-family': generalSetting.fontFamily,
            } as any
          }
          class={[
            'write-editor-wrapper min-h-[100dvh]',
            isRichMode.value && 'rich-editor-mode',
          ]}
        >
          <div ref={scrollContainerRef} class="write-editor-scroll-container">
            <div class="write-editor-header">
              <div class="flex items-center gap-2">
                <GhostInput
                  ref={titleInputRef}
                  value={props.title}
                  onChange={props.onTitleChange}
                  placeholder={props.titlePlaceholder}
                  onArrowDown={() => props.onArrowDownFromTitle?.()}
                  class="flex-1"
                />

                {props.onContentFormatChange && (
                  <NTooltip>
                    {{
                      trigger: () => (
                        <button
                          class={[
                            'flex-shrink-0 rounded-md border px-2 py-1 text-xs transition-colors',
                            props.hasContent
                              ? 'cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-700 dark:text-neutral-600'
                              : 'cursor-pointer border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200',
                          ]}
                          disabled={props.hasContent}
                          onClick={handleToggleFormat}
                        >
                          {isRichMode.value ? 'Rich' : 'Markdown'}
                        </button>
                      ),
                      default: () =>
                        props.hasContent
                          ? '已有内容，无法切换编辑器'
                          : `切换至${isRichMode.value ? 'Markdown' : 'Rich'} 编辑器`,
                    }}
                  </NTooltip>
                )}
              </div>

              {subtitleContent.value && (
                <div class="write-editor-subtitle">{subtitleContent.value}</div>
              )}
            </div>

            <div class="write-editor-content">{slots.default?.()}</div>
          </div>
        </NElement>
      )
    }
  },
})
