import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'

import { useAsyncLoadMonaco } from '~/components/monaco-editor'
import { CenterSpin } from '~/components/spin'
import { usePropsValueToRef } from '~/hooks/use-props-value-to-ref'

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
