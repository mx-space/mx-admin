/**
 * 沉浸式写作编辑器
 * 整合 Title、Slug/Subtitle 和 CodeMirror 编辑器
 * Title 和 Slug 随编辑器内容一起滚动
 */

import { Settings as SettingsIcon } from 'lucide-vue-next'
import { NCard, NElement, NForm, NModal } from 'naive-ui'
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { PropType, VNode } from 'vue'
import type { EditorRef } from '../universal/types'

import { FabButton } from '~/components/button/rounded-button'
import { GhostInput } from '~/components/input/ghost-input'
import { useMountAndUnmount } from '~/hooks/use-lifecycle'
import { useLayout } from '~/layouts/content'

import { CodemirrorEditor } from '../codemirror/codemirror'
import { editorBaseProps } from '../universal/props'
import { useEditorConfig } from '../universal/use-editor-setting'

import './index.css'

export const WriteEditor = defineComponent({
  name: 'WriteEditor',
  props: {
    ...editorBaseProps,
    loading: {
      type: Boolean,
      required: true,
    },
    // Title
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
    // 副标题区域插槽（Slug、Subtitle 等）
    subtitleSlot: {
      type: [Object, Function] as PropType<VNode | (() => VNode)>,
    },
    // 自动聚焦目标: 'title' | 'content' | false
    autoFocus: {
      type: [String, Boolean] as PropType<'title' | 'content' | false>,
      default: false,
    },
  },
  expose: ['setValue'],
  setup(props, { expose, slots }) {
    const modalOpen = ref(false)
    const layout = useLayout()
    const scrollContainerRef = ref<HTMLElement>()

    useMountAndUnmount(() => {
      const settingButton = layout.addFloatButton(
        <FabButton
          icon={<SettingsIcon />}
          label="编辑器设置"
          onClick={() => {
            modalOpen.value = true
          }}
        />,
      )

      return () => {
        layout.removeFloatButton(settingButton)
      }
    })

    const { general, destory } = useEditorConfig()

    onUnmounted(() => {
      destory()
    })

    const Modal = defineComponent({
      setup() {
        const handleModalClose = () => {
          modalOpen.value = false
        }
        const { Panel: GeneralSetting } = general

        const handleUpdateShow = (s: boolean) => void (modalOpen.value = s)
        return () => (
          <NModal
            transformOrigin="center"
            show={modalOpen.value}
            onUpdateShow={handleUpdateShow}
          >
            <NCard
              closable
              onClose={handleModalClose}
              title="编辑器设定"
              style="max-width: 90vw;width: 500px; max-height: 65vh; overflow: auto"
              bordered={false}
            >
              <NForm labelPlacement="left" labelWidth="8rem" labelAlign="right">
                <GeneralSetting />
              </NForm>
            </NCard>
          </NModal>
        )
      },
    })

    const cmRef = ref<EditorRef>()
    const titleInputRef = ref<{ focus: () => void }>()

    expose({
      setValue: (value: string) => {
        cmRef.value?.setValue(value)
      },
      focusTitle: () => {
        titleInputRef.value?.focus()
      },
      focusContent: () => {
        cmRef.value?.focus()
      },
    })

    // 处理自动聚焦
    const handleAutoFocus = () => {
      if (!props.autoFocus) return

      nextTick(() => {
        if (props.autoFocus === 'title') {
          titleInputRef.value?.focus()
        } else if (props.autoFocus === 'content') {
          cmRef.value?.focus()
        }
      })
    }

    // 监听 loading 状态变化，在加载完成后执行聚焦
    watch(
      () => props.loading,
      (loading, prevLoading) => {
        // 从 loading 变为非 loading 时执行聚焦
        if (prevLoading && !loading) {
          handleAutoFocus()
        }
      },
    )

    // 如果初始状态就不是 loading，在 mounted 时执行聚焦
    onMounted(() => {
      if (!props.loading) {
        handleAutoFocus()
      }
    })

    // 计算副标题内容
    const subtitleContent = computed(() => {
      if (typeof props.subtitleSlot === 'function') {
        return props.subtitleSlot()
      }
      return props.subtitleSlot || slots.subtitle?.()
    })

    return () => {
      const { setting: generalSetting } = general
      const resolvedRenderMode =
        props.renderMode ?? generalSetting.renderMode ?? 'plain'
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
          class="write-editor-wrapper"
        >
          <div ref={scrollContainerRef} class="write-editor-scroll-container">
            {/* Title 区域 */}
            <div class="write-editor-header">
              <GhostInput
                ref={titleInputRef}
                value={props.title}
                onChange={props.onTitleChange}
                placeholder={props.titlePlaceholder}
              />

              {/* 副标题/Slug 区域 */}
              {subtitleContent.value && (
                <div class="write-editor-subtitle">{subtitleContent.value}</div>
              )}
            </div>

            {/* 编辑器区域 */}
            <div class="write-editor-content">
              <CodemirrorEditor
                ref={cmRef}
                text={props.text}
                onChange={props.onChange}
                unSaveConfirm={props.unSaveConfirm}
                renderMode={resolvedRenderMode}
              />
            </div>
          </div>

          <Modal />
        </NElement>
      )
    }
  },
})
