import { useSaveConfirm } from 'hooks/use-save-confirm'
import { NInput } from 'naive-ui'
import type { PropType } from 'vue'
import { defineComponent, ref, toRaw, watch } from 'vue'

import { editorBaseProps } from '../universal/props'
import { useEditorConfig } from '../universal/use-editor-setting'

export const PlainEditor = defineComponent({
  props: {
    ...editorBaseProps,
    wrapperProps: {
      type: Object as PropType<JSX.IntrinsicElements['div']>,
      required: false,
    },
  },
  setup(props) {
    const textRef = ref<HTMLTextAreaElement>()

    let memoInitialValue: string = toRaw(props.text)

    watch(
      () => props.text,
      (n) => {
        if (!memoInitialValue && n) {
          memoInitialValue = n
        }
      },
    )

    useSaveConfirm(props.unSaveConfirm, () => memoInitialValue === props.text)
    const { general } = useEditorConfig()
    const handleKeydown = (e: KeyboardEvent) => {
      const autocorrect = general.setting.autocorrect
      if (!autocorrect) {
        return
      }
      if (e.key === 'Enter') {
        import('@huacnlee/autocorrect')
          .then(({ format }) => {
            const newValue = format((e.target as HTMLInputElement).value)

            props.onChange(newValue)
          })
          .catch(() => {
            console.log('not support wasm')
          })
      }
    }
    return () => (
      <div {...props.wrapperProps}>
        <NInput
          onKeydown={handleKeydown}
          ref={textRef}
          type="textarea"
          onInput={(e) => void props.onChange(e)}
          value={props.text}
          class="h-full"
        ></NInput>
      </div>
    )
  },
})
