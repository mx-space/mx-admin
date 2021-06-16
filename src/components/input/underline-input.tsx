import { defineComponent } from 'vue'
import { inputBaseProps } from './base'
import styles from './underline.module.css'

export const UnderlineInput = defineComponent({
  props: { ...inputBaseProps },
  setup(props) {
    return () => (
      <div class={styles['root']}>
        <input
          class="absolute w-full"
          type={props.type ?? 'text'}
          value={props.value}
          placeholder={props.placeholder ?? ''}
          onInput={e => {
            props.onChange((e.target as any).value)
          }}
        />
        <span class="text-transparent">{props.value}&nbsp;</span>
      </div>
    )
  },
})
