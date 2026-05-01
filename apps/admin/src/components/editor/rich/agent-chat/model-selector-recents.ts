import type { ProviderGroup, SelectedModel } from './ModelSelector'

const STORAGE_KEY = 'agent-chat:recent-models'
const RECENT_MODELS_LIMIT = 5

function isSelectedModel(value: unknown): value is SelectedModel {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as SelectedModel).modelId === 'string' &&
    typeof (value as SelectedModel).providerId === 'string' &&
    ((value as SelectedModel).providerType === 'claude' ||
      (value as SelectedModel).providerType === 'openai-compatible'),
  )
}

function isSameModel(a: SelectedModel, b: SelectedModel): boolean {
  return a.providerId === b.providerId && a.modelId === b.modelId
}

export function toModelValue(
  model: Pick<SelectedModel, 'providerId' | 'modelId'>,
): string {
  return `${model.providerId}::${model.modelId}`
}

export function readRecentModels(): SelectedModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isSelectedModel)
  } catch {
    return []
  }
}

export function writeRecentModels(models: SelectedModel[]): void {
  try {
    if (models.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(models))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}

export function rememberRecentModel(
  model: SelectedModel,
  currentModels: SelectedModel[],
): SelectedModel[] {
  return [
    model,
    ...currentModels.filter((item) => !isSameModel(item, model)),
  ].slice(0, RECENT_MODELS_LIMIT)
}

export function filterRecentModelsWithin(
  models: SelectedModel[],
  providerGroups: ProviderGroup[],
): SelectedModel[] {
  return models.filter((model) => {
    const group = providerGroups.find((item) => item.id === model.providerId)
    return Boolean(group?.models.some((item) => item.id === model.modelId))
  })
}
