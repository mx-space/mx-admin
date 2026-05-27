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
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { SelectField } from '~/ui/primitives/select'
import { Switch } from '~/ui/primitives/switch'
import { TextInput } from '~/ui/primitives/text-field'

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
  const { t } = useI18n()
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
      if (response.error)
        toast.warning(
          t('settings.ai.toast.modelListError', { message: response.error }),
        )
      else toast.success(t('settings.ai.toast.modelListUpdated'))
    } catch (error) {
      toast.error(
        getErrorMessage(error, t('settings.ai.error.fetchModelsFailed')),
      )
    } finally {
      setLoadingProviderId(null)
    }
  }

  const testProvider = async (provider: AIProviderConfig) => {
    if (!provider.defaultModel.trim()) {
      toast.warning(t('settings.ai.toast.needDefaultModel'))
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
      toast.success(t('settings.ai.toast.testSuccess'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.ai.error.testFailed')))
    } finally {
      setTestingProviderId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">
              {t('settings.ai.provider.sectionTitle')}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              {t('settings.ai.provider.sectionTitleDescription')}
            </p>
          </div>
          <Button onClick={addProvider} type="button" variant="subtle">
            <Plus aria-hidden="true" className="size-4" />
            {t('settings.ai.action.addProvider')}
          </Button>
        </div>
        {providers.length === 0 ? (
          <EmptyState
            icon={<Settings className="size-7" />}
            label={t('settings.ai.empty.providers')}
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
                        {provider.defaultModel ||
                          t('settings.ai.provider.modelUnset')}
                      </div>
                    </div>
                    <Switch
                      checked={provider.enabled}
                      className="border-0 px-0 py-0"
                      label={t('settings.oauth.switch.enabled')}
                      onCheckedChange={(enabled) =>
                        updateProvider(provider.id, { enabled })
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldShell label={t('settings.ai.field.providerType')}>
                      <SelectField<AIProviderType>
                        aria-label={t('settings.ai.field.providerType')}
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
                      label={t('settings.ai.field.displayName')}
                      onChange={(name) => updateProvider(provider.id, { name })}
                      placeholder={getAIProviderNamePlaceholder(
                        t,
                        provider.type,
                      )}
                      value={provider.name}
                    />
                    <TextInput
                      label={t('settings.ai.field.apiKey')}
                      onChange={(apiKey) =>
                        updateProvider(provider.id, { apiKey })
                      }
                      placeholder={getAIProviderKeyPlaceholder(provider.type)}
                      type="password"
                      value={provider.apiKey}
                    />
                    {showEndpoint ? (
                      <TextInput
                        label={t('settings.ai.field.endpoint')}
                        onChange={(endpoint) =>
                          updateProvider(provider.id, { endpoint })
                        }
                        placeholder={
                          provider.type === 'openai-compatible'
                            ? t('settings.ai.placeholder.endpointCompatible')
                            : t('settings.ai.placeholder.endpointDefault')
                        }
                        value={provider.endpoint ?? ''}
                      />
                    ) : null}
                    <TextInput
                      label={t('settings.ai.field.defaultModel')}
                      list={modelListId}
                      onChange={(defaultModel) =>
                        updateProvider(provider.id, { defaultModel })
                      }
                      placeholder={getAIProviderModelPlaceholder(
                        t,
                        provider.type,
                      )}
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
                      {t('settings.ai.action.fetchModels')}
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
                      {t('settings.ai.action.testConnection')}
                    </Button>
                    <Button
                      onClick={() => {
                        if (
                          window.confirm(
                            t('settings.ai.confirm.deleteProvider'),
                          )
                        ) {
                          deleteProvider(provider.id)
                        }
                      }}
                      type="button"
                      variant="subtle"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">
          {t('settings.ai.section.modelAssignments')}
        </h3>
        <div className="grid gap-3">
          <AIModelAssignmentField
            description={t('settings.ai.assignment.summaryDescription')}
            label={t('settings.ai.assignment.summaryLabel')}
            models={providerModels}
            onChange={(summaryModel) => updateConfig({ summaryModel })}
            providers={providers}
            value={props.value.summaryModel}
          />
          <AIModelAssignmentField
            description={t('settings.ai.assignment.writerDescription')}
            label={t('settings.ai.assignment.writerLabel')}
            models={providerModels}
            onChange={(writerModel) => updateConfig({ writerModel })}
            providers={providers}
            value={props.value.writerModel}
          />
          <AIModelAssignmentField
            description={t('settings.ai.assignment.commentReviewDescription')}
            label={t('settings.ai.assignment.commentReviewLabel')}
            models={providerModels}
            onChange={(commentReviewModel) =>
              updateConfig({ commentReviewModel })
            }
            providers={providers}
            value={props.value.commentReviewModel}
          />
          <AIModelAssignmentField
            description={t('settings.ai.assignment.translationDescription')}
            label={t('settings.ai.assignment.translationLabel')}
            models={providerModels}
            onChange={(translationModel) => updateConfig({ translationModel })}
            providers={providers}
            value={props.value.translationModel}
          />
          <AIModelAssignmentField
            description={t('settings.ai.assignment.insightsDescription')}
            label={t('settings.ai.assignment.insightsLabel')}
            models={providerModels}
            onChange={(insightsModel) => updateConfig({ insightsModel })}
            providers={providers}
            value={props.value.insightsModel}
          />
          <AIModelAssignmentField
            description={t(
              'settings.ai.assignment.insightsTranslationDescription',
            )}
            label={t('settings.ai.assignment.insightsTranslationLabel')}
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
        <h3 className="text-sm font-medium">
          {t('settings.ai.section.featureToggles')}
        </h3>
        <div className="grid gap-4">
          <Switch
            checked={Boolean(props.value.enableSummary)}
            label={t('settings.ai.switch.enableSummary')}
            onCheckedChange={(enableSummary) => updateConfig({ enableSummary })}
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateSummaryOnCreate)}
            disabled={!props.value.enableSummary}
            label={t('settings.ai.switch.enableAutoSummaryCreate')}
            onCheckedChange={(enableAutoGenerateSummaryOnCreate) =>
              updateConfig({ enableAutoGenerateSummaryOnCreate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateSummaryOnUpdate)}
            disabled={!props.value.enableSummary}
            label={t('settings.ai.switch.enableAutoSummaryUpdate')}
            onCheckedChange={(enableAutoGenerateSummaryOnUpdate) =>
              updateConfig({ enableAutoGenerateSummaryOnUpdate })
            }
          />
          <AITextListField
            disabled={!props.value.enableSummary}
            label={t('settings.ai.switch.summaryTargetLanguages')}
            onChange={(summaryTargetLanguages) =>
              updateConfig({ summaryTargetLanguages })
            }
            value={props.value.summaryTargetLanguages ?? []}
          />
          <TextInput
            disabled={!props.value.enableSummary}
            inputMode="numeric"
            label={t('settings.ai.switch.summaryMinTextLength')}
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
            label={t('settings.ai.switch.enableInsights')}
            onCheckedChange={(enableInsights) =>
              updateConfig({ enableInsights })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateInsightsOnCreate)}
            disabled={!props.value.enableInsights}
            label={t('settings.ai.switch.enableAutoInsightsCreate')}
            onCheckedChange={(enableAutoGenerateInsightsOnCreate) =>
              updateConfig({ enableAutoGenerateInsightsOnCreate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateInsightsOnUpdate)}
            disabled={!props.value.enableInsights}
            label={t('settings.ai.switch.enableAutoInsightsUpdate')}
            onCheckedChange={(enableAutoGenerateInsightsOnUpdate) =>
              updateConfig({ enableAutoGenerateInsightsOnUpdate })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoTranslateInsights)}
            disabled={!props.value.enableInsights}
            label={t('settings.ai.switch.enableAutoTranslateInsights')}
            onCheckedChange={(enableAutoTranslateInsights) =>
              updateConfig({ enableAutoTranslateInsights })
            }
          />
          <AITextListField
            disabled={!props.value.enableInsights}
            label={t('settings.ai.switch.insightsTargetLanguages')}
            onChange={(insightsTargetLanguages) =>
              updateConfig({ insightsTargetLanguages })
            }
            value={props.value.insightsTargetLanguages ?? []}
          />
          <TextInput
            disabled={!props.value.enableInsights}
            inputMode="numeric"
            label={t('settings.ai.switch.insightsMinTextLength')}
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
            label={t('settings.ai.switch.enableTranslation')}
            onCheckedChange={(enableTranslation) =>
              updateConfig({ enableTranslation })
            }
          />
          <Switch
            checked={Boolean(props.value.enableAutoGenerateTranslation)}
            disabled={!props.value.enableTranslation}
            label={t('settings.ai.switch.enableAutoTranslate')}
            onCheckedChange={(enableAutoGenerateTranslation) =>
              updateConfig({ enableAutoGenerateTranslation })
            }
          />
          <AITextListField
            disabled={!props.value.enableTranslation}
            label={t('settings.ai.switch.translationTargetLanguages')}
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
