import { FunctionCodeEditor } from 'components/function-editor'
import { usePropsValueToRef } from 'hooks/use-async-monaco'
import type { PropType } from 'vue'

export const CodeEditorForSnippet = defineComponent({
  props: {
    onSave: {
      type: Function as PropType<() => any>,
    },

    value: {
      type: String,
      required: true,
    },
    onChange: {
      type: Function as PropType<(str: string) => void>,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const value = usePropsValueToRef(props)

    const editorRef = ref()

    watch(
      () => value.value,
      () => {
        if (!editorRef.value) {
          return
        }
        if (editorRef.value.loaded) {
          props.onChange?.(value.value)
        }
      },
    )

    return () => (
      <div class={'h-full w-full relative'}>
        <FunctionCodeEditor
          ref={editorRef}
          value={value}
          onSave={props.onSave}
          language={props.language}
        />
      </div>
    )
  },
})
