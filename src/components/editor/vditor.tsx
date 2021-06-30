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
              props.onChange(val)
            },
            blur(val: string) {
              props.onChange(val)
            },
            focus(val: string) {
              props.onChange(val)
            },
          })
          instance = i
        })

        watch(
          () => props.text,
          (n) => {
            if (n !== instance.getValue()) {
              instance.setValue(n)
            }
          },
        )

        let memoInitialValue: string = toRaw(props.text)

        watch(
          () => props.text,
          (n) => {
            if (!memoInitialValue && n) {
              memoInitialValue = n
            }
            if (instance && n != instance.getValue()) {
              instance.setValue(n)
            }
          },
        )

        useSaveConfirm(
          props.unSaveConfirm,
          () => memoInitialValue === instance.getValue(),
        )
        return () => (
          <div ref={vRef} style={{ height: 'calc(100vh - 18.8rem)' }}></div>
        )
      },
    }),
  ),
)
