export const CodeHighlight = defineComponent({
  props: {
    language: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const $ref = ref<HTMLPreElement>()

    onMounted(() => {
      import('monaco-editor').then((mo) => {
        mo.editor
          .colorize(props.code, props.language, {
            tabSize: 2,
          })
          .then((res) => {
            $ref.value!.innerHTML = res
          })
      })
    })
    return () => <pre ref={$ref}>{props.code}</pre>
  },
})
