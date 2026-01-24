import {
  CircleCheck as CheckCircleOutlinedIcon,
  ChevronDown as ChevronDownIcon,
  Cpu as CpuIcon,
  Globe as GlobeIcon,
  Plus as PlusIcon,
  Zap as ZapIcon,
} from 'lucide-vue-next'
import { NButton, NInput, NSelect, NSpace, NSwitch } from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { PropType } from 'vue'

import { aiApi } from '~/api/ai'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'
import { SettingsItem } from '~/layouts/settings-layout'

// Types
enum AIProviderType {
  OpenAI = 'openai',
  OpenAICompatible = 'openai-compatible',
  Anthropic = 'anthropic',
  OpenRouter = 'openrouter',
}

interface AIProviderConfig {
  id: string
  name: string
  type: AIProviderType
  apiKey: string
  endpoint?: string
  defaultModel: string
  enabled: boolean
}

interface AIModelAssignment {
  providerId?: string
  model?: string
}

interface AIConfig {
  providers: AIProviderConfig[]
  summaryModel?: AIModelAssignment
  writerModel?: AIModelAssignment
  commentReviewModel?: AIModelAssignment
  enableSummary: boolean
  enableAutoGenerateSummary: boolean
  aiSummaryTargetLanguage: string
}

interface ModelInfo {
  id: string
  name: string
  created?: number
}

const AIProviderTypeOptions = [
  { label: 'OpenAI', value: AIProviderType.OpenAI },
  {
    label: 'OpenAI Compatible',
    value: AIProviderType.OpenAICompatible,
  },
  { label: 'Anthropic', value: AIProviderType.Anthropic },
  { label: 'OpenRouter', value: AIProviderType.OpenRouter },
]

const getProviderTypeLabel = (type: AIProviderType): string =>
  AIProviderTypeOptions.find((option) => option.value === type)?.label || type

const formatProviderLabel = (provider: AIProviderConfig): string => {
  const name = provider.name?.trim()
  const typeLabel = getProviderTypeLabel(provider.type)
  if (name) {
    return name
  }
  return typeLabel
}

// 根据 Provider 类型获取默认模型
const getDefaultModelForType = (type: AIProviderType): string => {
  switch (type) {
    case AIProviderType.Anthropic:
      return 'claude-sonnet-4.5'
    case AIProviderType.OpenAI:
      return 'gpt-5-mini'
    case AIProviderType.OpenRouter:
      return 'anthropic/claude-sonnet-4.5'
    case AIProviderType.OpenAICompatible:
      return ''
    default:
      return ''
  }
}

// 根据 Provider 类型获取名称占位符
const getNamePlaceholderForType = (type: AIProviderType): string => {
  switch (type) {
    case AIProviderType.Anthropic:
      return '如 Claude Sonnet'
    case AIProviderType.OpenAI:
      return '如 OpenAI GPT-4o'
    case AIProviderType.OpenRouter:
      return '如 OpenRouter'
    case AIProviderType.OpenAICompatible:
      return '如 DeepSeek'
    default:
      return ''
  }
}

// 根据 Provider 类型获取模型占位符
const getModelPlaceholderForType = (type: AIProviderType): string => {
  switch (type) {
    case AIProviderType.Anthropic:
      return '如 claude-sonnet-4.5'
    case AIProviderType.OpenAI:
      return '如 gpt-5-mini'
    case AIProviderType.OpenRouter:
      return '如 anthropic/claude-sonnet-4.5'
    case AIProviderType.OpenAICompatible:
      return '如 deepseek-chat'
    default:
      return ''
  }
}

