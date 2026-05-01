import {
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import type { PropType } from 'vue'

export const InlineEditableText = defineComponent({
  name: 'InlineEditableText',
  props: {
    value: {
      type: String,
      required: true,
    },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    prefix: {
      type: String,
      default: '',
    },
    suffix: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'slug',
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const isEditing = ref(false)
    const editValue = ref('')
    const inputRef = ref<HTMLInputElement>()
    const containerRef = ref<HTMLElement>()

    const enterEditMode = () => {
      if (!props.editable) return
      editValue.value = props.value
      isEditing.value = true
      nextTick(() => {
        inputRef.value?.focus()
        inputRef.value?.select()
      })
    }

    const confirmEdit = () => {
      props.onChange(editValue.value)
      isEditing.value = false
    }

    const cancelEdit = () => {
      isEditing.value = false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        confirmEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelEdit()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isEditing.value &&
        containerRef.value &&
        !containerRef.value.contains(e.target as Node)
      ) {
        confirmEdit()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    // Update editValue when value changes externally
    watch(
      () => props.value,
      (newVal) => {
        if (!isEditing.value) {
          editValue.value = newVal
        }
      },
    )

    return () => (
      <span
        ref={containerRef}
        class="inline-flex items-center text-sm text-neutral-500"
      >
        {props.prefix && <span class="select-none">{props.prefix}</span>}

        {isEditing.value ? (
          <input
            ref={inputRef}
            value={editValue.value}
            onInput={(e) => {
              editValue.value = (e.target as HTMLInputElement).value
            }}
            onKeydown={handleKeyDown}
            onBlur={confirmEdit}
            class={[
              'bg-transparent outline-none',
              'border-b border-neutral-300 dark:border-neutral-600',
              'text-neutral-700 dark:text-neutral-300',
              'min-w-[60px] px-0.5',
              'focus:border-neutral-500 dark:focus:border-neutral-400',
            ]}
            style={{
              width: `${Math.max(editValue.value.length, 4) * 8 + 16}px`,
            }}
          />
        ) : (
          <span
            onClick={enterEditMode}
            class={[
              'cursor-text',
              '-mx-1 rounded px-1 py-0.5',
              'transition-colors duration-150',
              props.editable && [
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'hover:text-neutral-700 dark:hover:text-neutral-300',
              ],
              !props.value && 'text-neutral-400 dark:text-neutral-600',
            ]}
          >
            {props.value || props.placeholder}
          </span>
        )}

        {props.suffix && <span class="select-none">{props.suffix}</span>}
      </span>
    )
  },
})
