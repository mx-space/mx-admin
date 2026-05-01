import { ref, watch } from 'vue'
import type { ProviderGroup, SelectedModel } from '@haklex/rich-agent-chat'
import type { Ref } from 'vue'

const STORAGE_KEY = 'agent-chat:selected-model'

function readStored(): SelectedModel | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.modelId === 'string' &&
      typeof parsed.providerId === 'string' &&
      (parsed.providerType === 'claude' ||
        parsed.providerType === 'openai-compatible')
    ) {
      return parsed as SelectedModel
    }
  } catch {}
  return null
}

function writeStored(model: SelectedModel | null): void {
  try {
    if (model) localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

function isValidWithin(
  model: SelectedModel | null,
  groups: ProviderGroup[],
): boolean {
  if (!model) return false
  const g = groups.find((g) => g.id === model.providerId)
  if (!g) return false
  return g.models.some((m) => m.id === model.modelId)
}

/**
 * 持久化 agent chat 选中模型。providerGroups 加载后若存储值仍有效则恢复，
 * 否则回退至首组首模型。
 */
export function useAgentSelectedModel(providerGroups: Ref<ProviderGroup[]>): {
  selectedModel: Ref<SelectedModel | null>
  setSelectedModel: (m: SelectedModel | null) => void
} {
  const selectedModel = ref<SelectedModel | null>(readStored())

  watch(
    providerGroups,
    (groups) => {
      if (!groups.length) return
      if (isValidWithin(selectedModel.value, groups)) return
      const g = groups[0]
      const m = g.models[0]
      if (!m) return
      selectedModel.value = {
        modelId: m.id,
        providerId: g.id,
        providerType: g.providerType,
      }
    },
    { immediate: true },
  )

  watch(
    selectedModel,
    (m) => {
      writeStored(m)
    },
    { deep: true },
  )

  return {
    selectedModel,
    setSelectedModel: (m) => {
      selectedModel.value = m
    },
  }
}
