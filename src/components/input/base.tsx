import type { PropType } from 'vue'

export const inputBaseProps = {
  type: {
    type: String,
  },
  value: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
  },
  onChange: {
    type: Function as PropType<(value: string) => void>,
    required: true,
  },
} as const
