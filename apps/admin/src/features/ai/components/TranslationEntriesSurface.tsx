import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { TranslationEntry, TranslationEntryKeyPath } from '~/api/ai'

import {
  deleteTranslationEntry,
  generateTranslationEntries,
  getTranslationEntries,
  updateTranslationEntry,
} from '~/api/ai'
import { useI18n } from '~/i18n'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { TextInput } from '~/ui/primitives/text-field'
import { cn } from '~/utils/cn'

import { translationEntryKeyPathOptions } from '../constants'
import { getErrorMessage } from '../utils/ai'
import { Code, SmallBadge } from './AiPrimitives'
import {
  GroupedResourceSkeleton,
  ResourceEmpty,
  ResourceError,
} from './GroupedResourceStates'

export function TranslationEntriesSurface() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [keyPath, setKeyPath] = useState<TranslationEntryKeyPath | ''>('')
  const [lang, setLang] = useState('')
  const params = {
    keyPath: keyPath || undefined,
    lang: lang.trim() || undefined,
    page,
    size: 50,
  }

  const query = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getTranslationEntries(params),
    queryKey: ['ai', 'translation-entries', params],
  })

  const entries = query.data?.data ?? []
  const total = query.data?.pagination.total ?? entries.length
  const pageCount = Math.max(1, Math.ceil(total / params.size))

  const invalidateEntries = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['ai', 'translation-entries'],
    })
  }

  const generateMutation = useMutation({
    mutationFn: () => generateTranslationEntries(),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.entryGenerateFailed'))),
    onSuccess: async (result) => {
      toast.success(
        t('ai.toast.entryGenerated', {
          created: result.created,
          skipped: result.skipped,
        }),
      )
      await invalidateEntries()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (entry: TranslationEntry) => {
      const translatedText = window.prompt(
        t('ai.edit.translatedTextPrompt'),
        entry.translatedText,
      )
      if (translatedText === null) return Promise.resolve(entry)

      return updateTranslationEntry(entry.id, { translatedText })
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.entrySaveFailed'))),
    onSuccess: async () => {
      toast.success(t('ai.toast.entrySaved'))
      await invalidateEntries()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTranslationEntry,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('ai.toast.entryDeleteFailed'))),
    onSuccess: async () => {
      toast.success(t('ai.toast.entryDeleted'))
      await invalidateEntries()
    },
  })

  return (
    <section className="bg-white dark:bg-neutral-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-medium">{t('ai.translation.title')}</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {t('ai.translation.entryCountSuffix', { count: total })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            aria-label={t('ai.filter.keyPathAria')}
            className="w-40"
            onValueChange={(value) => {
              setKeyPath(value)
              setPage(1)
            }}
            options={[
              { label: t('ai.filter.allKeyPath'), value: '' },
              ...translationEntryKeyPathOptions.map((option) => ({
                label: option,
                value: option,
              })),
            ]}
            value={keyPath}
          />
          <TextInput
            controlClassName="h-9 w-28 focus:border-neutral-400"
            onChange={(value) => {
              setLang(value)
              setPage(1)
            }}
            placeholder={t('ai.filter.langPlaceholder')}
            value={lang}
          />
          <Button
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
            type="button"
            variant="subtle"
          >
            {generateMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" className="size-4" />
            )}
            {t('ai.action.generateEntries')}
          </Button>
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
        </div>
      </div>

      {query.isLoading && entries.length === 0 ? (
        <GroupedResourceSkeleton />
      ) : query.isError ? (
        <ResourceError onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <ResourceEmpty label={t('ai.tab.entries')} />
      ) : (
        <Scroll orientation="horizontal">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">
                  {t('ai.translation.column.path')}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t('ai.translation.column.lang')}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t('ai.translation.column.source')}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t('ai.translation.column.translated')}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {t('ai.translation.column.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 align-top">
                    <Code>{entry.keyPath}</Code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <SmallBadge tone="info">{entry.lang}</SmallBadge>
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top text-neutral-700 dark:text-neutral-300">
                    {entry.sourceText}
                  </td>
                  <td className="max-w-md px-4 py-3 align-top text-neutral-700 dark:text-neutral-300">
                    {entry.translatedText || '-'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      <Button
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate(entry)}
                        type="button"
                        variant="subtle"
                      >
                        {t('ai.action.edit')}
                      </Button>
                      <Button
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(t('ai.confirm.deleteEntry'))) {
                            deleteMutation.mutate(entry.id)
                          }
                        }}
                        type="button"
                        variant="subtle"
                      >
                        {t('ai.action.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Scroll>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
            {t('ai.page.pageIndex', { page })}
          </span>
          <CompactPagination
            onPageChange={setPage}
            onPageSizeChange={() => undefined}
            page={page}
            pageCount={pageCount}
            pageSize={params.size}
            pageSizes={[params.size]}
          />
        </div>
      ) : null}
    </section>
  )
}
