import { NInput } from 'naive-ui'
import { defineComponent } from 'vue'
import type { InputProps } from 'naive-ui'
import type { PropType } from 'vue'

const borderlessThemeOverrides: InputProps['themeOverrides'] = {
  border: 'none',
  borderHover: 'none',
  borderFocus: 'none',
  boxShadowFocus: 'none',
  color: 'transparent',
  colorFocus: 'transparent',
}

export const BorderlessInput = defineComponent({
  name: 'BorderlessInput',
  props: {
    value: { type: String, default: '' },
    onUpdateValue: {
      type: Function as PropType<(value: string) => void>,
    },
    placeholder: { type: String },
    clearable: { type: Boolean, default: false },
    inputProps: { type: Object as PropType<Record<string, unknown>> },
  },
  setup(props, { slots }) {
    return () => (
      <NInput
        value={props.value}
        onUpdateValue={props.onUpdateValue}
        placeholder={props.placeholder}
        clearable={props.clearable}
        themeOverrides={borderlessThemeOverrides}
        inputProps={props.inputProps}
      >
        {slots}
      </NInput>
    )
  },
})
