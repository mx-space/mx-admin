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
      <div class="flex h-full flex-col items-center justify-center text-neutral-400">
        {props.hasSnippets ? (
          <>
            <MousePointerClick class="mb-4 h-12 w-12 text-neutral-300" />
            <p class="mb-2 text-lg font-medium text-neutral-600 dark:text-neutral-300">
              选择一个片段
            </p>
            <p class="text-sm">从左侧列表选择一个片段进行编辑</p>
          </>
        ) : (
          <>
            <Code2 class="mb-4 h-12 w-12 text-neutral-300" />
            <p class="mb-2 text-lg font-medium text-neutral-600 dark:text-neutral-300">
              暂无配置片段
            </p>
            <p class="mb-4 text-sm">创建你的第一个配置片段</p>
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
