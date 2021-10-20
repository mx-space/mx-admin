export const CodeEditor = defineComponent({
  setup(props) {
    const editorRef = ref()
    onMounted(() => {})
    return () => (
      <>
        <div ref={editorRef}></div>
      </>
    )
  },
})
