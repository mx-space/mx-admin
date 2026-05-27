import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, WandSparkles } from 'lucide-react'
import { toast } from 'sonner'

import { createSlugBackfillTask, getSlugBackfillStatus } from '~/api/ai'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'

import { getErrorMessage } from '../utils/ai'
import { Code } from './AiPrimitives'
import {
  GroupedResourceSkeleton,
  ResourceEmpty,
  ResourceError,
} from './GroupedResourceStates'
import { WriterGeneratePanel } from './WriterGeneratePanel'

export function SlugBackfillSurface() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryFn: getSlugBackfillStatus,
    queryKey: ['ai', 'slug-backfill'],
  })

  const mutation = useMutation({
    mutationFn: createSlugBackfillTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.slugTaskFailed'))),
    onSuccess: async (result) => {
      toast.success(
        result.created
          ? t('ai.toast.slugTaskCreated')
          : t('ai.toast.taskExists'),
      )
      await queryClient.invalidateQueries({ queryKey: ['ai', 'slug-backfill'] })
      await queryClient.invalidateQueries({ queryKey: ['ai', 'tasks'] })
    },
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <section className="bg-white dark:bg-neutral-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-medium">{t('ai.slug.title')}</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {query.data
                ? t('ai.slug.missingCount', { count: query.data.count })
                : t('ai.slug.statusLoading')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
              type="button"
              variant="subtle"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('size-4', query.isFetching && 'animate-spin')}
              />
              {t('ai.action.refresh')}
            </Button>
            <Button
              disabled={mutation.isPending || !query.data?.count}
              onClick={() => mutation.mutate()}
              type="button"
            >
              {mutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <WandSparkles aria-hidden="true" className="size-4" />
              )}
              {t('ai.action.createBackfill')}
            </Button>
          </div>
        </div>
        {query.isLoading ? (
          <GroupedResourceSkeleton />
        ) : query.isError ? (
          <ResourceError onRetry={() => void query.refetch()} />
        ) : query.data?.notes.length ? (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {query.data.notes.map((note) => (
              <div
                className="grid gap-2 px-4 py-3 sm:grid-cols-[6rem_minmax(0,1fr)]"
                key={note.id}
              >
                <Code>{note.nid}</Code>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
                    {note.title || note.id}
                  </p>
                  <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {note.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ResourceEmpty label={t('ai.empty.missingSlugNotes')} />
        )}
      </section>

      <WriterGeneratePanel />
    </div>
  )
}
