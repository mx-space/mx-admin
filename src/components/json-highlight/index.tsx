export const JSONHighlight = defineComponent({
  props: {
    code: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const $ref = ref<HTMLElement>()

    watch(
      () => props.code,
      (code) => {
        import('monaco-editor').then((mo) => {
          mo.editor.colorize(code, 'json', { tabSize: 2 }).then(($dom) => {
            $ref.value!.innerHTML = $dom
          })
        })
      },
      {
        immediate: true,
      },
    )

    return () => {
      return <pre ref={$ref}></pre>
    }
  },
})
