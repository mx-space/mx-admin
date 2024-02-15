export const ArticlePreview = defineComponent({
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <iframe src={props.url} class="h-[60vh] w-[60ch] max-w-full"></iframe>
    )
  },
})
