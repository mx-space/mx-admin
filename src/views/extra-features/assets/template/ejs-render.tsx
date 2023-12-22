import { render } from 'ejs'
import type { PropType } from 'vue'

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
    onError: {
      type: Function as PropType<(err: Error) => void>,
    },
  },
  setup(props) {
    const html = ref('')
    watch(
      () => props.template,
      async () => {
        html.value = await render(props.template, props.data, {
          async: true,
        }).catch((err) => {
          props.onError?.(err)

          console.error(err)

          return html.value
        })
      },
      { immediate: true },
    )

    return () => (
      <div class="h-full overflow-auto  bg-white">
        <div innerHTML={html.value}></div>
      </div>
    )
  },
})
