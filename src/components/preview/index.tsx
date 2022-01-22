export const ArticlePreview = defineComponent({
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <iframe src={props.url} class="max-w-full w-[60ch] h-[60vh]"></iframe>
    )
  },
})
