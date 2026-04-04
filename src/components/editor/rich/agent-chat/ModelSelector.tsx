import { ChevronDown } from 'lucide-vue-next'
import { NPopselect } from 'naive-ui'
import { computed, defineComponent } from 'vue'
import type { PropType } from 'vue'

export interface ProviderGroup {
  id: string
  name: string
  providerType: 'claude' | 'openai-compatible'
  models: { id: string; displayName: string }[]
}

export interface SelectedModel {
  modelId: string
  providerId: string
  providerType: 'claude' | 'openai-compatible'
}

export const ModelSelector = defineComponent({
  name: 'ModelSelector',
  props: {
    providerGroups: {
      type: Array as PropType<ProviderGroup[]>,
      required: true,
    },
    selectedModel: {
      type: Object as PropType<SelectedModel | null>,
      default: null,
    },
  },
  emits: ['selectModel'],
  setup(props, { emit }) {
    const options = computed(() =>
      props.providerGroups.map((group) => ({
        type: 'group' as const,
        label: group.name,
        key: group.id,
        children: group.models.map((m) => ({
          label: m.displayName,
          value: `${group.id}::${m.id}`,
        })),
      })),
    )

    const selectedValue = computed(() =>
      props.selectedModel
        ? `${props.selectedModel.providerId}::${props.selectedModel.modelId}`
        : null,
    )

    const selectedLabel = computed(() => {
      if (!props.selectedModel) return 'Select model'
      for (const g of props.providerGroups) {
        const m = g.models.find((m) => m.id === props.selectedModel!.modelId)
        if (m) return m.displayName
      }
      return props.selectedModel.modelId
    })

    function handleUpdate(value: string) {
      const [providerId, modelId] = value.split('::')
      const group = props.providerGroups.find((g) => g.id === providerId)
      if (!group) return
      emit('selectModel', {
        modelId,
        providerId,
        providerType: group.providerType,
      })
    }

    return () => (
      <NPopselect
        options={options.value}
        value={selectedValue.value}
        scrollable
        size="small"
        onUpdateValue={handleUpdate}
      >
        <button
          class="inline-flex cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-2 py-1 text-xs text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
          type="button"
        >
          <span class="max-w-[160px] truncate">{selectedLabel.value}</span>
          <ChevronDown size={12} />
        </button>
      </NPopselect>
    )
  },
})
