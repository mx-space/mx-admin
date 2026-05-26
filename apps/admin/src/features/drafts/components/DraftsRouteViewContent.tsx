import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { DraftModel, DraftRefType } from '~/models/draft'

import { deleteDraft, getDrafts } from '~/api/drafts'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button, ButtonLink } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { draftsQueryKey, filterOptions } from '../constants'
import { parseDraftFilterType } from '../utils/draft-filter'
import { getErrorMessage } from '../utils/errors'
import { DraftDetail } from './DraftDetail'
import { DraftDetailEmpty } from './DraftDetailEmpty'
import { DraftListEmpty } from './DraftListEmpty'
import { DraftListSkeleton } from './DraftListSkeleton'
import { DraftRow } from './DraftRow'

export function DraftsRouteViewContent() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const initialType = parseDraftFilterType(searchParams.get('type'))
  const [filterType, setFilterType] = useState<DraftRefType | 'all'>(
    initialType,
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('id'),
  )
  const [selectedDraftSnapshot, setSelectedDraftSnapshot] =
    useState<DraftModel | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const draftsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getDrafts({
        page: 1,
        refType: filterType === 'all' ? undefined : filterType,
        size: 50,
      }),
    queryKey: [...draftsQueryKey, 'list', filterType],
  })

  const drafts = draftsQuery.data?.data ?? []
  const selectedDraft = useMemo(() => {
    if (!selectedId) return null
    const fromList = drafts.find((draft) => draft.id === selectedId)
    if (fromList) return fromList
    if (selectedDraftSnapshot?.id === selectedId) return selectedDraftSnapshot
    return null
  }, [drafts, selectedDraftSnapshot, selectedId])

  useLayoutEffect(() => {
    const nextType = parseDraftFilterType(searchParams.get('type'))
    const nextSelectedId = searchParams.get('id')

    setFilterType((value) => (value === nextType ? value : nextType))
    setSelectedId((value) =>
      value === nextSelectedId ? value : nextSelectedId,
    )
    setShowDetailOnMobile(Boolean(nextSelectedId))
    if (!nextSelectedId) setSelectedDraftSnapshot(null)
  }, [searchParamsKey])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (filterType === 'all') {
      nextParams.delete('type')
    } else {
      nextParams.set('type', filterType)
    }

    if (selectedId) {
      nextParams.set('id', selectedId)
    } else {
      nextParams.delete('id')
    }

    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [filterType, searchParams, searchParamsKey, selectedId, setSearchParams])

  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('草稿已删除')
      setSelectedId(null)
      setSelectedDraftSnapshot(null)
      setShowDetailOnMobile(false)
      await queryClient.invalidateQueries({ queryKey: draftsQueryKey })
    },
  })

  const handleSelect = (draft: DraftModel) => {
    setSelectedId(draft.id)
    setSelectedDraftSnapshot({ ...draft })
    setShowDetailOnMobile(true)
  }

  const handleFilterChange = (value: DraftRefType | 'all') => {
    setFilterType(value)
    setSelectedId(null)
    setSelectedDraftSnapshot(null)
    setShowDetailOnMobile(false)
  }

  return (
    <MasterDetailLayout
      defaultSize={36}
      list={
        <section className="flex h-full min-h-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-medium">草稿箱</h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {draftsQuery.data?.pagination.total ?? 0} 个
            </span>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 px-2.5"
                disabled={draftsQuery.isFetching}
                onClick={() => void draftsQuery.refetch()}
                type="button"
                variant="subtle"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    draftsQuery.isFetching && 'animate-spin',
                  )}
                />
                刷新
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <ButtonLink className="h-8 px-2.5 text-xs" to="/posts/edit">
              新建文章
            </ButtonLink>
            <ButtonLink
              className="h-8 px-2.5 text-xs"
              to="/notes/edit"
              variant="subtle"
            >
              新建手记
            </ButtonLink>
            <ButtonLink
              className="h-8 px-2.5 text-xs"
              to="/pages/edit"
              variant="subtle"
            >
              新建页面
            </ButtonLink>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            {filterOptions.map((option) => (
              <button
                className={cn(
                  'rounded border px-2.5 py-1 text-xs transition-colors',
                  filterType === option.value
                    ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900',
                )}
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <Scroll className="flex-1">
            {draftsQuery.isLoading && drafts.length === 0 ? (
              <DraftListSkeleton />
            ) : drafts.length === 0 ? (
              <DraftListEmpty />
            ) : (
              drafts.map((draft) => (
                <DraftRow
                  draft={draft}
                  key={draft.id}
                  onSelect={() => handleSelect(draft)}
                  selected={selectedDraft?.id === draft.id}
                />
              ))
            )}
          </Scroll>
        </section>
      }
      showDetailOnMobile={showDetailOnMobile}
      detail={
        <section className="h-full min-h-0">
          {selectedDraft ? (
            <DraftDetail
              deleting={deleteMutation.isPending}
              draft={selectedDraft}
              onBack={() => setShowDetailOnMobile(false)}
              onDelete={(draft) => {
                if (
                  window.confirm(`确认删除「${draft.title || '无标题'}」？`)
                ) {
                  deleteMutation.mutate(draft.id)
                }
              }}
            />
          ) : (
            <DraftDetailEmpty />
          )}
        </section>
      }
    />
  )
}
