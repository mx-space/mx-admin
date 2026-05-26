import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Settings, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type {
  AIConfig,
  AIProviderConfig,
  AIProviderModel,
  AIProviderType,
} from '../../types/settings'

import { getModelList, getModels, testConfig } from '~/api/ai'
import { Button } from '~/ui/button'
import { SelectField } from '~/ui/select'
import { Switch } from '~/ui/switch'
import { TextInput } from '~/ui/text-field'

import { aiProviderTypeOptions } from '../../constants'
import {
  formatAIProviderLabel,
  getAIProviderKeyPlaceholder,
  getAIProviderModelPlaceholder,
  getAIProviderNamePlaceholder,
  getDefaultAIModel,
  getErrorMessage,
} from '../../utils/settings'
import { EmptyState, FieldShell } from '../SettingsPrimitives'
import { AIModelAssignmentField } from './AIModelAssignmentField'
import { AITextListField } from './AITextListField'

export function AIConfigEditor(props: {
  modelCacheKey: readonly unknown[]
  onChange: (value: AIConfig) => void
  value: AIConfig
}) {
  const queryClient = useQueryClient()
  const [loadingProviderId, setLoadingProviderId] = useState<string | null>(
    null,
  )
  const [testingProviderId, setTestingProviderId] = useState<string | null>(
    null,
  )
  const hasEnabledProvider = (props.value.providers ?? []).some(
    (provider) => provider.enabled,
  )
  const modelsQuery = useQuery({
    enabled: hasEnabledProvider,
    queryFn: async () => {
      const response = await getModels()
      return response.reduce<Record<string, AIProviderModel[]>>(
        (result, provider) => ({
          ...result,
          [provider.providerId]: provider.models ?? [],
        }),
        {},
      )
    },
    queryKey: props.modelCacheKey,
    staleTime: 24 * 60 * 60 * 1000,
  })
  const providerModels = modelsQuery.data ?? {}
  const providers = props.value.providers ?? []

  const updateConfig = (patch: Partial<AIConfig>) =>
    props.onChange({ ...props.value, ...patch })

  const updateProvider = (id: string, patch: Partial<AIProviderConfig>) => {
    updateConfig({
      providers: providers.map((provider) =>
        provider.id === id ? { ...provider, ...patch } : provider,
      ),
    })
  }

  const addProvider = () => {
    const type: AIProviderType = 'openai'
    const provider: AIProviderConfig = {
      apiKey: '',
      defaultModel: getDefaultAIModel(type),
      enabled: true,
      id: crypto.randomUUID(),
      name: '',
      type,
    }

    updateConfig({ providers: [...providers, provider] })
  }

  const deleteProvider = (id: string) => {
    updateConfig({
      providers: providers.filter((provider) => provider.id !== id),
    })
  }

  const refreshModels = async (provider: AIProviderConfig) => {
    setLoadingProviderId(provider.id)
    try {
      const response = await getModelList({
        apiKey: provider.apiKey || undefined,
        endpoint: provider.endpoint || undefined,
        providerId: provider.id,
        type: provider.type,
      })
      queryClient.setQueryData<Record<string, AIProviderModel[]>>(
        props.modelCacheKey,
        (current) => ({ ...current, [provider.id]: response.models ?? [] }),
      )
      if (response.error) toast.warning(`获取模型列表：${response.error}`)
      else toast.success('模型列表已更新')
    } catch (error) {
      toast.error(getErrorMessage(error, '获取模型列表失败'))
    } finally {
      setLoadingProviderId(null)
    }
  }

  const testProvider = async (provider: AIProviderConfig) => {
    if (!provider.defaultModel.trim()) {
      toast.warning('请先填写默认模型')
      return
    }

    setTestingProviderId(provider.id)
    try {
      await testConfig({
        apiKey: provider.apiKey || undefined,
        endpoint: provider.endpoint || undefined,
        model: provider.defaultModel,
        providerId: provider.id,
        type: provider.type,
      })
      toast.success('连接可用')
    } catch (error) {
      toast.error(getErrorMessage(error, '连接测试失败'))
    } finally {
      setTestingProviderId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">AI 服务商</h3>
            <p className="mt-1 text-xs text-neutral-500">
              配置 AI 服务提供商、密钥、Endpoint 与默认模型。
            </p>
          </div>
          <Button onClick={addProvider} type="button" variant="subtle">
            <Plus aria-hidden="true" className="size-4" />
            添加服务商
          </Button>
        </div>
        {providers.length === 0 ? (
          <EmptyState
            icon={<Settings className="size-7" />}
            label="暂无服务商"
          />
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => {
              const modelListId = `ai-models-${provider.id}`
              const models = providerModels[provider.id] ?? []
              const showEndpoint =
                provider.type === 'openai' ||
                provider.type === 'openai-compatible' ||
                provider.type === 'openrouter'

              return (
                <div
                  className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
                  key={provider.id}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {formatAIProviderLabel(provider)}
                      </div>
                      <div className="mt-1 truncate text-xs text-neutral-500">
                        {provider.defaultModel || '未设置模型'}
                      </div>
                    </div>
                    <Switch
                      checked={provider.enabled}
                      className="border-0 px-0 py-0"
                      label="启用"
                      onCheckedChange={(enabled) =>
                        updateProvider(provider.id, { enabled })
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldShell label="服务类型">
                      <SelectField<AIProviderType>
                        aria-label="服务类型"
                        onValueChange={(type) =>
                          updateProvider(provider.id, {
                            defaultModel: getDefaultAIModel(type),
                            type,
                          })
                        }
                        options={aiProviderTypeOptions}
                        value={provider.type}
                      />
                    </FieldShell>
                    <TextInput
                      label="显示名称"
                      onChange={(name) => updateProvider(provider.id, { name })}
                      placeholder={getAIProviderNamePlaceholder(provider.type)}
                      value={provider.name}
                    />
                    <TextInput
                      label="API Key"
                      onChange={(apiKey) =>
                        updateProvider(provider.id, { apiKey })
                      }
                      placeholder={getAIProviderKeyPlaceholder(provider.type)}
                      type="password"
                      value={provider.apiKey}
                    />
                    {showEndpoint ? (
                      <TextInput
                        label="Endpoint"
                        onChange={(endpoint) =>
                          updateProvider(provider.id, { endpoint })
                        }
                        placeholder={
                          provider.type === 'openai-compatible'
                            ? '必填，如 https://api.deepseek.com'
                            : '可选，留空使用默认'
                        }
                        value={provider.endpoint ?? ''}
                      />
                    ) : null}
                    <TextInput
                      label="默认模型"
                      list={modelListId}
                      onChange={(defaultModel) =>
                        updateProvider(provider.id, { defaultModel })
                      }
                      placeholder={getAIProviderModelPlaceholder(provider.type)}
                      value={provider.defaultModel}
                    />
                    <datalist id={modelListId}>
                      {models.map((model) => (
                        <option
                          key={model.id}
                          label={model.name || model.id}
                          value={model.id}
                        />
                      ))}
                    </datalist>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      disabled={loadingProviderId === provider.id}
                      onClick={() => void refreshModels(provider)}
                      type="button"
                      variant="subtle"
                    >
                      {loadingProviderId === provider.id ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : null}
                      获取模型
                    </Button>
                    <Button
                      disabled={testingProviderId === provider.id}
                      onClick={() => void testProvider(provider)}
                      type="button"
                      variant="subtle"
                    >
                      {testingProviderId === provider.id ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : null}
                      测试连接
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm('确认删除此 Provider？')) {
                          deleteProvider(provider.id)
                        }
                      }}
                      type="button"
                      variant="subtle"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      删除
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">模型分配</h3>
        <div className="grid gap-3">
          <AIModelAssignmentField
            description="用于生成文章摘要的模型。"
            label="摘要功能"
            models={providerModels}
            onChange={(summaryModel) => updateConfig({ summaryModel })}
            providers={providers}
            value={props.value.summaryModel}
          />
          <AIModelAssignmentField
            description="用于生成标题、Slug 等的模型。"
            label="写作助手"
            models={providerModels}
            onChange={(writerModel) => updateConfig({ writerModel })}
            providers={providers}
            value={props.value.writerModel}
          />
          <AIModelAssignmentField
            description="用于审核评论的模型。"
            label="评论审核"
            models={providerModels}
            onChange={(commentReviewModel) =>
              updateConfig({ commentReviewModel })
            }
            providers={providers}
            value={props.value.commentReviewModel}
          />
          <AIModelAssignmentField
            description="用于生成文章翻译的模型。"
            label="翻译功能"
            models={providerModels}
            onChange={(translationModel) => updateConfig({ translationModel })}
            providers={providers}
            value={props.value.translationModel}
          />
          <AIModelAssignmentField
            description="用于生成长篇精读的模型。"
            label="精读生成"
            models={providerModels}
            onChange={(insightsModel) => updateConfig({ insightsModel })}
            providers={providers}
            value={props.value.insightsModel}
          />
          <AIModelAssignmentField
            description="用于翻译精读；留空则复用翻译模型。"
            label="精读翻译"
            models={providerModels}
            onChange={(insightsTranslationModel) =>
              updateConfig({ insightsTranslationModel })
            }
            providers={providers}
            value={props.value.insightsTranslationModel}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">功能开关</h3>
        <div className="grid gap-4">
          <Switch
            checked={Boolean(props.value.enableSummary)}
            label="启用 AI 摘要"
            onCheckedChange={(enableSummary) => updateConfig({ enableSummary })}
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateSummaryOnCreate)}
            disabled={!props.value.enableSummary}
            label="文章创建时自动生成摘要"
            onCheckedChange={(enableAutoGenerateSummaryOnCreate) =>
              updateConfig({ enableAutoGenerateSummaryOnCreate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateSummaryOnUpdate)}
            disabled={!props.value.enableSummary}
            label="文章更新时重新生成摘要"
            onCheckedChange={(enableAutoGenerateSummaryOnUpdate) =>
              updateConfig({ enableAutoGenerateSummaryOnUpdate })
            }
          />
          <AITextListField
            disabled={!props.value.enableSummary}
            label="摘要目标语言"
            onChange={(summaryTargetLanguages) =>
              updateConfig({ summaryTargetLanguages })
            }
            value={props.value.summaryTargetLanguages ?? []}
          />
          <TextInput
            disabled={!props.value.enableSummary}
            inputMode="numeric"
            label="摘要自动生成最小文本长度"
            onChange={(value) =>
              updateConfig({
                summaryMinTextLength: value.trim() ? Number(value) : 0,
              })
            }
            type="number"
            value={String(props.value.summaryMinTextLength ?? 0)}
          />
          <Switch
            checked={Boolean(props.value.enableInsights)}
            label="启用 AI 精读"
            onCheckedChange={(enableInsights) =>
              updateConfig({ enableInsights })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateInsightsOnCreate)}
            disabled={!props.value.enableInsights}
            label="文章创建时自动生成精读"
            onCheckedChange={(enableAutoGenerateInsightsOnCreate) =>
              updateConfig({ enableAutoGenerateInsightsOnCreate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateInsightsOnUpdate)}
            disabled={!props.value.enableInsights}
            label="文章更新时重新生成精读"
            onCheckedChange={(enableAutoGenerateInsightsOnUpdate) =>
              updateConfig({ enableAutoGenerateInsightsOnUpdate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoTranslateInsights)}
            disabled={!props.value.enableInsights}
            label="自动翻译精读"
            onCheckedChange={(enableAutoTranslateInsights) =>
              updateConfig({ enableAutoTranslateInsights })
            }
          />
          <AITextListField
            disabled={!props.value.enableInsights}
            label="精读目标语言"
            onChange={(insightsTargetLanguages) =>
              updateConfig({ insightsTargetLanguages })
            }
            value={props.value.insightsTargetLanguages ?? []}
          />
          <TextInput
            disabled={!props.value.enableInsights}
            inputMode="numeric"
            label="精读自动生成最小文本长度"
            onChange={(value) =>
              updateConfig({
                insightsMinTextLength: value.trim() ? Number(value) : 0,
              })
            }
            type="number"
            value={String(props.value.insightsMinTextLength ?? 0)}
          />
          <Switch
            checked={Boolean(props.value.enableTranslation)}
            label="启用 AI 翻译"
            onCheckedChange={(enableTranslation) =>
              updateConfig({ enableTranslation })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateTranslation)}
            disabled={!props.value.enableTranslation}
            label="自动生成翻译"
            onCheckedChange={(enableAutoGenerateTranslation) =>
              updateConfig({ enableAutoGenerateTranslation })
            }
          />
          <AITextListField
            disabled={!props.value.enableTranslation}
            label="翻译目标语言"
            onChange={(translationTargetLanguages) =>
              updateConfig({ translationTargetLanguages })
            }
            value={props.value.translationTargetLanguages ?? []}
          />
        </div>
      </section>
    </div>
  )
}
