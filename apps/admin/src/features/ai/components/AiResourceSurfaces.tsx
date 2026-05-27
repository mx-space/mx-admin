import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Languages, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type {
  AIInsights,
  AISummary,
  AITranslation,
  GroupedInsightsResponse,
  GroupedSummaryResponse,
  GroupedTranslationResponse,
} from '~/api/ai'

import {
  createInsightsTask,
  createInsightsTranslationTask,
  createSummaryTask,
  createTranslationAllTask,
  createTranslationTask,
  deleteInsights,
  deleteSummary,
  deleteTranslation,
  getInsightsGrouped,
  getSummariesGrouped,
  getTranslationsGrouped,
} from '~/api/ai'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'

import {
  editInsightsItem,
  editSummaryItem,
  editTranslationItem,
  getErrorMessage,
  getTaskMutationMessage,
} from '../utils/ai'
import { AiGroupedResourceSurface } from './AiGroupedResourceSurface'

export function SummariesSurface() {
  const { t } = useI18n()

  return (
    <AiGroupedResourceSurface
      createTask={(article) => createSummaryTask({ refId: article.id })}
      createTaskLabel={t('ai.action.generateSummary')}
      deleteItem={deleteSummary}
      getGroups={(response: GroupedSummaryResponse) =>
        response.data.map((group) => ({
          article: group.article,
          items: group.summaries,
        }))
      }
      getPreview={(item: AISummary) => item.summary}
      itemActions={(item) => [
        {
          label: t('ai.action.edit'),
          run: () => editSummaryItem(item as AISummary, t),
        },
      ]}
      queryFn={getSummariesGrouped}
      queryKey="summaries"
      title={t('ai.surface.summaries')}
    />
  )
}

export function TranslationsSurface() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const allMutation = useMutation({
    mutationFn: () => createTranslationAllTask({}),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.translationAllFailed'))),
    onSuccess: async (result) => {
      toast.success(
        result.created
          ? t('ai.toast.translationAllCreated')
          : t('ai.toast.translationAllExists'),
      )
      await queryClient.invalidateQueries({ queryKey: ['ai', 'tasks'] })
    },
  })

  return (
    <AiGroupedResourceSurface
      createTask={(article) => createTranslationTask({ refId: article.id })}
      createTaskLabel={t('ai.action.generateTranslation')}
      deleteItem={deleteTranslation}
      getGroups={(response: GroupedTranslationResponse) =>
        response.data.map((group) => ({
          article: group.article,
          items: group.translations,
        }))
      }
      getPreview={(item: AITranslation) =>
        [item.title, item.subtitle, item.summary, item.text]
          .filter(Boolean)
          .join('\n')
      }
      headerAction={
        <Button
          disabled={allMutation.isPending}
          onClick={() => allMutation.mutate()}
          type="button"
          variant="subtle"
        >
          {allMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Languages aria-hidden="true" className="size-4" />
          )}
          {t('ai.action.translateAll')}
        </Button>
      }
      itemActions={(item) => [
        {
          label: t('ai.action.edit'),
          run: () => editTranslationItem(item as AITranslation, t),
        },
        {
          getSuccessMessage: getTaskMutationMessage,
          label: t('ai.action.retranslate'),
          run: () =>
            createTranslationTask({
              refId: item.refId,
              targetLanguages: [item.lang],
            }),
        },
      ]}
      queryFn={getTranslationsGrouped}
      queryKey="translations"
      title={t('ai.surface.translations')}
    />
  )
}

export function InsightsSurface() {
  const { t } = useI18n()

  return (
    <AiGroupedResourceSurface
      createTask={(article) => createInsightsTask({ refId: article.id })}
      createTaskLabel={t('ai.action.generateInsights')}
      deleteItem={deleteInsights}
      getGroups={(response: GroupedInsightsResponse) =>
        response.data.map((group) => ({
          article: group.article,
          items: group.insights,
        }))
      }
      getPreview={(item: AIInsights) => item.content}
      itemActions={(item) => {
        const insight = item as AIInsights

        return [
          {
            label: t('ai.action.edit'),
            run: () => editInsightsItem(insight, t),
          },
          {
            getSuccessMessage: getTaskMutationMessage,
            label: t('ai.action.translate'),
            run: () => {
              const targetLang = window
                .prompt(t('ai.edit.targetLangPrompt'), 'en')
                ?.trim()
                .toLowerCase()

              if (!targetLang) return Promise.resolve({ cancelled: true })
              if (targetLang.length !== 2) {
                throw new Error(t('ai.edit.invalidLangCode'))
              }

              return createInsightsTranslationTask({
                refId: insight.refId,
                targetLang,
              })
            },
          },
          {
            getSuccessMessage: getTaskMutationMessage,
            label: insight.isTranslation
              ? t('ai.action.retranslate')
              : t('ai.action.regenerate'),
            run: () =>
              insight.isTranslation
                ? createInsightsTranslationTask({
                    refId: insight.refId,
                    targetLang: insight.lang,
                  })
                : createInsightsTask({ refId: insight.refId }),
          },
        ]
      }}
      queryFn={getInsightsGrouped}
      queryKey="insights"
      title={t('ai.surface.insights')}
    />
  )
}
