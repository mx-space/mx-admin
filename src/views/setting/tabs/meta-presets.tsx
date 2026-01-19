/**
 * Meta Presets Management Tab
 * Meta 预设字段管理 - 设置页 Tab
 */
import { ListPlus as ListPlusIcon, Plus as PlusIcon } from 'lucide-vue-next'
import { NButton, NCard } from 'naive-ui'
import { defineComponent, ref } from 'vue'
import type { MetaPresetField } from '~/models/meta-preset'

import { useQueryClient } from '@tanstack/vue-query'

import { queryKeys } from '~/hooks/queries/keys'
import {
  useDeleteMetaPresetMutation,
  useMetaPresetsQuery,
  useUpdateMetaPresetMutation,
  useUpdateMetaPresetOrderMutation,
} from '~/hooks/queries/use-meta-presets'

import styles from '../index.module.css'
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

    // Modal state
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

    // 拖拽排序
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

      // 更新排序
      const ids = items.map((item) => item.id)
      updateOrderMutation.mutate(ids)

      draggedIndex.value = null
    }

    const handleDragEnd = () => {
      draggedIndex.value = null
    }

    return () => (
      <div class={styles.tabContent}>
        <NCard size="small">
          {/* Header */}
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                <ListPlusIcon
                  class="mr-2 inline-block size-5"
                  aria-hidden="true"
                />
                Meta 预设字段
              </h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                配置可复用的自定义 meta 字段（如音乐、电影、书籍等元数据模板）
              </p>
            </div>
            <NButton type="primary" onClick={handleAdd}>
              <PlusIcon class="mr-1 size-4" />
              新增预设
            </NButton>
          </div>

          {/* Content */}
          {isLoading.value ? (
            <MetaPresetSkeleton />
          ) : !presets.value || presets.value.length === 0 ? (
            <MetaPresetEmptyState onAdd={handleAdd} />
          ) : (
            <div class="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
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
        </NCard>

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
      <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
        <div class="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <ListPlusIcon class="size-8 text-neutral-400" aria-hidden="true" />
        </div>
        <h3 class="mb-1 text-lg font-medium text-neutral-900 dark:text-neutral-100">
          暂无预设字段
        </h3>
        <p class="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          创建预设字段来快速配置文章和笔记的元数据
        </p>
        <NButton type="primary" onClick={props.onAdd}>
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
      <div class="animate-pulse overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            class="flex items-center gap-4 border-b border-neutral-200 px-4 py-4 last:border-b-0 dark:border-neutral-800"
          >
            <div class="size-5 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div class="flex-1">
              <div class="h-5 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div class="mt-2 h-4 w-48 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div class="flex gap-2">
              <div class="h-6 w-16 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div class="h-6 w-16 rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    )
  },
})
