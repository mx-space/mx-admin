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
      toast.error(getErrorMessage(error, '词表生成失败')),
    onSuccess: async (result) => {
      toast.success(`已创建 ${result.created} 条，跳过 ${result.skipped} 条`)
      await invalidateEntries()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (entry: TranslationEntry) => {
      const translatedText = window.prompt('译文', entry.translatedText)
      if (translatedText === null) return Promise.resolve(entry)

      return updateTranslationEntry(entry.id, { translatedText })
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '词条保存失败')),
    onSuccess: async () => {
      toast.success('词条已保存')
      await invalidateEntries()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTranslationEntry,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '词条删除失败')),
    onSuccess: async () => {
      toast.success('词条已删除')
      await invalidateEntries()
    },
  })

  return (
    <section className="bg-white dark:bg-neutral-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-medium">翻译词表</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            共 {total} 条词条
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            aria-label="翻译词表路径"
            className="w-40"
            onValueChange={(value) => {
              setKeyPath(value)
              setPage(1)
            }}
            options={[
              { label: '全部路径', value: '' },
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
            placeholder="语言"
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
            生成词表
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
            刷新
          </Button>
        </div>
      </div>

      {query.isLoading && entries.length === 0 ? (
        <GroupedResourceSkeleton />
      ) : query.isError ? (
        <ResourceError onRetry={() => void query.refetch()} />
      ) : entries.length === 0 ? (
        <ResourceEmpty label="词表" />
      ) : (
        <Scroll orientation="horizontal">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">路径</th>
                <th className="px-4 py-3 font-medium">语言</th>
                <th className="px-4 py-3 font-medium">源文本</th>
                <th className="px-4 py-3 font-medium">译文</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
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
                        编辑
                      </Button>
                      <Button
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm('确认删除该词条？')) {
                            deleteMutation.mutate(entry.id)
                          }
                        }}
                        type="button"
                        variant="subtle"
                      >
                        删除
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
            第 {page} 页
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
