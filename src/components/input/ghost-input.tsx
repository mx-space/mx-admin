import { defineComponent, onMounted, ref } from 'vue'

import { inputBaseProps } from './base'

export const GhostInput = defineComponent({
  name: 'GhostInput',
  props: {
    ...inputBaseProps,
  },
  emits: ['compositionend', 'compositionstart'],
  setup(props, { emit }) {
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

    return () => (
      <input
        ref={inputRef}
        type={props.type ?? 'text'}
        value={props.value}
        placeholder={props.placeholder}
        onInput={(e) => props.onChange((e.target as any).value)}
        class={[
          'w-full bg-transparent outline-none',
          'text-2xl font-semibold',
          'text-neutral-900 dark:text-neutral-100',
          'rounded-lg border border-transparent px-2 py-3',
          'transition-all duration-200',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          'hover:border-neutral-200/50 dark:hover:border-neutral-700/50',
          'focus:border-neutral-300 dark:focus:border-neutral-600',
          'focus:ring-1 focus:ring-neutral-200/50 dark:focus:ring-neutral-700/50',
        ]}
      />
    )
  },
})
