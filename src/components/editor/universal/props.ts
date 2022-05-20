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

  unSaveConfirm: {
    type: Boolean,
    default: true,
  },
} as const
