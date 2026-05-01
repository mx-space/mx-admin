import type { PropType } from 'vue'

export const editorBaseProps = {
  text: {
    type: String,
    required: true,
  },
  onChange: {
    type: Function as PropType<(value: string) => void>,
    required: true,
  },

  renderMode: {
    type: String as PropType<'plain' | 'wysiwyg'>,
    required: false,
  },

  unSaveConfirm: {
    type: Boolean,
    default: true,
  },

  /** 自定义保存确认比较函数，返回 true 表示已同步（无需提示），返回 false 表示有未保存更改 */
  saveConfirmFn: {
    type: Function as PropType<() => boolean>,
    required: false,
  },
} as const
