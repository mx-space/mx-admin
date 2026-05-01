import { ChevronDown, Search } from 'lucide-vue-next'
import { NPopselect } from 'naive-ui'
import { computed, defineComponent, nextTick, ref, watch } from 'vue'
import type { PropType } from 'vue'

import {
  filterRecentModelsWithin,
  readRecentModels,
  rememberRecentModel,
  toModelValue,
  writeRecentModels,
} from './model-selector-recents'

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
    const searchQuery = ref('')
    const showPopselect = ref(false)
    const inputRef = ref<HTMLInputElement | null>(null)
    const recentModels = ref<SelectedModel[]>(readRecentModels())

    function getModelLabel(
      model: Pick<SelectedModel, 'providerId' | 'modelId'>,
    ): string {
      const group = props.providerGroups.find(
        (item) => item.id === model.providerId,
      )
      const matchedModel = group?.models.find(
        (item) => item.id === model.modelId,
      )
      return matchedModel?.displayName ?? model.modelId
    }

    function syncRecentModels(groups: ProviderGroup[]) {
      const nextRecentModels = filterRecentModelsWithin(
        recentModels.value,
        groups,
      )
      const hasChanged =
        nextRecentModels.length !== recentModels.value.length ||
        nextRecentModels.some(
          (item, index) =>
            toModelValue(item) !== toModelValue(recentModels.value[index]!),
        )

      if (hasChanged) {
        recentModels.value = nextRecentModels
        writeRecentModels(nextRecentModels)
      }
    }

    const recentOptions = computed(() =>
      filterRecentModelsWithin(recentModels.value, props.providerGroups).map(
        (model) => ({
          label: getModelLabel(model),
          value: toModelValue(model),
        }),
      ),
    )

    const filteredOptions = computed(() => {
      const query = searchQuery.value.toLowerCase().trim()
      const providerOptions = props.providerGroups.map((group) => ({
        type: 'group' as const,
        label: group.name,
        key: group.id,
        children: group.models.map((m) => ({
          label: m.displayName,
          value: `${group.id}::${m.id}`,
        })),
      }))

      if (!query) {
        return recentOptions.value.length
          ? [
              {
                type: 'group' as const,
                label: 'Recent',
                key: 'recent',
                children: recentOptions.value,
              },
              ...providerOptions,
            ]
          : providerOptions
      }

      return props.providerGroups
        .map((group) => {
          const matched = group.models.filter(
            (m) =>
              m.displayName.toLowerCase().includes(query) ||
              m.id.toLowerCase().includes(query),
          )
          if (matched.length === 0) return null
          return {
            type: 'group' as const,
            label: group.name,
            key: group.id,
            children: matched.map((m) => ({
              label: m.displayName,
              value: `${group.id}::${m.id}`,
            })),
          }
        })
        .filter(Boolean) as any[]
    })

    const selectedValue = computed(() =>
      props.selectedModel ? toModelValue(props.selectedModel) : null,
    )

    const selectedLabel = computed(() => {
      if (!props.selectedModel) return 'Select model'
      return getModelLabel(props.selectedModel)
    })

    function handleUpdate(value: string) {
      const [providerId, modelId] = value.split('::')
      const group = props.providerGroups.find((g) => g.id === providerId)
      if (!group) return
      const nextModel = {
        modelId,
        providerId,
        providerType: group.providerType,
      }
      emit('selectModel', nextModel)
      recentModels.value = rememberRecentModel(
        nextModel,
        filterRecentModelsWithin(recentModels.value, props.providerGroups),
      )
      writeRecentModels(recentModels.value)
      showPopselect.value = false
      searchQuery.value = ''
    }

    watch(
      () => props.providerGroups,
      (groups) => {
        syncRecentModels(groups)
      },
      { immediate: true, deep: true },
    )

    watch(showPopselect, (val) => {
      if (val) {
        nextTick(() => {
          inputRef.value?.focus()
        })
      } else {
        searchQuery.value = ''
      }
    })

    return () => (
      <NPopselect
        options={filteredOptions.value}
        value={selectedValue.value}
        scrollable
        virtualScroll
        size="small"
        width={280}
        trigger="click"
        show={showPopselect.value}
        onUpdateShow={(val: boolean) => {
          showPopselect.value = val
        }}
        onUpdateValue={handleUpdate}
      >
        {{
          header: () => (
            <div class="flex items-center gap-1.5">
              <Search size={14} class="shrink-0 text-neutral-400" />
              <input
                ref={(el: any) => {
                  if (el) {
                    inputRef.value = el
                  }
                }}
                value={searchQuery.value}
                onInput={(e: Event) => {
                  searchQuery.value = (e.target as HTMLInputElement).value
                }}
                placeholder="Search models..."
                class="w-full border-none bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400 dark:text-neutral-200 dark:placeholder:text-neutral-500"
              />
            </div>
          ),
          default: () => (
            <button
              class="inline-flex cursor-pointer items-center gap-1 rounded-md border-none bg-transparent px-2 py-1 text-xs text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              type="button"
            >
              <span class="max-w-[160px] truncate">{selectedLabel.value}</span>
              <ChevronDown size={12} />
            </button>
          ),
        }}
      </NPopselect>
    )
  },
})
