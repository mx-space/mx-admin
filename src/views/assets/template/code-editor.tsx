import { CenterSpin } from 'components/spin'
import { useAsyncLoadMonaco, usePropsValueToRef } from 'hooks/use-async-monaco'
import { PropType } from 'vue'

export const CodeEditorForTemplateEditing = defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
    onChange: {
      type: Function as PropType<(str: string) => void>,
      required: true,
    },
  },
  setup(props) {
    const editorRef = ref()
    const value = usePropsValueToRef(props)

    useAsyncLoadMonaco(editorRef, value, props.onChange, {
      language: 'html',
    })

    return () => (
      <div ref={editorRef} class={'h-full w-full relative'}>
        <CenterSpin description="Monaco 体积较大耐心等待加载完成..." />
      </div>
    )
  },
})
