import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus as PlusIcon,
  Search as SearchIcon,
} from 'lucide-vue-next'
import { NInput, NScrollbar, NSpin } from 'naive-ui'
import type { PropType } from 'vue'
import type { SnippetModel } from '../../../../models/snippet'
import type { GroupWithSnippets } from '../composables/use-snippet-list'

import { SnippetCard } from './snippet-card'

export const SnippetList = defineComponent({
  name: 'SnippetList',
  props: {
    groups: {
      type: Array as PropType<GroupWithSnippets[]>,
      required: true,
    },
    selectedId: {
      type: String as PropType<string | null>,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    onSelect: {
      type: Function as PropType<(snippet: SnippetModel) => void>,
    },
    onDelete: {
      type: Function as PropType<(snippet: SnippetModel) => void>,
    },
    onToggleGroup: {
      type: Function as PropType<(reference: string) => void>,
    },
    onCreate: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props) {
    const searchQuery = ref('')

    // Filter groups and snippets based on search
    const filteredGroups = computed(() => {
      if (!searchQuery.value.trim()) {
        return props.groups
      }

      const query = searchQuery.value.toLowerCase()
      return props.groups
        .map((group) => ({
          ...group,
          snippets: group.snippets.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.comment?.toLowerCase().includes(query),
          ),
          // Force expanded when searching
          expanded: true,
        }))
        .filter(
          (group) =>
            group.snippets.length > 0 ||
            group.reference.toLowerCase().includes(query),
        )
    })

    const handleGroupClick = (reference: string) => {
      if (!searchQuery.value.trim()) {
        props.onToggleGroup?.(reference)
      }
    }

    return () => (
      <div class="flex h-full flex-col">
        {/* Header: Search + Create */}
        <div class="flex flex-shrink-0 items-center gap-2 border-b border-neutral-200 p-2 dark:border-neutral-800">
          <NInput
            v-model:value={searchQuery.value}
            placeholder="搜索…"
            clearable
            size="small"
            class="flex-1"
          >
            {{
              prefix: () => <SearchIcon class="h-3.5 w-3.5 text-neutral-400" />,
            }}
          </NInput>
          <button
            class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            onClick={() => props.onCreate?.()}
            title="新建片段"
          >
            <PlusIcon class="h-4 w-4" />
          </button>
        </div>

        {/* Group Tree */}
        <div class="min-h-0 flex-1">
          {props.loading ? (
            <div class="flex h-full items-center justify-center">
              <NSpin size="small" />
            </div>
          ) : filteredGroups.value.length === 0 ? (
            <div class="flex h-full items-center justify-center text-sm text-neutral-400">
              {searchQuery.value ? '没有匹配结果' : '暂无分组'}
            </div>
          ) : (
            <NScrollbar class="h-full">
              {filteredGroups.value.map((group) => (
                <div key={group.reference}>
                  {/* Group Header */}
                  <div
                    class={[
                      'flex cursor-pointer select-none items-center gap-1 px-2 py-1.5',
                      'text-sm text-neutral-600 dark:text-neutral-400',
                      'hover:bg-neutral-100 dark:hover:bg-neutral-800/50',
                    ]}
                    onClick={() => handleGroupClick(group.reference)}
                  >
                    {/* Chevron */}
                    <span class="flex h-4 w-4 items-center justify-center">
                      {group.expanded ? (
                        <ChevronDown class="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight class="h-3.5 w-3.5" />
                      )}
                    </span>

                    {/* Folder Icon */}
                    {group.expanded ? (
                      <FolderOpen class="h-4 w-4 text-amber-500" />
                    ) : (
                      <Folder class="h-4 w-4 text-amber-500" />
                    )}

                    {/* Group Name */}
                    <span class="flex-1 truncate font-medium">
                      {group.reference}
                    </span>

                    {/* Count Badge */}
                    <span class="rounded bg-neutral-200 px-1.5 py-0.5 text-xs dark:bg-neutral-700">
                      {group.count}
                    </span>
                  </div>

                  {/* Expanded Content */}
                  {group.expanded && (
                    <div class="pl-4">
                      {group.loading ? (
                        <div class="flex items-center justify-center py-4">
                          <NSpin size="small" />
                        </div>
                      ) : group.snippets.length === 0 ? (
                        <div class="py-2 pl-6 text-xs text-neutral-400">
                          暂无片段
                        </div>
                      ) : (
                        group.snippets.map((snippet) => (
                          <SnippetCard
                            key={snippet.id}
                            snippet={snippet}
                            selected={snippet.id === props.selectedId}
                            onSelect={props.onSelect}
                            onDelete={props.onDelete}
                            compact
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </NScrollbar>
          )}
        </div>
      </div>
    )
  },
})
