import { NButton, NInput, NSpace } from 'naive-ui'
import {
  computed,
  defineComponent,
  nextTick,
  onUnmounted,
  ref,
  Teleport,
  watch,
} from 'vue'

import { hideImagePopover, imagePopoverState } from './image-popover-state'

export const ImageEditPopover = defineComponent({
  name: 'ImageEditPopover',
  setup() {
    const altValue = ref('')
    const urlValue = ref('')
    const popoverRef = ref<HTMLElement>()
    const altInputRef = ref<InstanceType<typeof NInput>>()
    const popoverStyle = ref({ left: '0px', top: '0px' })

    // 从 data-* 属性读取数据
    const popoverData = computed(() => {
      const el = imagePopoverState.targetEl
      if (!el) return null
      return {
        alt: el.dataset.alt || '',
        url: el.dataset.url || '',
        matchStart: Number(el.dataset.matchStart),
        matchEnd: Number(el.dataset.matchEnd),
      }
    })

    // 控制 body 的 pointer-events 和滚动
    const disableBodyInteraction = () => {
      document.body.style.pointerEvents = 'none'
      document.body.style.overflow = 'hidden'
    }

    const enableBodyInteraction = () => {
      document.body.style.pointerEvents = ''
      document.body.style.overflow = ''
    }

    // 监听 state 变化，初始化表单值并控制交互
    watch(
      () => imagePopoverState.visible,
      (visible) => {
        if (visible && popoverData.value) {
          altValue.value = popoverData.value.alt
          urlValue.value = popoverData.value.url
          disableBodyInteraction()
          nextTick(() => {
            updatePosition()
            altInputRef.value?.focus()
          })
        } else {
          enableBodyInteraction()
        }
      },
    )

    // 组件卸载时确保恢复 body 交互
    onUnmounted(() => {
      enableBodyInteraction()
    })

    const updatePosition = () => {
      const el = imagePopoverState.targetEl
      if (!el || !popoverRef.value) return

      const rect = el.getBoundingClientRect()
      const popoverRect = popoverRef.value.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let left = rect.left
      let top = rect.bottom + 8

      // Horizontal adjustment
      if (left + popoverRect.width > viewportWidth - 16) {
        left = viewportWidth - popoverRect.width - 16
      }
      if (left < 16) {
        left = 16
      }

      // Vertical adjustment - show above if not enough space below
      if (top + popoverRect.height > viewportHeight - 16) {
        top = rect.top - popoverRect.height - 8
      }

      popoverStyle.value = {
        left: `${left}px`,
        top: `${top}px`,
      }
    }

    const handleSave = () => {
      const data = popoverData.value
      const view = imagePopoverState.view
      if (!data || !view) return

      const newMarkdown = `![${altValue.value}](${urlValue.value})`
      view.dispatch({
        changes: {
          from: data.matchStart,
          to: data.matchEnd,
          insert: newMarkdown,
        },
      })
      hideImagePopover()
    }

    const handleCancel = () => {
      hideImagePopover()
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') {
        handleCancel()
      }
    }

    return () => {
      if (!imagePopoverState.visible || !imagePopoverState.targetEl) {
        return null
      }

      return (
        <Teleport to=".n-config-provider>div">
          {/* 透明遮罩层 - 点击关闭 */}
          <div class="cm-image-edit-overlay" onClick={handleCancel} />
          <div
            ref={popoverRef}
            class="cm-image-edit-popover"
            style={popoverStyle.value}
            onClick={(e) => e.stopPropagation()}
            onKeydown={handleKeydown}
          >
            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-xs text-neutral-500">Alt 文本</label>
                <NInput
                  ref={altInputRef}
                  v-model:value={altValue.value}
                  placeholder="图片描述"
                  size="small"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-500">URL</label>
                <NInput
                  v-model:value={urlValue.value}
                  placeholder="图片地址"
                  size="small"
                />
              </div>
              <NSpace justify="end" size={8}>
                <NButton size="small" onClick={handleCancel}>
                  取消
                </NButton>
                <NButton size="small" type="primary" onClick={handleSave}>
                  保存
                </NButton>
              </NSpace>
            </div>
          </div>
        </Teleport>
      )
    }
  },
})
