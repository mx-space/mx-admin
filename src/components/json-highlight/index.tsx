import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import { defineComponent, onMounted, ref, watch } from 'vue'

import 'highlight.js/styles/atom-one-dark.css'

hljs.registerLanguage('json', json)

export const JSONHighlight = defineComponent({
  props: {
    code: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const $ref = ref<HTMLElement>()

    const highlight = () => {
      const result = hljs.highlight('json', props.code)
      if (!$ref.value) return

      $ref.value.innerHTML = result.value
    }
    onMounted(() => {
      highlight()
    })
    watch(
      () => props.code,
      () => {
        highlight()
      },
    )

    return () => {
      return (
        <pre
          class={'bg-dark-800 overflow-auto rounded-xl p-4'}
          style={{
            color: '#bbb',
          }}
          ref={$ref}
        />
      )
    }
  },
})
