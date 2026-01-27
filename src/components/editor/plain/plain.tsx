import { NInput } from 'naive-ui'
import { defineComponent, ref, toRaw, watch } from 'vue'
import type { HTMLAttributes, PropType } from 'vue'

import { useSaveConfirm } from '~/hooks/use-save-confirm'

import { editorBaseProps } from '../universal/props'

export const PlainEditor = defineComponent({
  props: {
    ...editorBaseProps,
    wrapperProps: {
      type: Object as PropType<HTMLAttributes>,
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

    useSaveConfirm(
      props.unSaveConfirm,
      () => props.saveConfirmFn?.() ?? memoInitialValue === props.text,
    )

    return () => (
      <div {...props.wrapperProps}>
        <NInput
          ref={textRef}
          type="textarea"
          onInput={(e) => void props.onChange(e)}
          value={props.text}
          class="h-full"
        />
      </div>
    )
  },
})