// Provider Row Component
const AIProviderRow = defineComponent({
  props: {
    provider: {
      type: Object as PropType<AIProviderConfig>,
      required: true,
    },
    expanded: {
      type: Boolean,
      default: false,
    },
    onToggle: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onUpdate: {
      type: Function as PropType<(provider: AIProviderConfig) => void>,
      required: true,
    },
    onDelete: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onTest: {
      type: Function as PropType<(provider: AIProviderConfig) => void>,
    },
    availableModels: {
      type: Array as PropType<ModelInfo[]>,
      default: () => [],
    },
    isLoadingModels: {
      type: Boolean,
      default: false,
    },
    isTesting: {
      type: Boolean,
      default: false,
    },
    onRefreshModels: {
      type: Function as PropType<() => void>,
    },
  },
  setup(props) {
    const localProvider = ref({ ...props.provider })

    watch(
      () => props.provider,
      (newVal) => {
        localProvider.value = { ...newVal }
      },
      { deep: true },
    )

    const handleChange = <K extends keyof AIProviderConfig>(
      field: K,
      value: AIProviderConfig[K],
    ) => {
      ;(localProvider.value as AIProviderConfig)[field] = value
      props.onUpdate(localProvider.value)
    }

    const handleTypeChange = (type: AIProviderType) => {
      localProvider.value.type = type
      localProvider.value.defaultModel = getDefaultModelForType(type)
      props.onUpdate(localProvider.value)
    }

    const modelOptions = computed(() =>
      props.availableModels.map((m) => ({
        label: m.name || m.id,
        value: m.id,
      })),
    )

    const showEndpoint = computed(
      () =>
        localProvider.value.type === AIProviderType.OpenAICompatible ||
        localProvider.value.type === AIProviderType.OpenAI ||
        localProvider.value.type === AIProviderType.OpenRouter,
    )

    const cardTitle = computed(() => {
      if (localProvider.value.name) return localProvider.value.name
      return getProviderTypeLabel(localProvider.value.type)
    })

    const ProviderIcon = computed(() => {
      switch (localProvider.value.type) {
        case AIProviderType.OpenAI:
          return ZapIcon
        case AIProviderType.Anthropic:
          return CpuIcon
        case AIProviderType.OpenRouter:
          return GlobeIcon
        default:
          return ZapIcon
      }
    })

    return () => (
      <div class="group border-b border-neutral-100 last:border-0 dark:border-neutral-800">
        {/* Header Row */}
        <div
          class="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          onClick={() => props.onToggle()}
        >
          <div
            class={[
              'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
              localProvider.value.enabled
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800',
            ]}
          >
            <ProviderIcon.value class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {cardTitle.value}
              </span>
              {localProvider.value.enabled && (
                <span class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  已启用
                </span>
              )}
            </div>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              {localProvider.value.defaultModel || '未设置模型'}
            </span>
          </div>
          <div
            class="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="hidden items-center gap-1 group-hover:flex">
              <HeaderActionButton
                variant="success"
                icon={<CheckCircleOutlinedIcon />}
                name="测试"
                disabled={props.isTesting || !localProvider.value.defaultModel}
                onClick={() => props.onTest?.(localProvider.value)}
              />
              <DeleteConfirmButton
                onDelete={() => props.onDelete()}
                message="确定删除此 Provider？"
              />
            </div>
          </div>
          <ChevronDownIcon
            class={[
              'size-4 shrink-0 text-neutral-400 transition-transform duration-200',
              props.expanded ? 'rotate-180' : '',
            ]}
          />
        </div>

        {/* Expanded Content */}
        {props.expanded && (
          <div class="border-t border-neutral-100 bg-neutral-50/50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-800/30">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  服务类型
                </label>
                <NSelect
                  value={localProvider.value.type}
                  onUpdateValue={handleTypeChange}
                  options={AIProviderTypeOptions}
                  size="small"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  显示名称
                </label>
                <NInput
                  value={localProvider.value.name}
                  onUpdateValue={(v: string) => handleChange('name', v)}
                  placeholder={getNamePlaceholderForType(
                    localProvider.value.type,
                  )}
                  size="small"
                />
              </div>

              <div class="space-y-1.5 sm:col-span-2">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  API Key
                </label>
                <NInput
                  type="password"
                  showPasswordOn="click"
                  value={localProvider.value.apiKey}
                  onUpdateValue={(v: string) => handleChange('apiKey', v)}
                  placeholder={
                    localProvider.value.type === AIProviderType.Anthropic
                      ? 'sk-ant-...'
                      : localProvider.value.type === AIProviderType.OpenRouter
                        ? 'sk-or-...'
                        : 'sk-...'
                  }
                  size="small"
                />
              </div>

              {showEndpoint.value && (
                <div class="space-y-1.5 sm:col-span-2">
                  <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Endpoint
                  </label>
                  <NInput
                    value={localProvider.value.endpoint}
                    onUpdateValue={(v: string) => handleChange('endpoint', v)}
                    placeholder={
                      localProvider.value.type ===
                      AIProviderType.OpenAICompatible
                        ? '必填，如 https://api.deepseek.com'
                        : localProvider.value.type === AIProviderType.OpenRouter
                          ? '可选，默认 https://openrouter.ai/api/v1'
                          : '可选，留空使用默认'
                    }
                    size="small"
                  />
                </div>
              )}

              <div class="space-y-1.5 sm:col-span-2">
                <label class="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  默认模型
                </label>
                <NSpace align="center" wrap={false}>
                  {props.availableModels.length > 0 ? (
                    <NSelect
                      value={localProvider.value.defaultModel}
                      onUpdateValue={(v: string) =>
                        handleChange('defaultModel', v)
                      }
                      options={modelOptions.value}
                      filterable
                      tag
                      size="small"
                      class="min-w-[200px]"
                      placeholder="选择或输入模型名"
                    />
                  ) : (
                    <NInput
                      value={localProvider.value.defaultModel}
                      onUpdateValue={(v: string) =>
                        handleChange('defaultModel', v)
                      }
                      placeholder={getModelPlaceholderForType(
                        localProvider.value.type,
                      )}
                      size="small"
                      class="min-w-[200px]"
                    />
                  )}
                  <NButton
                    tertiary
                    type="primary"
                    size="small"
                    loading={props.isLoadingModels}
                    onClick={() => props.onRefreshModels?.()}
                  >
                    获取模型
                  </NButton>
                </NSpace>
              </div>

              <div class="sm:col-span-2">
                <div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      启用此服务商
                    </span>
                  </div>
                  <NSwitch
                    value={localProvider.value.enabled}
                    onUpdateValue={(v: boolean) => handleChange('enabled', v)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
})

// Model Assignment Select Component
const AIModelAssignmentSelect = defineComponent({
  props: {
    label: { type: String, required: true },
    description: { type: String },
    assignment: {
      type: Object as PropType<AIModelAssignment | undefined>,
    },
    providers: {
      type: Array as PropType<AIProviderConfig[]>,
      required: true,
    },
    providerModels: {
      type: Object as PropType<Record<string, ModelInfo[]>>,
      default: () => ({}),
    },
    onUpdate: {
      type: Function as PropType<
        (assignment: AIModelAssignment | undefined) => void
      >,
      required: true,
    },
  },
  setup(props) {
    const selectedProviderId = ref(props.assignment?.providerId || '')
    const selectedModel = ref(props.assignment?.model || '')

    watch(
      () => props.assignment,
      (newVal) => {
        selectedProviderId.value = newVal?.providerId || ''
        selectedModel.value = newVal?.model || ''
      },
      { deep: true },
    )

    const providerOptions = computed(() =>
      props.providers.map((p) => ({
        label: formatProviderLabel(p),
        value: p.id,
        disabled: !p.enabled,
      })),
    )

    const currentProviderModels = computed(() => {
      if (!selectedProviderId.value) return []
      return props.providerModels[selectedProviderId.value] || []
    })

    const modelOptions = computed(() => {
      const models = currentProviderModels.value.map((m) => ({
        label: m.name || m.id,
        value: m.id,
      }))

      // Add default model option from provider
      const provider = props.providers.find(
        (p) => p.id === selectedProviderId.value,
      )
      if (provider?.defaultModel) {
        const defaultExists = models.some(
          (m) => m.value === provider.defaultModel,
        )
        if (!defaultExists) {
          models.unshift({
            label: `${provider.defaultModel} (默认)`,
            value: provider.defaultModel,
          })
        }
      }

      return models
    })

    const handleProviderChange = (providerId: string) => {
      selectedProviderId.value = providerId
      selectedModel.value = ''
      emitUpdate()
    }

    const handleModelChange = (model: string) => {
      selectedModel.value = model
      emitUpdate()
    }

    const emitUpdate = () => {
      if (!selectedProviderId.value) {
        props.onUpdate(undefined)
      } else {
        props.onUpdate({
          providerId: selectedProviderId.value,
          model: selectedModel.value || undefined,
        })
      }
    }

    return () => (
      <SettingsItem title={props.label} description={props.description}>
        <div class="flex flex-wrap gap-2">
          <NSelect
            value={selectedProviderId.value || null}
            onUpdateValue={handleProviderChange}
            options={providerOptions.value}
            placeholder="选择 Provider"
            clearable
            class="w-full sm:w-[180px]"
          />
          <NSelect
            value={selectedModel.value || null}
            onUpdateValue={handleModelChange}
            options={modelOptions.value}
            placeholder="使用 Provider 默认模型"
            clearable
            filterable
            tag
            class="w-full sm:w-[240px]"
            disabled={!selectedProviderId.value}
          />
        </div>
      </SettingsItem>
    )
  },
})

// Main AI Config Section - Slot-based Component
export const AIConfigSection = defineComponent({
  props: {
    value: {
      type: Object as PropType<AIConfig>,
      required: true,
    },
    onUpdate: {
      type: Function as PropType<(value: AIConfig) => void>,
      required: true,
    },
  },
  setup(props) {
    const providerModels = ref<Record<string, ModelInfo[]>>({})
    const loadingProviders = ref<Set<string>>(new Set())
    const testingProviders = ref<Set<string>>(new Set())

    // Local config ref that syncs with props
    const config = computed({
      get: () => props.value,
      set: (val) => props.onUpdate(val),
    })

    // Fetch models for a specific provider (using list endpoint, no need to save first)
    const fetchModelsForProvider = async (provider: AIProviderConfig) => {
      loadingProviders.value.add(provider.id)
      try {
        const response = await aiApi.getModelList({
          providerId: provider.id,
          type: provider.type,
          apiKey: provider.apiKey || undefined,
          endpoint: provider.endpoint || undefined,
        })
        if (response.models) {
          providerModels.value[provider.id] = response.models
        }
        if (response.error) {
          toast.warning(`获取模型列表: ${response.error}`)
        }
      } catch (error: any) {
        console.error(`Failed to fetch models for ${provider.id}:`, error)
        if (!error?.response) {
          toast.error(`获取模型列表失败: ${error.message || error}`)
        }
      } finally {
        loadingProviders.value.delete(provider.id)
      }
    }

    // Fetch all models for enabled providers
    const fetchAllModels = async () => {
      try {
        const response = await aiApi.getModels()
        for (const providerData of response) {
          if (providerData.models) {
            providerModels.value[providerData.provider] = providerData.models
          }
        }
      } catch (error) {
        console.error('Failed to fetch all models:', error)
      }
    }

    const testProviderConnection = async (provider: AIProviderConfig) => {
      if (!provider.defaultModel) {
        toast.warning('请先填写默认模型')
        return
      }

      testingProviders.value.add(provider.id)
      try {
        await aiApi.testConfig({
          providerId: provider.id,
          type: provider.type,
          apiKey: provider.apiKey || undefined,
          endpoint: provider.endpoint || undefined,
          model: provider.defaultModel || undefined,
        })
        toast.success('连接可用')
      } catch (error: any) {
        console.error(`Failed to test provider ${provider.id}:`, error)
        if (!error?.response) {
          toast.error(`连接失败: ${error.message || error}`)
        }
      } finally {
        testingProviders.value.delete(provider.id)
      }
    }

    onMounted(() => {
      // Fetch models for enabled providers
      if (config.value.providers?.some((p) => p.enabled)) {
        fetchAllModels()
      }
    })

    // Helper to update config
    const updateConfig = (partial: Partial<AIConfig>) => {
      props.onUpdate({ ...config.value, ...partial })
    }

    // Provider management
    const handleProviderUpdate = (
      index: number,
      provider: AIProviderConfig,
    ) => {
      const newProviders = [...(config.value.providers || [])]
      newProviders[index] = provider
      updateConfig({ providers: newProviders })
    }

    const handleProviderDelete = (index: number) => {
      const newProviders = (config.value.providers || []).filter(
        (_, i) => i !== index,
      )
      updateConfig({ providers: newProviders })
    }

    const expandedProviders = ref<Set<string>>(new Set())

    const toggleProvider = (id: string) => {
      if (expandedProviders.value.has(id)) {
        expandedProviders.value.delete(id)
      } else {
        expandedProviders.value.add(id)
      }
    }

    const handleAddProvider = () => {
      const defaultType = AIProviderType.OpenAI
      const newProvider: AIProviderConfig = {
        id: crypto.randomUUID(),
        name: '',
        type: defaultType,
        apiKey: '',
        defaultModel: getDefaultModelForType(defaultType),
        enabled: true,
      }
      updateConfig({
        providers: [...(config.value.providers || []), newProvider],
      })
      expandedProviders.value.add(newProvider.id)
    }

    return () => (
      <div class="space-y-8">
        {/* AI Providers */}
        <div>
          <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            AI 服务商
          </h3>
          <div class="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {config.value.providers && config.value.providers.length > 0 ? (
              config.value.providers.map((provider, index) => (
                <AIProviderRow
                  key={provider.id}
                  provider={provider}
                  expanded={expandedProviders.value.has(provider.id)}
                  onToggle={() => toggleProvider(provider.id)}
                  onUpdate={(p) => handleProviderUpdate(index, p)}
                  onDelete={() => handleProviderDelete(index)}
                  onTest={(p) => testProviderConnection(p)}
                  availableModels={providerModels.value[provider.id] || []}
                  isLoadingModels={loadingProviders.value.has(provider.id)}
                  isTesting={testingProviders.value.has(provider.id)}
                  onRefreshModels={() => fetchModelsForProvider(provider)}
                />
              ))
            ) : (
              <div class="py-12 text-center text-sm text-neutral-500">
                暂无服务商，点击下方按钮添加
              </div>
            )}
            <div
              class="flex cursor-pointer items-center justify-center gap-2 border-t border-neutral-100 px-5 py-3 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700 dark:border-neutral-800 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-300"
              onClick={handleAddProvider}
            >
              <PlusIcon class="size-4" />
              <span>添加服务商</span>
            </div>
          </div>
        </div>

        {/* 功能模型分配 */}
        <div>
          <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            模型分配
          </h3>
          <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <AIModelAssignmentSelect
              label="摘要功能"
              description="用于生成文章摘要的模型"
              assignment={config.value.summaryModel}
              providers={config.value.providers || []}
              providerModels={providerModels.value}
              onUpdate={(a) => updateConfig({ summaryModel: a })}
            />

            <AIModelAssignmentSelect
              label="写作助手"
              description="用于生成标题、Slug 等的模型"
              assignment={config.value.writerModel}
              providers={config.value.providers || []}
              providerModels={providerModels.value}
              onUpdate={(a) => updateConfig({ writerModel: a })}
            />

            <AIModelAssignmentSelect
              label="评论审核"
              description="用于审核评论的模型"
              assignment={config.value.commentReviewModel}
              providers={config.value.providers || []}
              providerModels={providerModels.value}
              onUpdate={(a) => updateConfig({ commentReviewModel: a })}
            />
          </div>
        </div>

        {/* 功能开关 */}
        <div>
          <h3 class="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            功能开关
          </h3>
          <div class="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <SettingsItem title="启用 AI 摘要">
              <NSwitch
                value={config.value.enableSummary}
                onUpdateValue={(v: boolean) =>
                  updateConfig({ enableSummary: v })
                }
              />
            </SettingsItem>

            <SettingsItem
              title="自动生成摘要"
              description="发布文章时自动生成摘要"
            >
              <NSwitch
                value={config.value.enableAutoGenerateSummary}
                onUpdateValue={(v: boolean) =>
                  updateConfig({ enableAutoGenerateSummary: v })
                }
                disabled={!config.value.enableSummary}
              />
            </SettingsItem>

            <SettingsItem title="摘要目标语言">
              <NInput
                value={config.value.aiSummaryTargetLanguage}
                onUpdateValue={(v: string) =>
                  updateConfig({ aiSummaryTargetLanguage: v })
                }
                placeholder="auto 或 ISO 639-1 语言代码"
                style="max-width: 200px"
              />
            </SettingsItem>
          </div>
        </div>
      </div>
    )
  },
})
