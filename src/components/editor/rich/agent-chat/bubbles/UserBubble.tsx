import { defineComponent } from 'vue'

export const UserBubble = defineComponent({
  name: 'UserBubble',
  props: {
    content: { type: String, required: true },
  },
  setup(props) {
    return () => (
      <div class="max-w-[82%] self-end rounded-[18px_18px_6px_18px] bg-neutral-800 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:bg-neutral-200 dark:text-neutral-900">
        {props.content}
      </div>
    )
  },
})
