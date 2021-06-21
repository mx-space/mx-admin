import { defineComponent } from 'vue'
import { NInput, NSpace } from 'naive-ui'
import { PropType, ref, watch } from 'vue'

export const EditColumn = defineComponent({
  props: {
    initialValue: {
      type: String,
      required: true,
    },
    onSubmit: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    placeholder: {
      type: String,
    },
  },
  setup(props) {
    const value = ref(props.initialValue)
    watch(
      () => props.initialValue,
      (n) => {
        value.value = n
      },
    )

    const isEdit = ref(false)
    const inputRef = ref<HTMLInputElement>()

    watch(
      () => isEdit.value,
      (n) => {
        if (n) {
          requestAnimationFrame(() => {
            inputRef.value?.focus()
          })
        }
      },
    )
    const handleSubmit = () => {
      props.onSubmit(value.value)
      isEdit.value = false
    }
    return () => (
      <>
        {isEdit.value ? (
          <NSpace align="center" wrap={false}>
            <NInput
              onKeydown={(e) => {
                if (e.key == 'Enter') {
                  handleSubmit()
                }
              }}
              class="w-3/4"
              value={value.value}
              placeholder={props.placeholder ?? props.initialValue}
              size="tiny"
              autofocus
              ref={inputRef}
              onBlur={() => {
                isEdit.value = false
              }}
              onInput={(e) => {
                value.value = e
              }}
            ></NInput>
          </NSpace>
        ) : (
          <button
            class="w-full text-left"
            onClick={() => {
              isEdit.value = true
            }}
          >
            {props.initialValue}&nbsp;
          </button>
        )}
      </>
    )
  },
})
