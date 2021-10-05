import { useSaveConfirm } from 'hooks/use-save-confirm'
import { NInput } from 'naive-ui'
import { defineComponent, ref, toRaw, watch } from 'vue'
import { editorBaseProps } from '../universal/props'

export const PlainEditor = defineComponent({
  props: { ...editorBaseProps },
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
      <div>
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
