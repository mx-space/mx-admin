import { GitCompare } from 'lucide-vue-next'
import { defineComponent } from 'vue'

export const DraftEmptyState = defineComponent({
  name: 'DraftEmptyState',
  setup() {
    return () => (
      <div class="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div class="flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <GitCompare class="size-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <div>
          <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            选择一个草稿查看版本历史
          </p>
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            点击左侧草稿，在这里对比不同版本的差异
          </p>
        </div>
      </div>
    )
  },
})
