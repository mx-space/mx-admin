import { useInjector } from 'hooks/use-deps-injection'
import { useSaveConfirm } from 'hooks/use-save-confirm'
import { UIStore } from 'stores/ui'
import Vditor from 'vditor'

import 'vditor/dist/index.css'

import {
  PropType,
  Ref,
  defineComponent,
  onMounted,
  ref,
  toRaw,
  watch,
} from 'vue'

import styles from '../universal/editor.module.css'
import { editorBaseProps } from '../universal/props'

import './vditor.css'

export const VditorEditor = defineComponent({
  props: {
    ...editorBaseProps,
    innerRef: { type: Object as PropType<Ref<Vditor>> },
  },
  setup(props) {
    const vRef = ref()

    let instance: Vditor
    onMounted(() => {
      const i = new Vditor(vRef.value, {
        value: props.text,
        toolbarConfig: { hide: true },
        theme: isDark.value ? 'dark' : 'classic',
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

      if (props.innerRef) {
        props.innerRef.value = instance
      }
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

    const { isDark } = useInjector(UIStore)
    watch(
      () => isDark.value,
      (isDark) => {
        if (isDark) {
          instance.setTheme('dark')
        } else {
          instance.setTheme('classic')
        }
      },
    )
    return () => <div ref={vRef} class={styles['editor']}></div>
  },
})
