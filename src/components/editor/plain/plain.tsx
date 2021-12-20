import { useSaveConfirm } from 'hooks/use-save-confirm'
import { NInput } from 'naive-ui'
import { defineComponent, PropType, ref, toRaw, watch } from 'vue'
import { editorBaseProps } from '../universal/props'

export const PlainEditor = defineComponent({
  props: {
    ...editorBaseProps,
    wrapperProps: {
      type: Object as PropType<JSX.IntrinsicElements['div']>,
      required: false,
    },
    // inputProps: {
    //   type: Object as PropType<ElementAttrs<HTMLAttributes>>,
    //   required: false,
    // },
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

    return () => (
      <div {...props.wrapperProps}>
        <NInput
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
