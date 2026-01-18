import { defineComponent, onMounted, ref } from 'vue'
import type { PropType } from 'vue'

import { inputBaseProps } from './base'

export const GhostInput = defineComponent({
  name: 'GhostInput',
  props: {
    ...inputBaseProps,
    onArrowDown: {
      type: Function as PropType<() => void>,
    },
  },
  emits: ['compositionend', 'compositionstart'],
  setup(props, { emit, expose }) {
    const inputRef = ref<HTMLInputElement>()

    onMounted(() => {
      if (!inputRef.value) {
        return
      }
      inputRef.value.addEventListener('compositionstart', () => {
        emit('compositionstart')
      })

      inputRef.value.addEventListener('compositionend', () => {
        emit('compositionend')
      })
    })

    expose({
      focus: () => {
        inputRef.value?.focus()
      },
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && props.onArrowDown) {
        e.preventDefault()
        props.onArrowDown()
      }
    }

    return () => (
      <input
        ref={inputRef}
        type={props.type ?? 'text'}
        value={props.value}
        placeholder={props.placeholder}
        onInput={(e) => props.onChange((e.target as any).value)}
        onKeydown={handleKeyDown}
        class={[
          'w-full bg-transparent outline-none',
          'text-2xl font-semibold',
          'text-neutral-900 dark:text-neutral-100',
          'rounded-lg border border-transparent px-2 py-3',

          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
        ]}
      />
    )
  },
})
