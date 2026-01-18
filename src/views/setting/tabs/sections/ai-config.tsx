import { CircleCheck as CheckCircleOutlinedIcon } from 'lucide-vue-next'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'

import { aiApi } from '~/api/ai'
import { HeaderActionButton } from '~/components/button/rounded-button'
import { DeleteConfirmButton } from '~/components/special-button/delete-confirm'

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

interface ProviderModelsResponse {
  providerId: string
  providerName: string
  providerType: AIProviderType
  models: ModelInfo[]
  error?: string
}

const AIProviderTypeOptions = [
  { label: 'OpenAI', value: AIProviderType.OpenAI },
  {
    label: 'OpenAI 兼容 (DeepSeek/Groq 等)',
    value: AIProviderType.OpenAICompatible,
  },
  { label: 'Anthropic (Claude)', value: AIProviderType.Anthropic },
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

// Provider Card Component
const AIProviderCard = defineComponent({
  props: {
    provider: {
      type: Object as PropType<AIProviderConfig>,
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

    // 当类型改变时，自动更新默认模型
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

    // 卡片标题：优先显示名称，否则根据类型显示
    const cardTitle = computed(() => {
      if (localProvider.value.name) {
        return localProvider.value.name
      }
      switch (localProvider.value.type) {
        case AIProviderType.Anthropic:
          return 'Anthropic (Claude)'
        case AIProviderType.OpenAI:
          return 'OpenAI'
        case AIProviderType.OpenRouter:
          return 'OpenRouter'
        case AIProviderType.OpenAICompatible:
          return 'OpenAI 兼容'
        default:
          return '新 Provider'
      }
    })

    return () => (
      <NCard title={cardTitle.value} size="small" class="mb-4">
        {{
          default: () => (
            <NForm labelPlacement="left" labelWidth={120}>
              <NFormItem label="类型">
                <NSelect
                  value={localProvider.value.type}
                  onUpdateValue={handleTypeChange}
                  options={AIProviderTypeOptions}
                />
              </NFormItem>

              <NFormItem label="显示名称">
                <NInput
                  value={localProvider.value.name}
                  onUpdateValue={(v: string) => handleChange('name', v)}
                  placeholder={getNamePlaceholderForType(
                    localProvider.value.type,
                  )}
                />
              </NFormItem>

              <NFormItem label="API Key">
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
                />
              </NFormItem>

              {showEndpoint.value && (
                <NFormItem label="Endpoint">
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
                  />
                </NFormItem>
              )}

              <NFormItem label="默认模型">
                <NSpace align="center">
                  {props.availableModels.length > 0 ? (
                    <NSelect
                      value={localProvider.value.defaultModel}
                      onUpdateValue={(v: string) =>
                        handleChange('defaultModel', v)
                      }
                      options={modelOptions.value}
                      filterable
                      tag
                      style="min-width: 200px"
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
                      style="min-width: 200px"
                    />
                  )}
                  <NButton
                    tertiary
                    type="primary"
                    loading={props.isLoadingModels}
                    onClick={() => props.onRefreshModels?.()}
                  >
                    获取模型列表
                  </NButton>
                </NSpace>
              </NFormItem>

              <NFormItem label="启用">
                <NSwitch
                  value={localProvider.value.enabled}
                  onUpdateValue={(v: boolean) => handleChange('enabled', v)}
                />
              </NFormItem>
            </NForm>
          ),
          action: () => (
            <div class="flex justify-end">
              <NSpace align="center">
                <HeaderActionButton
                  variant="success"
                  icon={<CheckCircleOutlinedIcon />}
                  name="测试连接"
                  disabled={
                    props.isTesting || !localProvider.value.defaultModel
                  }
                  onClick={() => props.onTest?.(localProvider.value)}
                />
                <DeleteConfirmButton
                  onDelete={() => props.onDelete()}
                  message="确定删除此 Provider？"
                />
              </NSpace>
            </div>
          ),
        }}
      </NCard>
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
      <NFormItem label={props.label}>
        <NSpace vertical class="w-full">
          <NSpace>
            <NSelect
              value={selectedProviderId.value || null}
              onUpdateValue={handleProviderChange}
              options={providerOptions.value}
              placeholder="选择 Provider"
              clearable
              style="min-width: 180px"
            />
            <NSelect
              value={selectedModel.value || null}
              onUpdateValue={handleModelChange}
              options={modelOptions.value}
              placeholder="使用 Provider 默认模型"
              clearable
              filterable
              tag
              style="min-width: 200px"
              disabled={!selectedProviderId.value}
            />
          </NSpace>
          {props.description && (
            <NText depth={3} class="text-xs">
              {props.description}
            </NText>
          )}
        </NSpace>
      </NFormItem>
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
          message.warning(`获取模型列表: ${response.error}`)
        }
      } catch (error: any) {
        console.error(`Failed to fetch models for ${provider.id}:`, error)
        if (!error?.response) {
          message.error(`获取模型列表失败: ${error.message || error}`)
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
        message.warning('请先填写默认模型')
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
        message.success('连接可用')
      } catch (error: any) {
        console.error(`Failed to test provider ${provider.id}:`, error)
        if (!error?.response) {
          message.error(`连接失败: ${error.message || error}`)
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
    }

    return () => (
      <NSpace vertical size="large" class="w-full">
        {/* AI Providers */}
        <NCard title="AI Providers" size="small">
          <NSpace vertical class="w-full">
            {config.value.providers?.map((provider, index) => (
              <AIProviderCard
                key={provider.id}
                provider={provider}
                onUpdate={(p) => handleProviderUpdate(index, p)}
                onDelete={() => handleProviderDelete(index)}
                onTest={(p) => testProviderConnection(p)}
                availableModels={providerModels.value[provider.id] || []}
                isLoadingModels={loadingProviders.value.has(provider.id)}
                isTesting={testingProviders.value.has(provider.id)}
                onRefreshModels={() => fetchModelsForProvider(provider)}
              />
            ))}
            <NButton onClick={handleAddProvider} dashed block>
              + 添加 Provider
            </NButton>
          </NSpace>
        </NCard>

        {/* 功能模型分配 */}
        <NCard title="功能模型分配" size="small">
          <NForm labelPlacement="left" labelWidth={150}>
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
          </NForm>
        </NCard>

        {/* 功能开关 */}
        <NCard title="功能开关" size="small">
          <NForm labelPlacement="left" labelWidth={200}>
            <NFormItem label="启用 AI 摘要">
              <NSwitch
                value={config.value.enableSummary}
                onUpdateValue={(v: boolean) =>
                  updateConfig({ enableSummary: v })
                }
              />
            </NFormItem>

            <NFormItem label="自动生成摘要">
              <NSpace vertical>
                <NSwitch
                  value={config.value.enableAutoGenerateSummary}
                  onUpdateValue={(v: boolean) =>
                    updateConfig({ enableAutoGenerateSummary: v })
                  }
                  disabled={!config.value.enableSummary}
                />
                <NText depth={3} class="text-xs">
                  发布文章时自动生成摘要
                </NText>
              </NSpace>
            </NFormItem>

            <NFormItem label="摘要目标语言">
              <NInput
                value={config.value.aiSummaryTargetLanguage}
                onUpdateValue={(v: string) =>
                  updateConfig({ aiSummaryTargetLanguage: v })
                }
                placeholder="auto 或 ISO 639-1 语言代码"
                style="max-width: 200px"
              />
            </NFormItem>
          </NForm>
        </NCard>
      </NSpace>
    )
  },
})
