import { computed, defineComponent } from 'vue'

import { RichDiffBridge } from '~/components/editor/rich/RichDiffBridge'

export const RichDiffPanel = defineComponent({
  name: 'RichDiffPanel',
  props: {
    oldContent: { type: String, required: true },
    newContent: { type: String, required: true },
  },
  setup(props) {
    const safeParse = (json: string) => {
      try {
        return JSON.parse(json)
      } catch {
        return null
      }
    }

    const oldValue = computed(() => safeParse(props.oldContent))
    const newValue = computed(() => safeParse(props.newContent))

    return () => {
      if (!oldValue.value || !newValue.value) {
        return (
          <div class="flex h-full items-center justify-center text-sm text-neutral-500">
            富文本内容解析失败
          </div>
        )
      }
      return (
        <RichDiffBridge
          oldValue={oldValue.value}
          newValue={newValue.value}
          variant="comment"
          className="!rounded-none !border-0"
        />
      )
    }
  },
})
