import { Code2, MousePointerClick, Plus } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

export const SnippetEmptyState = defineComponent({
  name: 'SnippetEmptyState',
  props: {
    hasSnippets: {
      type: Boolean,
      default: false,
    },
    onCreate: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props) {
    return () => (
      <div class="flex h-full flex-col items-center justify-center bg-neutral-50 text-center dark:bg-neutral-950">
        {props.hasSnippets ? (
          <>
            <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <MousePointerClick class="size-8 text-neutral-400" />
            </div>
            <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
              选择一个片段
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              从左侧列表选择一个片段进行编辑
            </p>
          </>
        ) : (
          <>
            <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Code2 class="size-8 text-neutral-400" />
            </div>
            <h3 class="mb-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
              暂无配置片段
            </h3>
            <p class="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              创建你的第一个配置片段
            </p>
            <NButton
              type="primary"
              onClick={props.onCreate}
              renderIcon={() => <Plus class="h-4 w-4" />}
            >
              新建片段
            </NButton>
          </>
        )}
      </div>
    )
  },
})
