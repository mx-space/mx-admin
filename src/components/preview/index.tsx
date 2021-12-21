import { getToken, RESTManager } from 'utils'
export const ArticlePreview = defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const endpoint = RESTManager.endpoint
    const path =
      endpoint +
      '/markdown/render/' +
      props.id +
      '?token=bearer%20' +
      getToken()

    return () => (
      <iframe src={path} class="max-w-full w-[60ch] h-[60vh]"></iframe>
    )
  },
})
