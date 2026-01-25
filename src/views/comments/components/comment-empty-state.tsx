import { MessageCircle as MessageCircleIcon } from 'lucide-vue-next'
import { defineComponent } from 'vue'

export const CommentEmptyState = defineComponent({
  name: 'CommentEmptyState',
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center text-center">
        <MessageCircleIcon class="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-700" />
        <p class="text-neutral-500">选择一条评论查看详情</p>
      </div>
    )
  },
})
