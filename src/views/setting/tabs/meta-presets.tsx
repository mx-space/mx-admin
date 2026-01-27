/**
 * Meta Presets Management Tab
 * Meta 预设字段管理 - 设置页 Tab
 */
import { ListPlus as ListPlusIcon, Plus as PlusIcon } from 'lucide-vue-next'
import { NButton } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import type { MetaPresetField } from '~/models/meta-preset'
import type { PropType } from 'vue'

import { useQueryClient } from '@tanstack/vue-query'

import { queryKeys } from '~/hooks/queries/keys'
import {
  useDeleteMetaPresetMutation,
  useMetaPresetsQuery,
  useUpdateMetaPresetMutation,
  useUpdateMetaPresetOrderMutation,
} from '~/hooks/queries/use-meta-presets'
import { SettingsSection } from '~/layouts/settings-layout'

import { MetaPresetCard } from './components/meta-preset-card'
import { MetaPresetModal } from './components/meta-preset-modal'

export const TabMetaPresets = defineComponent({
  name: 'TabMetaPresets',
  setup() {
    const queryClient = useQueryClient()
    const { data: presets, isLoading } = useMetaPresetsQuery()
    const deleteMutation = useDeleteMetaPresetMutation()
    const updateMutation = useUpdateMetaPresetMutation()
    const updateOrderMutation = useUpdateMetaPresetOrderMutation()

    const showModal = ref(false)
    const editId = ref('')

    const handleAdd = () => {
      editId.value = ''
      showModal.value = true
    }

    const handleEdit = (id: string) => {
      editId.value = id
      showModal.value = true
    }

    const handleDelete = (id: string) => {
      deleteMutation.mutate(id)
    }

    const handleToggleEnabled = (preset: MetaPresetField) => {
      updateMutation.mutate({
        id: preset.id,
        data: { enabled: !preset.enabled },
      })
    }

    const handleCloseModal = () => {
      showModal.value = false
      editId.value = ''
    }

    const handleSubmit = () => {
      handleCloseModal()
      queryClient.invalidateQueries({ queryKey: queryKeys.metaPresets.all })
    }

    const draggedIndex = ref<number | null>(null)

    const handleDragStart = (index: number) => {
      draggedIndex.value = index
    }

    const handleDragOver = (e: DragEvent, index: number) => {
      e.preventDefault()
      if (draggedIndex.value === null || draggedIndex.value === index) return
    }

    const handleDrop = (e: DragEvent, dropIndex: number) => {
      e.preventDefault()
      if (draggedIndex.value === null || !presets.value) return

      const items = [...presets.value]
      const [draggedItem] = items.splice(draggedIndex.value, 1)
      items.splice(dropIndex, 0, draggedItem)

      const ids = items.map((item) => item.id)
      updateOrderMutation.mutate(ids)

      draggedIndex.value = null
    }

    const handleDragEnd = () => {
      draggedIndex.value = null
    }

    return () => (
      <div class="space-y-8">
        <SettingsSection
          title="Meta 预设字段"
          description="配置可复用的自定义 meta 字段（如音乐、电影、书籍等元数据模板）"
          icon={ListPlusIcon}
          v-slots={{
            actions: () => (
              <NButton
                type="primary"
                size="small"
                secondary
                onClick={handleAdd}
              >
                <PlusIcon class="mr-1 size-4" />
                新增预设
              </NButton>
            ),
          }}
        >
          {isLoading.value ? (
            <div class="p-4">
              <MetaPresetSkeleton />
            </div>
          ) : !presets.value || presets.value.length === 0 ? (
            <div class="p-4">
              <MetaPresetEmptyState onAdd={handleAdd} />
            </div>
          ) : (
            <div>
              {presets.value.map((preset, index) => (
                <div
                  key={preset.id}
                  draggable={!preset.isBuiltin}
                  onDragstart={() => handleDragStart(index)}
                  onDragover={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragend={handleDragEnd}
                  class={[
                    'transition-all',
                    draggedIndex.value === index && 'opacity-50',
                  ]}
                >
                  <MetaPresetCard
                    preset={preset}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleEnabled={handleToggleEnabled}
                  />
                </div>
              ))}
            </div>
          )}
        </SettingsSection>

        {/* Modal */}
        <MetaPresetModal
          show={showModal.value}
          id={editId.value}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      </div>
    )
  },
})

/**
 * Empty State
 */
const MetaPresetEmptyState = defineComponent({
  props: {
    onAdd: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="mb-4 flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <ListPlusIcon class="size-7 text-neutral-400" aria-hidden="true" />
        </div>
        <h3 class="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          暂无预设字段
        </h3>
        <p class="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          创建预设字段来快速配置文章和笔记的元数据
        </p>
        <NButton type="primary" size="small" onClick={props.onAdd}>
          创建第一个预设
        </NButton>
      </div>
    )
  },
})

/**
 * Loading Skeleton
 */
const MetaPresetSkeleton = defineComponent({
  setup() {
    return () => (
      <div class="animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            class="flex items-center gap-4 border-b border-neutral-100 py-3 last:border-b-0 dark:border-neutral-800"
          >
            <div class="size-5 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div class="flex-1">
              <div class="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div class="mt-2 h-3 w-48 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div class="flex gap-2">
              <div class="h-6 w-14 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div class="h-6 w-14 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    )
  },
})
