import { render } from 'ejs'

export const EJSRender = defineComponent({
  props: {
    template: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="h-full overflow-auto  bg-white">
        <div innerHTML={render(props.template, props.data)}></div>
      </div>
    )
  },
})
