import { useAsyncLoadMonaco } from 'hooks/use-async-monaco'
import { NButton } from 'naive-ui'
import type { PropType } from 'vue'

const JSONEditorProps = {
  value: {
    type: String,
    required: true,
  },

  onFinish: {
    type: Function as PropType<(s: string) => void>,
    required: true,
  },
} as const
export const JSONEditor = defineComponent({
  props: JSONEditorProps,

  setup(props) {
    const htmlRef = ref<HTMLElement>()
    const refValue = ref(props.value)
    const editor = useAsyncLoadMonaco(
      htmlRef,
      refValue,
      (val) => {
        refValue.value = val
      },
      {
        language: 'json',
      },
    )
    const handleFinish = () => {
      props.onFinish(refValue.value)
    }
    return () => {
      const { Snip } = editor
      return (
        <div class="max-w-[60vw] w-[600px] max-h-[70vh] h-[500px] flex flex-col gap-2">
          <div ref={htmlRef} class="flex-shrink-0 flex-grow">
            <Snip />
          </div>

          <div class="text-right flex-shrink-0">
            <NButton round type="primary" onClick={handleFinish}>
              提交
            </NButton>
          </div>
        </div>
      )
    }
  },
})
