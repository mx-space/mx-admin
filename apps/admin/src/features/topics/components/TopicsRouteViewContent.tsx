import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Hash, Plus } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { TopicFormMode } from '../types/topics'

import { deleteTopic, getTopics } from '~/api/topics'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { MasterDetailLayout } from '~/ui/layout/page-layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { topicPageSize } from '../constants'
import { getErrorMessage } from '../utils/errors'
import { readPositiveInt } from '../utils/search-params'
import { ListEmpty } from './ListEmpty'
import { ListError } from './ListError'
import { TopicDetail } from './TopicDetail'
import { TopicDetailEmpty } from './TopicDetailEmpty'
import { TopicFormDialog } from './TopicFormDialog'
import { TopicListSkeleton } from './TopicListSkeleton'
import { TopicRow } from './TopicRow'

export function TopicsRouteViewContent() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [page, setPage] = useState(readPositiveInt(searchParams.get('page')))
  const [selectedId, setSelectedId] = useState(searchParams.get('id') ?? '')
  const [formMode, setFormMode] = useState<TopicFormMode | null>(null)

  useLayoutEffect(() => {
    const nextPage = readPositiveInt(searchParams.get('page'))
    const nextSelectedId = searchParams.get('id') ?? ''

    setPage((value) => (value === nextPage ? value : nextPage))
    setSelectedId((value) =>
      value === nextSelectedId ? value : nextSelectedId,
    )
  }, [searchParamsKey])

  useEffect(() => {
    const next = new URLSearchParams()
    if (page > 1) next.set('page', String(page))
    if (selectedId) next.set('id', selectedId)
    if (next.toString() !== searchParamsKey) {
      setSearchParams(next, { replace: true })
    }
  }, [page, searchParamsKey, selectedId, setSearchParams])

  const topicsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getTopics({ page, size: topicPageSize }),
    queryKey: ['topics', 'list', page, topicPageSize],
  })

  const topics = topicsQuery.data?.data ?? []
  const pagination = topicsQuery.data?.pagination

  useEffect(() => {
    if (!selectedId || topics.length === 0) return
    if (!topics.some((topic) => topic.id === selectedId)) {
      setSelectedId('')
    }
  }, [selectedId, topics])

  const invalidateTopics = async () => {
    await queryClient.invalidateQueries({ queryKey: ['topics'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteTopic,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除专栏失败')),
    onSuccess: async () => {
      toast.success('专栏已删除')
      setSelectedId('')
      await invalidateTopics()
    },
  })

  return (
    <MasterDetailLayout
      defaultSize={0.34}
      maxSize={0.45}
      minSize={0.25}
      showDetailOnMobile={Boolean(selectedId)}
      list={
        <section className="flex h-full min-h-0 flex-col">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="inline-flex items-center gap-2 text-sm font-medium">
                <Hash aria-hidden="true" className="size-4" />
                专栏列表
              </h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {pagination ? `${pagination.total} 个` : '加载中'}
            </span>
            <Button
              onClick={() => setFormMode({ kind: 'create' })}
              type="button"
              variant="subtle"
            >
              <Plus aria-hidden="true" className="size-4" />
              新建
            </Button>
          </div>

          <Scroll className="flex-1">
            {topicsQuery.isLoading && topics.length === 0 ? (
              <TopicListSkeleton />
            ) : topicsQuery.isError ? (
              <ListError onRetry={() => void topicsQuery.refetch()} />
            ) : topics.length === 0 ? (
              <ListEmpty onCreate={() => setFormMode({ kind: 'create' })} />
            ) : (
              topics.map((topic) => (
                <TopicRow
                  key={topic.id}
                  onSelect={() => setSelectedId(topic.id)}
                  selected={selectedId === topic.id}
                  topic={topic}
                />
              ))
            )}
          </Scroll>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                第 {pagination.page} 页
              </span>
              <CompactPagination
                onPageChange={setPage}
                onPageSizeChange={() => undefined}
                page={page}
                pageCount={pagination.totalPages}
                pageSize={topicPageSize}
                pageSizes={[topicPageSize]}
              />
            </div>
          ) : null}
        </section>
      }
      detail={
        <section className="h-full min-h-0">
          {selectedId ? (
            <TopicDetail
              deleting={deleteMutation.isPending}
              onBack={() => setSelectedId('')}
              onDelete={(topic) => {
                if (window.confirm(`确认删除「${topic.name}」？`)) {
                  deleteMutation.mutate(topic.id)
                }
              }}
              onEdit={(topic) => setFormMode({ id: topic.id, kind: 'edit' })}
              topicId={selectedId}
            />
          ) : (
            <TopicDetailEmpty />
          )}
        </section>
      }
    >
      {formMode ? (
        <TopicFormDialog
          mode={formMode}
          onClose={() => setFormMode(null)}
          onSaved={async (topic) => {
            setFormMode(null)
            setSelectedId(topic.id)
            await invalidateTopics()
          }}
        />
      ) : null}
    </MasterDetailLayout>
  )
}
