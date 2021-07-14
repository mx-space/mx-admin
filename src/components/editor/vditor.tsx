import { useSaveConfirm } from 'hooks/use-save-confirm'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import {
  defineAsyncComponent,
  defineComponent,
  onMounted,
  ref,
  toRaw,
  watch,
} from 'vue'
import { editorBaseProps } from './universal/base'

export const VditorEditor = defineAsyncComponent(() =>
  Promise.resolve(
    defineComponent({
      props: { ...editorBaseProps },
      setup(props) {
        const vRef = ref()

        let instance: Vditor
        onMounted(() => {
          const i = new Vditor(vRef.value, {
            value: props.text,
            toolbarConfig: false,
            toolbar: [],
            cache: {
              enable: false,
            },
            input(val: string) {
              props.onChange(val.trim())
            },
            blur(val: string) {
              props.onChange(val.trim())
            },
            focus(val: string) {
              props.onChange(val.trim())
            },
          })
          instance = i
        })

        let memoInitialValue: string = toRaw(props.text)

        watch(
          () => props.text,
          (n) => {
            if (!memoInitialValue && n) {
              memoInitialValue = n
            }
            // FIXME:
            if (
              instance &&
              !instance.getValue().trim().length &&
              n !== instance.getValue()
            ) {
              instance.setValue(n)
            }
          },
        )

        useSaveConfirm(props.unSaveConfirm, () => {
          return instance.getValue().trim() === memoInitialValue.trim()
        })
        return () => (
          <div ref={vRef} style={{ height: 'calc(100vh - 18.8rem)' }}></div>
        )
      },
    }),
  ),
)
