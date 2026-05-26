import { Loader2, Users } from 'lucide-react'

import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { useReadersList } from '../hooks/useReadersList'
import { ReaderEmptyState } from './ReaderEmptyState'
import { ReaderItem } from './ReaderItem'

export function ReadersRouteViewContent() {
  const {
    hasNextPage,
    loadMoreRef,
    loadNextPage,
    pagination,
    readers,
    readersQuery,
    scrollContainerRef,
  } = useReadersList()

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            <Users aria-hidden="true" className="size-4" />
            读者
          </h2>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {pagination ? `${pagination.total} 位` : '加载中'}
        </span>
      </div>

      <Scroll className="flex-1" ref={scrollContainerRef}>
        <div className="mx-auto max-w-4xl">
          {readersQuery.isLoading && readers.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
              Loading readers...
            </div>
          ) : readers.length === 0 ? (
            <ReaderEmptyState />
          ) : (
            <div>
              {readers.map((reader) => (
                <ReaderItem data={reader} key={reader._key} />
              ))}
              {hasNextPage ? <div ref={loadMoreRef} /> : null}
            </div>
          )}
        </div>
      </Scroll>

      {pagination ? (
        <div className="flex shrink-0 items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <span>
            已加载 {readers.length} / {pagination.total}
          </span>
          <Button
            disabled={!hasNextPage || readersQuery.isFetching}
            onClick={loadNextPage}
            type="button"
            variant="subtle"
          >
            {readersQuery.isFetching ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {hasNextPage ? '加载更多' : '已全部加载'}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
