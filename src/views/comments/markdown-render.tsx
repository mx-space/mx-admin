import { marked } from 'marked'
import xss from 'xss'

marked.use({
  renderer: {
    html(text: string) {
      return xss(text)
    },
  },
})
const render = (text: string) =>
  marked.parse(text, {
    gfm: true,
  })

export const CommentMarkdownRender = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => <div v-html={render(props.text)} />
  },
})
