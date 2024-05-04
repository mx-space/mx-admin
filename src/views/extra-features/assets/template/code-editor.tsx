import { CenterSpin } from '~/components/spin'
import {
  useAsyncLoadMonaco,
  usePropsValueToRef,
} from '~/hooks/use-async-monaco'
import type { PropType } from 'vue'

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

    const obj = useAsyncLoadMonaco(editorRef, value, props.onChange, {
      language: 'html',
    })

    return () => (
      <div class={'relative h-full w-full'}>
        <div ref={editorRef} class={'relative h-full w-full'} />
        {!obj.loaded.value && (
          <CenterSpin description="Monaco 体积较大耐心等待加载完成..." />
        )}
      </div>
    )
  },
})
