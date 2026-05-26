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
import { Button } from '~/ui/button'

import {
  editInsightsItem,
  editSummaryItem,
  editTranslationItem,
  getErrorMessage,
  getTaskMutationMessage,
} from '../utils/ai'
import { AiGroupedResourceSurface } from './AiGroupedResourceSurface'

export function SummariesSurface() {
  return (
    <AiGroupedResourceSurface
      createTask={(article) => createSummaryTask({ refId: article.id })}
      createTaskLabel="生成摘要"
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
          label: '编辑',
          run: () => editSummaryItem(item as AISummary),
        },
      ]}
      queryFn={getSummariesGrouped}
      queryKey="summaries"
      title="摘要"
    />
  )
}

export function TranslationsSurface() {
  const queryClient = useQueryClient()
  const allMutation = useMutation({
    mutationFn: () => createTranslationAllTask({}),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '全量翻译任务创建失败')),
    onSuccess: async (result) => {
      toast.success(
        result.created ? '已创建全量翻译任务' : '全量翻译任务已存在',
      )
      await queryClient.invalidateQueries({ queryKey: ['ai', 'tasks'] })
    },
  })

  return (
    <AiGroupedResourceSurface
      createTask={(article) => createTranslationTask({ refId: article.id })}
      createTaskLabel="生成翻译"
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
          全量翻译
        </Button>
      }
      itemActions={(item) => [
        {
          label: '编辑',
          run: () => editTranslationItem(item as AITranslation),
        },
        {
          getSuccessMessage: getTaskMutationMessage,
          label: '重翻译',
          run: () =>
            createTranslationTask({
              refId: item.refId,
              targetLanguages: [item.lang],
            }),
        },
      ]}
      queryFn={getTranslationsGrouped}
      queryKey="translations"
      title="翻译"
    />
  )
}

export function InsightsSurface() {
  return (
    <AiGroupedResourceSurface
      createTask={(article) => createInsightsTask({ refId: article.id })}
      createTaskLabel="生成精读"
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
            label: '编辑',
            run: () => editInsightsItem(insight),
          },
          {
            getSuccessMessage: getTaskMutationMessage,
            label: '翻译',
            run: () => {
              const targetLang = window
                .prompt('目标语言（ISO 639-1）', 'en')
                ?.trim()
                .toLowerCase()

              if (!targetLang) return Promise.resolve({ cancelled: true })
              if (targetLang.length !== 2) {
                throw new Error('请填写合法的 ISO 639-1 语言代码')
              }

              return createInsightsTranslationTask({
                refId: insight.refId,
                targetLang,
              })
            },
          },
          {
            getSuccessMessage: getTaskMutationMessage,
            label: insight.isTranslation ? '重翻译' : '重生成',
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
      title="精读"
    />
  )
}
