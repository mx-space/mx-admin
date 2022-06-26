import type { PropType } from 'vue'

export const If = defineComponent({
  props: {
    condition: {
      type: [Boolean, Function] as PropType<
        Boolean | ((...args: any[]) => boolean)
      >,
      required: true,
    },
  },
  setup(props, { slots }) {
    const render = () => {
      const condition =
        typeof props.condition === 'function'
          ? props.condition()
          : props.condition
      if (condition) {
        return slots.default?.()
      }
    }
    return () => render()
  },
})
