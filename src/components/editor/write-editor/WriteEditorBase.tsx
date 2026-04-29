/**
 * 写作编辑器基准组件
 * 提供 Title、Subtitle slot、字体设置、滚动容器
 * 具体编辑器内容由 default slot 传入
 */
import { FileCode2, Pencil } from 'lucide-vue-next'
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
import { SplitPanel } from '~/components/ui/SplitPanel'

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
    agentVisible: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const scrollContainerRef = ref<HTMLElement>()
    const agentScrollRootRef = ref<HTMLElement>()
    const { general, destory } = useEditorConfig()
    const titleInputRef = ref<{ focus: () => void }>()
    const stickyDetectorRef = ref<HTMLElement>()
    const isToolbarStuck = ref(false)

    const findClosestScrollableAncestor = (el: HTMLElement): Element | null => {
      let current = el.parentElement

      while (current) {
        const styles = window.getComputedStyle(current)
        const overflowY = styles.overflowY
        const overflow = styles.overflow
        const canScroll =
          overflowY === 'auto' ||
          overflowY === 'scroll' ||
          overflow === 'auto' ||
          overflow === 'scroll'

        if (canScroll) {
          return current
        }

        current = current.parentElement
      }

      return null
    }

    let stickyObserver: IntersectionObserver | null = null
    const setupStickyObserver = () => {
      const el = stickyDetectorRef.value
      if (!el) return

      stickyObserver?.disconnect()

      const scrollRoot =
        (props.agentVisible ? agentScrollRootRef.value : null) ||
        findClosestScrollableAncestor(el) ||
        (el.closest('.n-scrollbar-container') as Element | null)
      stickyObserver = new IntersectionObserver(
        ([entry]) => {
          isToolbarStuck.value = !entry.isIntersecting
        },
        { root: scrollRoot, threshold: 0 },
      )
      stickyObserver.observe(el)
    }

    onMounted(() => {
      nextTick(setupStickyObserver)
    })

    onUnmounted(() => {
      stickyObserver?.disconnect()
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

    watch(
      () => props.agentVisible,
      () => {
        nextTick(setupStickyObserver)
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

    const isMarkdownWysiwygMode = computed(
      () => general.setting.renderMode === 'wysiwyg',
    )

    const canSwitchEditorType = computed(
      () => !props.hasContent && !!props.onContentFormatChange,
    )
    const canSwitchMarkdownRenderMode = computed(
      () => props.hasContent && !isRichMode.value,
    )

    const handleToggleEditorType = () => {
      if (!props.onContentFormatChange) return
      props.onContentFormatChange(isRichMode.value ? 'markdown' : 'lexical')
    }

    const handleToggleMarkdownRenderMode = () => {
      general.setting.renderMode = isMarkdownWysiwygMode.value
        ? 'plain'
        : 'wysiwyg'
    }

    const agentCollapsed = ref(false)

    const renderScrollContainer = () => (
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

            {canSwitchEditorType.value && (
              <NTooltip>
                {{
                  trigger: () => (
                    <button
                      class="flex-shrink-0 cursor-pointer rounded-md border border-neutral-300 p-1.5 text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-800 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200"
                      onClick={handleToggleEditorType}
                      aria-label={
                        isRichMode.value
                          ? '切换到 Markdown 编辑器'
                          : '切换到 Rich 编辑器'
                      }
                    >
                      {isRichMode.value ? (
                        <FileCode2 class="h-3.5 w-3.5" />
                      ) : (
                        <Pencil class="h-3.5 w-3.5" />
                      )}
                    </button>
                  ),
                  default: () =>
                    isRichMode.value
                      ? '切换到 Markdown 编辑器'
                      : '切换到 Rich 编辑器',
                }}
              </NTooltip>
            )}

            {canSwitchMarkdownRenderMode.value && (
              <NTooltip>
                {{
                  trigger: () => (
                    <button
                      class="flex-shrink-0 cursor-pointer rounded-md border border-neutral-300 p-1.5 text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-800 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-200"
                      onClick={handleToggleMarkdownRenderMode}
                      aria-label={
                        isMarkdownWysiwygMode.value
                          ? '切换至源代码模式'
                          : '切换至所见即所得模式'
                      }
                    >
                      {isMarkdownWysiwygMode.value ? (
                        <FileCode2 class="h-3.5 w-3.5" />
                      ) : (
                        <Pencil class="h-3.5 w-3.5" />
                      )}
                    </button>
                  ),
                  default: () =>
                    isMarkdownWysiwygMode.value
                      ? '切换至源代码模式'
                      : '切换至所见即所得模式',
                }}
              </NTooltip>
            )}
          </div>

          {subtitleContent.value && (
            <div class="write-editor-subtitle">{subtitleContent.value}</div>
          )}
        </div>

        <div ref={stickyDetectorRef} class="h-0 w-full" aria-hidden />

        <div
          class="write-editor-content"
          onClick={(e: MouseEvent) => {
            // 仅当点击落于 wrapper 自身（如 padding-bottom 空白区）时聚焦
            // 防止点击编辑器内容、工具栏后焦点被强制拉至末行
            if (e.target === e.currentTarget) {
              props.onAutoFocusContent?.()
            }
          }}
        >
          {slots.default?.()}
        </div>
      </div>
    )

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
            isToolbarStuck.value && 'toolbar-stuck',
            props.agentVisible && 'agent-visible',
          ]}
        >
          {props.agentVisible ? (
            <SplitPanel
              defaultRatio={0.6}
              minLeft={400}
              minRight={300}
              collapsed={agentCollapsed.value}
              onUpdate:collapsed={(val: boolean) => {
                agentCollapsed.value = val
              }}
              storageKey="rich-editor-agent"
            >
              {{
                left: () => (
                  <div ref={agentScrollRootRef} class="h-full overflow-y-auto">
                    {renderScrollContainer()}
                  </div>
                ),
                right: () => (
                  <div
                    id="agent-chat-portal"
                    class="h-full border-l border-neutral-200 dark:border-neutral-700"
                  />
                ),
              }}
            </SplitPanel>
          ) : (
            renderScrollContainer()
          )}
        </NElement>
      )
    }
  },
})
